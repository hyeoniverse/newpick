import { Injectable, Logger } from '@nestjs/common';
import { MysqlPrismaService } from 'src/prisma/mysql.service';
import { AiService, AiUnavailable } from 'src/ai/ai.service';
import { kstDayRange, kstDaysAgo, toKstDate } from 'src/common/kst';
import { parseNewsletterHtml } from 'src/ai-summary/newsletter-parse';
import { acceptedFrom, allStories, JUDGE_SCHEMA, NewStory, textOf } from './detect';
import { LINK_LIMITS, LINK_SYSTEM, linkCandidates, linkPrompt, nearestPrev, PastStory } from './story-links';

const DAY = 24 * 60 * 60 * 1000;
/** 임베딩 한 번에 보낼 글 수 */
const EMBED_BATCH = 50;

const asVector = (value: unknown) =>
	Array.isArray(value) && value.every((v) => typeof v === 'number') ? (value as number[]) : null;

/** 소식을 꺼낼 뉴스레터 (본문 HTML · 분야 · 발행 시각) */
export type StorySource = {
	id: number;
	createdAt: Date;
	contentAsHTML: string | null;
	category: { name: string };
};

export const STORY_SOURCE_SELECT = {
	id: true,
	createdAt: true,
	contentAsHTML: true,
	category: { select: { name: true } },
} as const;

/**
 * 소식 임베딩(story_vectors)과 이어지는 이야기(story_links).
 * 임베딩은 후속 지켜보기 판정과 함께 써서 같은 소식을 두 번 계산하지 않는다
 */
@Injectable()
export class StoryLinksService {
	private readonly logger = new Logger(StoryLinksService.name);

	constructor(
		private readonly prisma: MysqlPrismaService,
		private readonly ai: AiService,
	) {}

	/**
	 * 뉴스레터들의 소식 + 임베딩. 저장된 것은 그대로 쓰고, 없거나 제목이 바뀐 것(다시 쓴 뉴스레터)만 계산해 둔다.
	 * 임베딩을 못 하면 던진다 (부르는 쪽이 그날은 건너뛴다)
	 */
	async storiesOf(newsletters: StorySource[]): Promise<PastStory[]> {
		const parsed = newsletters.flatMap((n) =>
			allStories(parseNewsletterHtml(n.contentAsHTML)).map((story, i) => ({
				newsletterId: n.id,
				storyIndex: i + 1,
				category: n.category.name,
				date: toKstDate(n.createdAt),
				heading: story.heading.slice(0, 200),
				text: textOf(story),
			})),
		);
		if (!parsed.length) return [];
		const saved = await this.prisma.storyVector.findMany({
			where: { newsletterId: { in: newsletters.map((n) => n.id) } },
			select: { newsletterId: true, storyIndex: true, heading: true, vector: true },
		});
		const byRef = new Map(saved.map((v) => [`${v.newsletterId}-${v.storyIndex}`, v]));
		const vectors = new Map<string, number[]>();
		const missing: typeof parsed = [];
		for (const story of parsed) {
			const ref = `${story.newsletterId}-${story.storyIndex}`;
			const row = byRef.get(ref);
			const vector = row && row.heading === story.heading ? asVector(row.vector) : null;
			if (vector) vectors.set(ref, vector);
			else missing.push(story);
		}
		for (let i = 0; i < missing.length; i += EMBED_BATCH) {
			const batch = missing.slice(i, i + EMBED_BATCH);
			const made = await this.ai.embed(batch.map((s) => s.text));
			await Promise.all(
				batch.map((story, j) => {
					vectors.set(`${story.newsletterId}-${story.storyIndex}`, made[j]);
					const key = { newsletterId: story.newsletterId, storyIndex: story.storyIndex };
					const data = { heading: story.heading, vector: made[j] };
					return this.prisma.storyVector.upsert({
						where: { newsletterId_storyIndex: key },
						create: { ...key, ...data },
						update: data,
					});
				}),
			);
		}
		return parsed.map((story) => ({ ...story, vector: vectors.get(`${story.newsletterId}-${story.storyIndex}`)! }));
	}

	/**
	 * 하루 한 번 (뉴스레터를 다 쓴 뒤): 그날 소식마다 지난 며칠 소식 가운데 같은 사건의 바로 앞 소식을 찾아 잇는다.
	 * 다시 돌리면 그날 연결을 새로 판정해 바꾼다. 지난 날짜도 오래된 날부터 차례로 돌리면 사슬이 이어진다
	 */
	async link(date = kstDaysAgo(0)) {
		const { start, end } = kstDayRange(date, date);
		const today = await this.prisma.newsletter.findMany({
			where: { createdAt: { gte: start, lte: end } },
			select: STORY_SOURCE_SELECT,
		});
		if (!today.length) return { stories: 0, checked: 0, links: 0 };
		const past = await this.prisma.newsletter.findMany({
			where: { createdAt: { gte: new Date(start.getTime() - LINK_LIMITS.lookbackDays * DAY), lt: start } },
			select: STORY_SOURCE_SELECT,
		});

		let stories: PastStory[];
		let earlier: PastStory[];
		try {
			[stories, earlier] = [await this.storiesOf(today), await this.storiesOf(past)];
		} catch (error) {
			this.logger.warn(`이어지는 이야기: 임베딩 실패, 오늘은 건너뜀 (${(error as Error).message})`);
			return { stories: 0, checked: 0, links: 0 };
		}

		let checked = 0;
		const rows: {
			newsletterId: number;
			storyIndex: number;
			prevNewsletterId: number;
			prevStoryIndex: number;
			reason: string;
			score: number;
		}[] = [];
		for (const story of stories) {
			const candidates = linkCandidates(story, earlier);
			if (!candidates.length) continue;
			checked++;
			const accepted = await this.judge(story, candidates);
			const prev = nearestPrev(accepted);
			if (!prev) continue;
			rows.push({
				newsletterId: story.newsletterId,
				storyIndex: story.storyIndex,
				prevNewsletterId: prev.prev.newsletterId,
				prevStoryIndex: prev.prev.storyIndex,
				reason: prev.reason,
				score: prev.score,
			});
		}
		const ids = today.map((n) => n.id);
		await this.prisma.$transaction([
			this.prisma.storyLink.deleteMany({ where: { newsletterId: { in: ids } } }),
			this.prisma.storyLink.createMany({ data: rows }),
		]);
		this.logger.log(
			`이어지는 이야기 ${date}: 소식 ${stories.length}개 중 후보 ${checked}개 판정, 이어짐 ${rows.length}건`,
		);
		return { stories: stories.length, checked, links: rows.length };
	}

	/** 후보 판정 → 받아들인 후보 (판정을 못 하면 아주 비슷한 것만) */
	private async judge(story: NewStory, candidates: { prev: PastStory; score: number }[]) {
		try {
			const { text } = await this.ai.generate({
				stage: 'story-link',
				prefer: 'open',
				fallback: false,
				system: LINK_SYSTEM,
				prompt: linkPrompt(story, candidates),
				schema: JUDGE_SCHEMA,
				maxTokens: 600,
			});
			return acceptedFrom(JSON.parse(text), candidates.length).map(({ index, reason }) => ({
				...candidates[index],
				reason,
			}));
		} catch (error) {
			if (!(error instanceof AiUnavailable) && !(error instanceof SyntaxError))
				this.logger.warn(
					`이어지는 이야기 판정 실패 ${story.newsletterId}-${story.storyIndex}: ${(error as Error).message}`,
				);
			return candidates.filter((c) => c.score >= LINK_LIMITS.autoAccept).map((c) => ({ ...c, reason: '' }));
		}
	}
}
