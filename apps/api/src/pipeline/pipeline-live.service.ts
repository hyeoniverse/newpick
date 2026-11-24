import { Injectable, Logger } from '@nestjs/common';
import type {
	PipelineCategory,
	PipelineKind,
	PipelineLive,
	PipelineRun,
	PipelineState,
	PipelineStep,
} from '@newpick/shared';
import { MysqlPrismaService } from 'src/prisma/mysql.service';
import { AiService } from 'src/ai/ai.service';
import { clusterArticles, embeddingText, prepare } from 'src/ai-summary/article-prep';
import { errorMessage } from 'src/common/error-message';
import { PIPELINE_LIMITS, PIPELINE_STEPS, clusterLabel, keywordsOf } from './pipeline';

/** 수집한 기사 가운데 과정 보기에 쓰는 것 (제목은 키워드 · 묶음 이름을 뽑는 데만 쓰고 내보내지 않는다) */
export type PipelineArticle = { title: string; content?: string; category?: string[] };

const KINDS: PipelineKind[] = ['crawl', 'summary'];

/**
 * 홈 '지금 뉴픽은': 매시 수집 · 매일 아침 뉴스레터 만들기의 진행을 메모리에 들고 있다가(브라우저가 몇 초마다 묻는다),
 * 끝나면 DB에 남긴다(서버를 다시 켜도 마지막 결과가 보이게). 기록이 실패해도 수집 · 요약에는 영향이 없다.
 * 다음 예약 시각은 SchedulerService가 알려 준다 (서로 모듈을 물지 않게)
 */
@Injectable()
export class PipelineLiveService {
	private readonly logger = new Logger(PipelineLiveService.name);
	private readonly runs = new Map<PipelineKind, PipelineRun>();
	private loaded = false;
	private nextTimes: () => PipelineLive['next'] = () => ({ crawl: null, summary: null });

	constructor(
		private readonly prisma: MysqlPrismaService,
		private readonly ai: AiService,
	) {}

	/** 다음 예약 시각을 알려 줄 곳 (SchedulerService) */
	setNextTimes(fn: () => PipelineLive['next']) {
		this.nextTimes = fn;
	}

	begin(kind: PipelineKind) {
		this.runs.set(kind, {
			kind,
			status: 'running',
			startedAt: new Date().toISOString(),
			finishedAt: null,
			steps: PIPELINE_STEPS[kind].map((step) => ({ ...step, state: 'waiting' })),
			categories: [],
			keywords: [],
			clusters: [],
		});
	}

	/** 단계 하나 바꾸기 (도는 중일 때만) */
	step(kind: PipelineKind, key: string, patch: Partial<Omit<PipelineStep, 'key' | 'label'>>) {
		const step = this.active(kind)?.steps.find((s) => s.key === key);
		if (step) Object.assign(step, patch);
	}

	/** 분야 하나 바꾸기: 없으면 더한다 */
	category(kind: PipelineKind, name: string, patch: Partial<Omit<PipelineCategory, 'name'>>) {
		const run = this.active(kind);
		if (!run) return;
		const found = run.categories.find((c) => c.name === name);
		if (found) Object.assign(found, patch);
		else run.categories.push({ name, count: 0, ...patch });
	}

	/**
	 * 수집한 기사로 분야별 건수 · 키워드 · 같은 사건 묶음을 채운다 (AI 생성 호출 없음).
	 * 묶기는 뉴스레터 쓸 때와 같은 방식: 제목이 비슷하거나 임베딩(무료 오픈 모델)이 비슷하면. 임베딩을 못 하면 제목만
	 */
	async describe(kind: PipelineKind, articles: PipelineArticle[]) {
		const run = this.active(kind);
		if (!run) return;
		const counts = new Map<string, number>();
		for (const article of articles) {
			const name = article.category?.at(-1);
			if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
		}
		run.categories = [...counts].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
		run.keywords = keywordsOf(articles.map((a) => a.title));

		const prepared = prepare(articles.map((a) => ({ title: a.title, content: a.content ?? '' })));
		let vectors: number[][] | undefined;
		if (prepared.length > 1) {
			try {
				vectors = await this.ai.embed(prepared.map(embeddingText));
			} catch (error) {
				this.logger.warn(`과정 보기 묶기: 임베딩 실패, 제목으로만 (${errorMessage(error)})`);
			}
		}
		run.clusters = clusterArticles(prepared, vectors)
			.filter((cluster) => cluster.articles.length >= 2)
			.slice(0, PIPELINE_LIMITS.clusters)
			.map((cluster) => ({ label: clusterLabel(cluster.articles.map((a) => a.title)), size: cluster.articles.length }));
		this.step(kind, 'cluster', { count: run.clusters.length });
	}

	/** 끝: 아직 기다리는 단계는 건너뜀으로, 도는 단계는 결과에 따라 */
	async finish(kind: PipelineKind, status: 'done' | 'failed') {
		const run = this.active(kind);
		if (!run) return;
		run.status = status;
		run.finishedAt = new Date().toISOString();
		const close = (state: PipelineState): PipelineState =>
			state === 'running' ? (status === 'done' ? 'done' : 'failed') : state === 'waiting' ? 'skipped' : state;
		for (const step of run.steps) step.state = close(step.state);
		for (const category of run.categories) if (category.state) category.state = close(category.state);
		try {
			await this.prisma.pipelineSnapshot.upsert({
				where: { kind },
				create: { kind, data: run as object },
				update: { data: run as object },
			});
		} catch (error) {
			this.logger.warn(`과정 기록 실패 (${kind}): ${errorMessage(error)}`);
		}
	}

	/** 홈: 마지막(또는 지금 도는) 수집 · 뉴스레터 만들기와 다음 예약 시각 */
	async live(): Promise<PipelineLive> {
		if (!this.loaded) await this.load();
		return {
			crawl: this.runs.get('crawl') ?? null,
			summary: this.runs.get('summary') ?? null,
			next: this.nextTimes(),
		};
	}

	private active(kind: PipelineKind) {
		const run = this.runs.get(kind);
		return run?.status === 'running' ? run : undefined;
	}

	/** 서버를 켠 뒤 처음 물을 때: 남겨 둔 마지막 결과 (메모리에 이미 도는 것이 있으면 그것) */
	private async load() {
		this.loaded = true;
		try {
			const rows = await this.prisma.pipelineSnapshot.findMany({ where: { kind: { in: KINDS } } });
			for (const row of rows) {
				const kind = row.kind as PipelineKind;
				if (!this.runs.has(kind)) this.runs.set(kind, row.data as unknown as PipelineRun);
			}
		} catch (error) {
			this.logger.warn(`과정 기록 읽기 실패: ${errorMessage(error)}`);
		}
	}
}
