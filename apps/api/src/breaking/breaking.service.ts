import { Injectable, Logger } from '@nestjs/common';
import type { BreakingAdminView, BreakingArticle, BreakingNotice, BreakingStatus } from '@newpick/shared';
import { MysqlPrismaService } from 'src/prisma/mysql.service';
import { AiService } from 'src/ai/ai.service';
import { MailService } from 'src/mail/mail.service';
import { AppException } from 'src/common/errors/app.exception';
import { cosine } from 'src/ai-summary/article-prep';
import { env } from 'src/config/env';
import { kstDayRange, toKstDate } from 'src/common/kst';
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
const MINUTE = 60 * 1000;
/** 자동 발송 스위치가 든 행 (schedule_configs) */
const CONFIG_ID = 1;

const articlesOf = (value: unknown): BreakingArticle[] => (Array.isArray(value) ? (value as BreakingArticle[]) : []);

/**
 * 속보 찾기 · 자동 발송 예약 (속보 뉴스레터 1단계).
 * 매시 수집 뒤 새 기사 제목을 판정해 기준(BREAKING_LIMITS.minScore)을 넘는 사건을 '발송 예정'으로 두고(holdMinutes 뒤),
 * 운영자에게 알린다. 그 사이 관리자가 '보내지 않기'로 막거나 '지금 바로 보내기'로 당길 수 있다.
 * 자동 발송이 꺼져 있거나 하루 상한을 넘으면 '보류'로 남는다. 메일로 실제 보내는 것은 2단계 (홈 속보 띠는 이 단계부터 보인다)
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
			.map((n) => ({
				title: n.title.trim(),
				link: n.link,
				source: n.source,
				category: n.category?.[0] ?? '',
				// 홈 큰 속보 칸에 쓸 사진 (수집할 때 모은 대표 사진)
				...(n.images?.[0] ? { image: n.images[0] } : {}),
			}));
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
		// 자동 발송이 꺼져 있거나 오늘 상한을 채웠으면 보류 (관리자가 직접 보낼 수 있다)
		const auto = await this.isAuto();
		const today = kstDayRange(toKstDate(new Date()), toKstDate(new Date()));
		let used = await this.prisma.breakingAlert.count({
			where: { status: { in: ['scheduled', 'sent'] }, detectedAt: { gte: today.start, lte: today.end } },
		});
		const sendAt = new Date(Date.now() + BREAKING_LIMITS.holdMinutes * MINUTE);
		const rows = fresh.map((e) => {
			const scheduled = auto && used < BREAKING_LIMITS.dailyLimit;
			if (scheduled) used++;
			return {
				status: scheduled ? 'scheduled' : 'held',
				sendAt: scheduled ? sendAt : null,
				score: e.score,
				headline: e.headline,
				reason: e.reason,
				articles: e.articles.map(({ title, link, source, image }) => ({
					title,
					link,
					source,
					...(image ? { image } : {}),
				})),
			};
		});
		await this.prisma.breakingAlert.createMany({ data: rows });
		this.logger.warn(
			`속보 ${rows.length}건: ${rows.map((r) => `[${r.score}·${r.status === 'scheduled' ? '발송 예정' : '보류'}] ${r.headline}`).join(' / ')}`,
		);
		await this.notify(rows).catch((error) => this.logger.warn(`속보 알림 메일 실패: ${(error as Error).message}`));
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

	/**
	 * 운영자에게 알림 (ADMIN_NOTIFY_EMAIL이 있을 때만): 몇 분 뒤 저절로 나가니 이상하면 관리자 › 속보에서 막도록.
	 * 메일 링크를 누르자마자 취소하지는 않는다 (메일 프로그램이 링크를 미리 열어 보면 저절로 취소될 수 있다)
	 */
	private async notify(
		rows: { status: string; score: number; headline: string; reason: string; articles: BreakingArticle[] }[],
	) {
		const to = env.adminNotifyEmail;
		if (!to) return;
		const link = `${env.frontendUrl}/admin/breaking`;
		const html = [
			`<p>속보를 찾았습니다. <strong>발송 예정</strong>인 것은 ${BREAKING_LIMITS.holdMinutes}분 뒤 저절로 나갑니다. 잘못 판정했으면 관리자 › 속보에서 '보내지 않기'를 눌러 주세요.</p>`,
			...rows.map(
				(r) =>
					`<p><strong>[${r.score}점 · ${r.status === 'scheduled' ? '발송 예정' : '보류'}] ${escape(r.headline)}</strong><br>${escape(r.reason)}</p><ul>${r.articles
						.map((a) => `<li><a href="${escape(a.link)}">${escape(a.title)}</a> (${escape(a.source)})</li>`)
						.join('')}</ul>`,
			),
			`<p><a href="${escape(link)}">관리자 › 속보 열기</a></p>`,
		].join('');
		await this.mail.sendHtmlMail(to, '', html, `[속보] ${rows[0].headline}`);
	}

	/** 자동 발송 스위치 (행이 없으면 켜짐) */
	private async isAuto() {
		const row = await this.prisma.scheduleConfig.findUnique({
			where: { id: CONFIG_ID },
			select: { breakingAuto: true },
		});
		return row?.breakingAuto ?? true;
	}

	/** 자동 발송 켜기 · 끄기 (끄면 새 후보는 보류. 이미 발송 예정인 것은 그대로라 따로 막는다) */
	async setAuto(auto: boolean) {
		await this.prisma.scheduleConfig.upsert({
			where: { id: CONFIG_ID },
			create: { id: CONFIG_ID, breakingAuto: auto },
			update: { breakingAuto: auto },
		});
		return { auto };
	}

	/** 관리자 › 속보: 자동 발송 스위치 + 최근 속보 (새것부터) */
	async adminView(): Promise<BreakingAdminView> {
		const [auto, rows] = await Promise.all([
			this.isAuto(),
			this.prisma.breakingAlert.findMany({ orderBy: { detectedAt: 'desc' }, take: 50 }),
		]);
		return {
			auto,
			dailyLimit: BREAKING_LIMITS.dailyLimit,
			holdMinutes: BREAKING_LIMITS.holdMinutes,
			alerts: rows.map((row) => ({
				id: row.id,
				status: row.status as BreakingStatus,
				score: row.score,
				headline: row.headline,
				reason: row.reason,
				articles: articlesOf(row.articles),
				detectedAt: row.detectedAt.toISOString(),
				sendAt: row.sendAt?.toISOString() ?? null,
				decidedAt: row.decidedAt?.toISOString() ?? null,
			})),
		};
	}

	/**
	 * 관리자: 보내지 않기(발송 예정 · 보류 → 보내지 않음) · 지금 바로 보내기(발송 예정 · 보류 → 보낼 시각을 지금으로).
	 * 이미 나간 것(발송함, 또는 보낼 시각이 지난 발송 예정)과 보내지 않음은 바꿀 수 없다 (CONFLICT)
	 */
	async decide(id: number, decision: 'cancel' | 'send', userId: number) {
		const now = new Date();
		const open = { id, OR: [{ status: 'held' }, { status: 'scheduled', sendAt: { gt: now } }] };
		const { count } = await this.prisma.breakingAlert.updateMany({
			where: open,
			data:
				decision === 'cancel'
					? { status: 'canceled', sendAt: null, decidedAt: now, decidedBy: userId }
					: { status: 'scheduled', sendAt: now, decidedAt: now, decidedBy: userId },
		});
		if (count) return { id, status: decision === 'cancel' ? 'canceled' : 'scheduled' };
		const exists = await this.prisma.breakingAlert.findUnique({ where: { id }, select: { id: true } });
		throw new AppException(exists ? 'CONFLICT' : 'NOT_FOUND');
	}

	/** 홈 속보 띠: 나간 속보 가운데 가장 최근 것 (취소할 시간이 지났거나 발송함, 감지한 지 noticeHours 안). 없으면 null */
	async latestNotice(now = new Date()): Promise<BreakingNotice | null> {
		const row = await this.prisma.breakingAlert.findFirst({
			where: {
				detectedAt: { gte: new Date(now.getTime() - BREAKING_LIMITS.noticeHours * HOUR) },
				OR: [{ status: 'sent' }, { status: 'scheduled', sendAt: { lte: now } }],
			},
			orderBy: { detectedAt: 'desc' },
		});
		if (!row) return null;
		const articles = articlesOf(row.articles);
		return {
			id: row.id,
			headline: row.headline,
			reason: row.reason,
			articles,
			detectedAt: row.detectedAt.toISOString(),
			image: articles.find((a) => a.image)?.image ?? null,
		};
	}
}

const escape = (text: string) =>
	text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
