import type { HomeMostRead, HomeMostScrapped, HomeRisingTag, HomeStory, HomeThread, HomeToday } from '@newpick/shared';
import { Injectable } from '@nestjs/common';
import { MysqlPrismaService } from 'src/prisma/mysql.service';
import { kstDayRange } from 'src/common/kst';
import { EditionService } from './edition.service';
import { storyRef } from './editor';

const DAY_MS = 24 * 60 * 60 * 1000;
/** 결과를 이만큼 들고 있는다 (홈은 ISR 10분이라 그보다 짧게) */
const CACHE_MS = 5 * 60 * 1000;
const LIMITS = { topLines: 3, trending: 4, risingTags: 8, mostRead: 5, mostScrapped: 5 };
/** 최근 며칠의 조회 · 스크랩을 셀지 */
const READ_DAYS = 7;
const SCRAP_DAYS = 30;
/** 상세 화면 주소에서 뉴스레터 id */
const DETAIL_PATH = /^\/articles\/detail\/(\d+)/;

/**
 * 홈 '오늘' 묶음 (GET /edition/today): 오늘의 3줄 · 오늘의 트렌드 · 분야를 넘는 흐름 · 지금 뜨는 태그 · 많이 읽은 · 많이 스크랩한.
 * 이미 만든 편집본(중요도 · 흐름)과 조회 기록 · 스크랩 · 태그를 모은다 (AI 호출 없음)
 */
@Injectable()
export class HomeService {
	private cache: { at: number; value: HomeToday | null } | null = null;

	constructor(
		private readonly prisma: MysqlPrismaService,
		private readonly editionService: EditionService,
	) {}

	async today(now = new Date()): Promise<HomeToday | null> {
		if (this.cache && now.getTime() - this.cache.at < CACHE_MS) return this.cache.value;
		const value = await this.build(now);
		this.cache = { at: now.getTime(), value };
		return value;
	}

	private async build(now: Date): Promise<HomeToday | null> {
		const edition = await this.editionService.latestEdition();
		if (!edition) return null;

		const ranking = edition.editorial?.ranking ?? {};
		const stories: HomeStory[] = edition.sources.flatMap((source) =>
			source.stories.map((story, i) => {
				const rank = ranking[storyRef(source.newsletterId, i)];
				return {
					newsletterId: source.newsletterId,
					storyIndex: i + 1,
					category: source.category,
					heading: story.heading,
					line: rank?.line || story.lead,
					// 편집본(분야를 넘어 견준 것)이 먼저, 없으면 뉴스레터를 쓸 때 매긴 것 (#360)
					importance: rank?.importance ?? story.importance ?? 0,
					image: story.image?.url ?? null,
				};
			}),
		);
		const byRef = new Map(stories.map((s) => [storyRef(s.newsletterId, s.storyIndex - 1), s]));

		// 중요도 순 (같으면 편집본 순서)
		const ranked = [...stories].sort((a, b) => b.importance - a.importance);
		const topLines = ranked.slice(0, LIMITS.topLines);

		const { start: todayStart } = kstDayRange(now, now);
		const [viewsToday, risingTags, mostRead, mostScrapped] = await Promise.all([
			this.detailViews(todayStart),
			this.risingTags(edition.date),
			this.mostRead(new Date(now.getTime() - READ_DAYS * DAY_MS)),
			this.mostScrapped(new Date(now.getTime() - SCRAP_DAYS * DAY_MS)),
		]);

		// 오늘의 트렌드: 중요도(1~5)와 오늘 조회(가장 많이 본 뉴스레터를 1로)를 반씩. 3줄에 나온 소식은 빼고, 사진 있는 소식을 앞에
		const maxViews = Math.max(1, ...viewsToday.values());
		const shown = new Set(topLines);
		const score = (s: HomeStory) => (s.importance / 5) * 0.5 + ((viewsToday.get(s.newsletterId) ?? 0) / maxViews) * 0.5;
		const trending = stories
			.filter((s) => !shown.has(s))
			.sort((a, b) => Number(!!b.image) - Number(!!a.image) || score(b) - score(a))
			.slice(0, LIMITS.trending);

		const threads: HomeThread[] = (edition.editorial?.threads ?? [])
			.map((thread) => ({
				title: thread.title,
				text: thread.text,
				stories: thread.refs
					.map((ref) => byRef.get(ref))
					.filter((s): s is HomeStory => !!s)
					.map(({ newsletterId, storyIndex, category, heading }) => ({ newsletterId, storyIndex, category, heading })),
			}))
			.filter((thread) => thread.stories.length > 0);

		return { date: edition.date, topLines, trending, threads, risingTags, mostRead, mostScrapped };
	}

	/** 상세 화면 조회 수 (뉴스레터 id → 수) */
	private async detailViews(since: Date) {
		const rows = await this.prisma.pageView.groupBy({
			by: ['path'],
			where: { route: '/articles/detail/:id', startedAt: { gte: since } },
			_count: { _all: true },
		});
		const views = new Map<number, number>();
		for (const row of rows) {
			const id = Number(DETAIL_PATH.exec(row.path)?.[1]);
			if (id) views.set(id, (views.get(id) ?? 0) + row._count._all);
		}
		return views;
	}

	/** 지금 뜨는 태그: 그날(편집본 날짜) 뉴스레터 태그 수와 그 전 7일 하루 평균을 견줘, 늘어난 만큼 순서대로 */
	private async risingTags(date: string): Promise<HomeRisingTag[]> {
		const { start, end } = kstDayRange(date, date);
		const weekStart = new Date(start.getTime() - 7 * DAY_MS);
		const rows = await this.prisma.newsletter.findMany({
			where: { createdAt: { gte: weekStart, lte: end } },
			select: { keywords: true, createdAt: true },
		});
		const today = new Map<string, number>();
		const before = new Map<string, number>();
		for (const row of rows) {
			const target = row.createdAt >= start ? today : before;
			for (const tag of new Set(Array.isArray(row.keywords) ? (row.keywords as string[]) : []))
				target.set(tag, (target.get(tag) ?? 0) + 1);
		}
		return [...today]
			.map(([tag, count]) => ({ tag, today: count, average: Math.round(((before.get(tag) ?? 0) / 7) * 10) / 10 }))
			.filter((t) => t.today > t.average)
			.sort((a, b) => b.today - b.average - (a.today - a.average) || b.today - a.today)
			.slice(0, LIMITS.risingTags);
	}

	/** 많이 읽은 뉴스레터: 최근 상세 화면 조회 순 */
	private async mostRead(since: Date): Promise<HomeMostRead[]> {
		const views = await this.detailViews(since);
		const top = [...views].sort((a, b) => b[1] - a[1]).slice(0, LIMITS.mostRead * 2);
		if (!top.length) return [];
		const newsletters = await this.prisma.newsletter.findMany({
			where: { id: { in: top.map(([id]) => id) } },
			select: { id: true, title: true, category: { select: { name: true } } },
		});
		const byId = new Map(newsletters.map((n) => [n.id, n]));
		// 지워진 뉴스레터는 뺀다
		return top
			.filter(([id]) => byId.has(id))
			.slice(0, LIMITS.mostRead)
			.map(([id, count]) => ({
				newsletterId: id,
				title: byId.get(id)!.title,
				category: byId.get(id)!.category.name,
				views: count,
			}));
	}

	/** 많이 스크랩한 소식: 최근 스크랩을 뉴스레터 · 구역(소식)별로 */
	private async mostScrapped(since: Date): Promise<HomeMostScrapped[]> {
		const rows = await this.prisma.highlight.groupBy({
			by: ['newsletterId', 'section'],
			where: { createdAt: { gte: since } },
			_count: { _all: true },
			orderBy: { _count: { id: 'desc' } },
			take: LIMITS.mostScrapped,
		});
		if (!rows.length) return [];
		const [titles, newsletters] = await Promise.all([
			this.prisma.highlight.findMany({
				where: {
					OR: rows.map((r) => ({ newsletterId: r.newsletterId, section: r.section })),
					sectionTitle: { not: null },
				},
				select: { newsletterId: true, section: true, sectionTitle: true },
				distinct: ['newsletterId', 'section'],
			}),
			this.prisma.newsletter.findMany({
				where: { id: { in: rows.map((r) => r.newsletterId) } },
				select: { id: true, title: true, category: { select: { name: true } } },
			}),
		]);
		const titleOf = new Map(titles.map((t) => [`${t.newsletterId}:${t.section}`, t.sectionTitle]));
		const byId = new Map(newsletters.map((n) => [n.id, n]));
		return rows
			.filter((r) => byId.has(r.newsletterId))
			.map((r) => ({
				newsletterId: r.newsletterId,
				heading: titleOf.get(`${r.newsletterId}:${r.section}`) || byId.get(r.newsletterId)!.title,
				category: byId.get(r.newsletterId)!.category.name,
				scraps: r._count._all,
			}));
	}
}
