import { Injectable, Logger } from '@nestjs/common';
import type { BreakingAlert, BreakingArticle, BreakingStatus } from '@newpick/shared';
import { MysqlPrismaService } from 'src/prisma/mysql.service';
import { AiService } from 'src/ai/ai.service';
import { MailService } from 'src/mail/mail.service';
import { AppException } from 'src/common/errors/app.exception';
import { cosine } from 'src/ai-summary/article-prep';
import { env } from 'src/config/env';
import type { CrawledNews } from 'src/crawling/schema/crawling.schema';
import {
	BREAKING_LIMITS,
	BREAKING_SCHEMA,
	BREAKING_SYSTEM,
	BreakingEvent,
	BreakingInput,
	breakingPrompt,
	eventsFrom,
} from './breaking';

const HOUR = 60 * 60 * 1000;

const articlesOf = (value: unknown): BreakingArticle[] => (Array.isArray(value) ? (value as BreakingArticle[]) : []);

/**
 * 속보 후보 찾기 · 관리자 확인 (속보 뉴스레터 1단계).
 * 매시 수집 뒤 새 기사 제목을 판정해 기준(BREAKING_LIMITS.minScore)을 넘는 사건만 '확인 대기'로 남기고, 운영자에게 알린다.
 * 관리자가 승인 · 기각한다. 승인한 속보를 뉴스레터로 만들어 보내는 것은 2단계
 */
@Injectable()
export class BreakingService {
	private readonly logger = new Logger(BreakingService.name);

	constructor(
		private readonly prisma: MysqlPrismaService,
		private readonly ai: AiService,
		private readonly mail: MailService,
	) {}

	/** 매시 수집 뒤: 새로 모은 기사로 속보 후보를 판정해 남긴다. 남긴 후보 수 */
	async detect(news: CrawledNews[] | undefined) {
		const articles: BreakingInput[] = (news ?? [])
			.filter((n) => n.title?.trim())
			.slice(-BREAKING_LIMITS.maxArticles)
			.map((n) => ({ title: n.title.trim(), link: n.link, source: n.source, category: n.category?.[0] ?? '' }));
		if (!articles.length) return 0;

		let events: BreakingEvent[];
		try {
			// 오픈 모델(무료)이 먼저, 안 되면 하루 예산 안에서 Claude로: 속보를 놓치지 않게
			const { text } = await this.ai.generate({
				stage: 'breaking-judge',
				prefer: 'open',
				system: BREAKING_SYSTEM,
				prompt: breakingPrompt(articles),
				schema: BREAKING_SCHEMA,
				maxTokens: 800,
			});
			events = eventsFrom(JSON.parse(text), articles);
		} catch (error) {
			this.logger.warn(`속보 판정 실패 (이번 회차는 건너뜀): ${(error as Error).message}`);
			return 0;
		}
		if (!events.length) return 0;

		const fresh = await this.withoutRepeats(events);
		if (!fresh.length) return 0;
		await this.prisma.breakingAlert.createMany({
			data: fresh.map((e) => ({
				score: e.score,
				headline: e.headline,
				reason: e.reason,
				articles: e.articles.map(({ title, link, source }) => ({ title, link, source })),
			})),
		});
		this.logger.warn(`속보 후보 ${fresh.length}건: ${fresh.map((e) => `[${e.score}] ${e.headline}`).join(' / ')}`);
		await this.notify(fresh).catch((error) =>
			this.logger.warn(`속보 후보 알림 메일 실패: ${(error as Error).message}`),
		);
		return fresh.length;
	}

	/**
	 * 같은 사건은 두 번 올리지 않는다: 최근 후보와 관련 기사가 겹치거나, 사건 한 줄이 아주 비슷하면 뺀다.
	 * 이번 판정 안에서도 서로 견준다. 임베딩을 못 하면 기사 겹침만 본다
	 */
	private async withoutRepeats(events: BreakingEvent[]) {
		const recent = await this.prisma.breakingAlert.findMany({
			where: { detectedAt: { gte: new Date(Date.now() - BREAKING_LIMITS.dedupeHours * HOUR) } },
			select: { headline: true, articles: true },
		});
		let vectors: number[][] | null = null;
		try {
			vectors = await this.ai.embed([...events.map((e) => e.headline), ...recent.map((r) => r.headline)]);
		} catch {
			vectors = null;
		}
		const kept: number[] = [];
		const links = (i: number) =>
			new Set(
				i < events.length
					? events[i].articles.map((a) => a.link)
					: articlesOf(recent[i - events.length].articles).map((a) => a.link),
			);
		const same = (i: number, j: number) => {
			const a = links(i);
			if ([...links(j)].some((link) => a.has(link))) return true;
			return !!vectors && cosine(vectors[i], vectors[j]) >= BREAKING_LIMITS.sameEvent;
		};
		events.forEach((_, i) => {
			const seen = [...kept, ...recent.map((_, r) => events.length + r)];
			if (!seen.some((j) => same(i, j))) kept.push(i);
		});
		return kept.map((i) => events[i]);
	}

	/** 운영자에게 알림 (ADMIN_NOTIFY_EMAIL이 있을 때만): 관리자 › 속보에서 확인하도록 */
	private async notify(events: BreakingEvent[]) {
		const to = env.adminNotifyEmail;
		if (!to) return;
		const link = `${env.frontendUrl}/admin/breaking`;
		const html = [
			'<p>속보 후보가 있습니다. 관리자 화면에서 확인해 주세요. 확인하기 전에는 보내지 않습니다.</p>',
			...events.map(
				(e) =>
					`<p><strong>[${e.score}점] ${escape(e.headline)}</strong><br>${escape(e.reason)}</p><ul>${e.articles
						.map((a) => `<li><a href="${escape(a.link)}">${escape(a.title)}</a> (${escape(a.source)})</li>`)
						.join('')}</ul>`,
			),
			`<p><a href="${escape(link)}">관리자 › 속보 열기</a></p>`,
		].join('');
		await this.mail.sendHtmlMail(to, '', html, `[속보 후보] ${events[0].headline}`);
	}

	/** 관리자 › 속보: 최근 후보 (새것부터) */
	async list(): Promise<BreakingAlert[]> {
		const rows = await this.prisma.breakingAlert.findMany({ orderBy: { detectedAt: 'desc' }, take: 50 });
		return rows.map((row) => ({
			id: row.id,
			status: row.status as BreakingStatus,
			score: row.score,
			headline: row.headline,
			reason: row.reason,
			articles: articlesOf(row.articles),
			detectedAt: row.detectedAt.toISOString(),
			decidedAt: row.decidedAt?.toISOString() ?? null,
		}));
	}

	/** 승인 · 기각: 확인 대기인 후보만. 이미 처리한 것은 CONFLICT */
	async decide(id: number, decision: 'approve' | 'reject', userId: number) {
		const { count } = await this.prisma.breakingAlert.updateMany({
			where: { id, status: 'pending' },
			data: { status: decision === 'approve' ? 'approved' : 'rejected', decidedAt: new Date(), decidedBy: userId },
		});
		if (count) return { id, status: decision === 'approve' ? 'approved' : 'rejected' };
		const exists = await this.prisma.breakingAlert.findUnique({ where: { id }, select: { id: true } });
		throw new AppException(exists ? 'CONFLICT' : 'NOT_FOUND');
	}
}

const escape = (text: string) =>
	text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
