import type {
	HomeContinuing,
	HomeMostRead,
	HomeMostScrapped,
	HomeRisingTag,
	HomeStory,
	HomeThread,
	HomeToday,
	HomeTopic,
} from '@newpick/shared';
import { parseNewsletterHtml } from 'src/ai-summary/newsletter-parse';
import { Injectable } from '@nestjs/common';
import { MysqlPrismaService } from 'src/prisma/mysql.service';
import { kstDayRange, toKstDate } from 'src/common/kst';
import { allStories } from 'src/follows/detect';
import { chainOf, LINK_LIMITS, LinkRow, refOf } from 'src/follows/story-links';
import { EditionService } from './edition.service';
import { storyRef } from './editor';

const DAY_MS = 24 * 60 * 60 * 1000;
/** 결과를 이만큼 들고 있는다 (홈은 ISR 10분이라 그보다 짧게) */
const CACHE_MS = 5 * 60 * 1000;
const LIMITS = { topLines: 3, topics: 4, topicStories: 3, continuing: 3, risingTags: 8, mostRead: 5, mostScrapped: 5 };
/** 최근 며칠의 조회 · 스크랩을 셀지 */
const READ_DAYS = 7;
const SCRAP_DAYS = 30;
/** 지금 뜨는 태그: 최근 며칠을 그 전 몇 주와 견주고, 최근 며칠에 몇 번 이상 나와야 넣을지 */
const RISING = { recentDays: 3, baseDays: 28, minCount: 2 };
/** 본문 HTML의 소식 태그 (article data-tags="a|b") */
const STORY_TAGS = /data-tags="([^"]*)"/g;

/** 뉴스레터 한 편의 태그: 키워드 + 소식 태그 (한 편에 한 번씩) */
export function tagsOf(keywords: unknown, html: string | null): Set<string> {
	const tags = new Set(Array.isArray(keywords) ? (keywords as string[]) : []);
	for (const [, list] of (html ?? '').matchAll(STORY_TAGS))
		for (const tag of list.split('|')) if (tag.trim()) tags.add(tag.trim().replace(/&amp;/g, '&'));
	return tags;
}
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

		const [{ tags: risingTags, topics }, continuing, mostRead, mostScrapped] = await Promise.all([
			this.rising(edition.date),
			this.continuing(ranked),
			this.mostRead(new Date(now.getTime() - READ_DAYS * DAY_MS)),
			this.mostScrapped(new Date(now.getTime() - SCRAP_DAYS * DAY_MS)),
		]);

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

		return { date: edition.date, topLines, topics, threads, continuing, risingTags, mostRead, mostScrapped };
	}

	/**
	 * 이어지는 이야기: 오늘 소식마다 저장된 연결(story_links)을 거슬러 올라가 며칠짜리 사건으로.
	 * 긴 것(며칠째인지)부터, 같으면 오늘 소식이 중요한 것부터. 같은 사건에서 시작한 사슬은 하나만
	 * @param stories 오늘 소식 (중요도 순)
	 */
	private async continuing(stories: HomeStory[]): Promise<HomeContinuing[]> {
		const links = new Map<string, LinkRow>();
		let frontier = stories.map(({ newsletterId, storyIndex }) => ({ newsletterId, storyIndex }));
		// 단계마다 한 번: 오늘 소식의 앞 소식, 그 앞 소식, …
		for (let step = 1; step < LINK_LIMITS.maxSteps && frontier.length; step++) {
			const rows = await this.prisma.storyLink.findMany({
				where: { OR: frontier },
				select: { newsletterId: true, storyIndex: true, prevNewsletterId: true, prevStoryIndex: true, reason: true },
			});
			frontier = [];
			for (const row of rows) {
				const ref = refOf(row.newsletterId, row.storyIndex);
				if (links.has(ref)) continue;
				links.set(ref, row);
				frontier.push({ newsletterId: row.prevNewsletterId, storyIndex: row.prevStoryIndex });
			}
		}
		const chains = stories.map((story) => chainOf(story, links)).filter((steps) => steps.length);
		if (!chains.length) return [];

		// 단계마다 제목 · 분야 · 날짜는 지금 뉴스레터 본문에서 (다시 쓴 뉴스레터면 그 소식이 없을 수 있다)
		const ids = [...new Set(chains.flat().map((s) => s.newsletterId))];
		const newsletters = await this.prisma.newsletter.findMany({
			where: { id: { in: ids } },
			select: { id: true, createdAt: true, contentAsHTML: true, category: { select: { name: true } } },
		});
		const byId = new Map(
			newsletters.map((n) => [
				n.id,
				{
					date: toKstDate(n.createdAt),
					category: n.category.name,
					stories: allStories(parseNewsletterHtml(n.contentAsHTML)),
				},
			]),
		);
		const result: HomeContinuing[] = [];
		const roots = new Set<string>();
		const sorted = chains
			.map((steps, order) => ({ steps, order }))
			.sort((a, b) => b.steps.length - a.steps.length || a.order - b.order);
		for (const { steps } of sorted) {
			const root = refOf(steps[0].newsletterId, steps[0].storyIndex);
			if (roots.has(root)) continue;
			const full = steps.map((step) => {
				const newsletter = byId.get(step.newsletterId);
				const story = newsletter?.stories[step.storyIndex - 1];
				return newsletter && story
					? { ...step, heading: story.heading, category: newsletter.category, date: newsletter.date }
					: null;
			});
			if (full.some((step) => !step)) continue;
			roots.add(root);
			result.push({ steps: full as HomeContinuing['steps'] });
			if (result.length >= LIMITS.continuing) break;
		}
		return result;
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

	/**
	 * 지금 뜨는 태그와 주제별 트렌드.
	 * 태그: 최근 3일(편집본 날짜까지) 동안 나온 횟수를 그 전 4주의 하루 평균과 견줘 늘어난 만큼 순서대로.
	 * 최근 3일에 2번 이상 나온 것만 (한 번 스친 태그는 뺀다). 뉴스레터 키워드와 소식 태그(data-tags)를 함께, 한 편에 한 번씩 센다.
	 * 주제: 위쪽 태그마다 그 태그가 붙은(또는 제목 · 리드에 그 말이 나오는) 최근 3일 소식을 새것부터
	 */
	private async rising(date: string): Promise<{ tags: HomeRisingTag[]; topics: HomeTopic[] }> {
		const { start: dayStart, end } = kstDayRange(date, date);
		// KST 하루는 늘 24시간이라 날짜를 빼는 대신 시간으로
		const recentStart = new Date(dayStart.getTime() - (RISING.recentDays - 1) * DAY_MS);
		const baseStart = new Date(recentStart.getTime() - RISING.baseDays * DAY_MS);
		const rows = await this.prisma.newsletter.findMany({
			where: { createdAt: { gte: baseStart, lte: end } },
			select: { id: true, keywords: true, contentAsHTML: true, createdAt: true, category: { select: { name: true } } },
		});
		const recent = new Map<string, number>();
		const base = new Map<string, number>();
		for (const row of rows) {
			const target = row.createdAt >= recentStart ? recent : base;
			for (const tag of tagsOf(row.keywords, row.contentAsHTML)) target.set(tag, (target.get(tag) ?? 0) + 1);
		}
		const usualOf = (tag: string) => Math.round(((base.get(tag) ?? 0) / RISING.baseDays) * RISING.recentDays * 10) / 10;
		const tags = [...recent]
			.filter(([, count]) => count >= RISING.minCount)
			.map(([tag, count]) => ({ tag, recent: count, usual: usualOf(tag) }))
			.filter((t) => t.recent > t.usual)
			.sort((a, b) => b.recent - b.usual - (a.recent - a.usual) || b.recent - a.recent)
			.slice(0, LIMITS.risingTags);

		// 최근 3일 소식 (새 뉴스레터부터, 한 편 안에서는 실린 순)
		const recentStories = rows
			.filter((row) => row.createdAt >= recentStart)
			.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
			.flatMap((row) => {
				const parsed = parseNewsletterHtml(row.contentAsHTML);
				return [...parsed.morning, ...parsed.stories].map((story, i) => ({
					tags: story.tags ?? [],
					text: `${story.heading} ${story.lead}`,
					home: {
						newsletterId: row.id,
						storyIndex: i + 1,
						category: row.category.name,
						heading: story.heading,
						line: story.lead,
						importance: story.importance ?? 0,
						image: story.image?.url ?? null,
						date: toKstDate(row.createdAt),
					} satisfies HomeTopic['stories'][number],
				}));
			});
		const used = new Set<string>();
		const topics: HomeTopic[] = [];
		for (const tag of tags) {
			if (topics.length >= LIMITS.topics) break;
			const stories = recentStories
				.filter((s) => s.tags.includes(tag.tag) || s.text.includes(tag.tag))
				.filter((s) => !used.has(`${s.home.newsletterId}-${s.home.storyIndex}`))
				.slice(0, LIMITS.topicStories)
				.map((s) => s.home);
			// 소식이 하나뿐인 주제는 묶음이라 하기 어려워 뺀다
			if (stories.length < 2) continue;
			stories.forEach((s) => used.add(`${s.newsletterId}-${s.storyIndex}`));
			topics.push({ ...tag, stories });
		}
		return { tags, topics };
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
