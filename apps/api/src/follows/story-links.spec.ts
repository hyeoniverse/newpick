import { renderNewsletterHtml } from 'src/ai-summary/newsletter-html';
import { AiUnavailable } from 'src/ai/ai.service';
import { chainOf, LINK_LIMITS, linkCandidates, linkPrompt, LinkRow, nearestPrev, refOf } from './story-links';
import { StoryLinksService } from './story-links.service';

const story = (heading: string) => ({
	template: 'brief' as const,
	kicker: '',
	heading,
	lead: `${heading} 리드`,
	body: `${heading} 본문`,
	analysis: '',
	stats: [],
	timeline: [],
	qa: [],
	quote: { text: '', by: '' },
	debate: [],
	sources: [],
	imageQuery: '',
});
const html = (...headings: string[]) => renderNewsletterHtml({ briefing: '', stories: headings.map(story), watch: [] });

const past = (newsletterId: number, date: string, vector: number[]) => ({
	newsletterId,
	storyIndex: 1,
	category: 'IT',
	heading: `소식 ${newsletterId}`,
	text: '',
	date,
	vector,
});

describe('이어지는 이야기 규칙', () => {
	it(`지난 날짜 소식 가운데 비슷한(${LINK_LIMITS.candidate} 이상) 것만, 비슷한 순 최대 ${LINK_LIMITS.perStory}개`, () => {
		const today = { ...past(9, '2026-11-23', [1, 0]) };
		const candidates = linkCandidates(today, [
			past(1, '2026-11-22', [0.6, 0.8]),
			past(2, '2026-11-21', [0.9, 0.44]),
			past(3, '2026-11-23', [1, 0]), // 같은 날은 아님
			past(4, '2026-11-20', [0.2, 0.98]), // 안 비슷함
			past(5, '2026-11-19', [0.8, 0.6]),
			past(6, '2026-11-18', [0.7, 0.71]),
		]);
		expect(candidates.map((c) => c.prev.newsletterId)).toEqual([2, 5, 6]);
	});

	it('받아들인 것 가운데 바로 앞 소식: 가장 최근 날짜, 같으면 더 비슷한 것', () => {
		const pick = nearestPrev([
			{ prev: { date: '2026-11-20' }, score: 0.9, id: 'a' },
			{ prev: { date: '2026-11-22' }, score: 0.6, id: 'b' },
			{ prev: { date: '2026-11-22' }, score: 0.7, id: 'c' },
		]);
		expect(pick?.id).toBe('c');
		expect(nearestPrev([])).toBeUndefined();
	});

	it('프롬프트: 같은 사건의 새 진전만, 지난 소식마다 날짜를 붙인다', () => {
		const prompt = linkPrompt({ heading: '구속영장 발부', text: '법원이', category: '사회' }, [
			{ prev: { heading: '압수수색', text: '검찰이', category: '사회', date: '2026-11-21' } },
		]);
		expect(prompt).toContain('[1] (사회, 2026-11-21) 압수수색');
		expect(prompt).toContain('같은 분야 · 비슷한 주제의 다른 일이면 false');
	});

	it(`사슬: 앞 소식을 따라 오래된 것부터, 첫 단계 이유는 비우고, 고리가 돌면 멈추고, 최대 ${LINK_LIMITS.maxSteps}단계`, () => {
		const links = (rows: [number, number, string][]) =>
			new Map<string, LinkRow>(
				rows.map(([id, prev, reason]) => [
					refOf(id, 1),
					{ newsletterId: id, storyIndex: 1, prevNewsletterId: prev, prevStoryIndex: 1, reason },
				]),
			);
		expect(
			chainOf(
				{ newsletterId: 3, storyIndex: 1 },
				links([
					[3, 2, '판결'],
					[2, 1, '기소'],
				]),
			),
		).toEqual([
			{ newsletterId: 1, storyIndex: 1, reason: '' },
			{ newsletterId: 2, storyIndex: 1, reason: '기소' },
			{ newsletterId: 3, storyIndex: 1, reason: '판결' },
		]);
		// 앞 소식이 없으면 사슬이 아니다
		expect(chainOf({ newsletterId: 3, storyIndex: 1 }, links([]))).toEqual([]);
		// 고리 (잘못 저장돼도 멈춘다)
		expect(
			chainOf(
				{ newsletterId: 1, storyIndex: 1 },
				links([
					[1, 2, 'a'],
					[2, 1, 'b'],
				]),
			).map((s) => s.newsletterId),
		).toEqual([2, 1]);
		const long = links(Array.from({ length: 10 }, (_, i) => [i + 2, i + 1, `${i}`] as [number, number, string]));
		expect(chainOf({ newsletterId: 11, storyIndex: 1 }, long)).toHaveLength(LINK_LIMITS.maxSteps);
	});
});

describe('StoryLinksService', () => {
	const setup = () => {
		const prisma = {
			newsletter: { findMany: jest.fn() },
			storyVector: { findMany: jest.fn().mockResolvedValue([]), upsert: jest.fn().mockResolvedValue({}) },
			storyLink: {
				deleteMany: jest.fn((args) => ({ op: 'delete', args })),
				createMany: jest.fn((args) => ({ op: 'create', args })),
			},
			$transaction: jest.fn().mockResolvedValue([]),
		};
		const ai = { embed: jest.fn(), generate: jest.fn() };
		return { prisma, ai, service: new StoryLinksService(prisma as never, ai as never) };
	};
	// 오늘(11-23) 뉴스레터 30: 소식 2개 · 어제(11-22) 뉴스레터 20: 소식 1개
	const today = [
		{
			id: 30,
			createdAt: new Date('2026-11-23T00:00:00Z'),
			contentAsHTML: html('영장 발부', '야구'),
			category: { name: '사회' },
		},
	];
	const yesterday = [
		{
			id: 20,
			createdAt: new Date('2026-11-22T00:00:00Z'),
			contentAsHTML: html('압수수색'),
			category: { name: '사회' },
		},
	];

	it('저장된 임베딩은 그대로 쓰고, 없거나 제목이 바뀐 소식만 계산해 둔다', async () => {
		const { prisma, ai, service } = setup();
		prisma.storyVector.findMany.mockResolvedValue([
			{ newsletterId: 30, storyIndex: 1, heading: '영장 발부', vector: [1, 0] },
			{ newsletterId: 30, storyIndex: 2, heading: '다시 쓰기 전 제목', vector: [0, 1] },
		]);
		ai.embed.mockResolvedValue([[0.5, 0.5]]);
		const stories = await service.storiesOf(today);
		expect(ai.embed).toHaveBeenCalledTimes(1);
		expect(ai.embed.mock.calls[0][0]).toHaveLength(1);
		expect(stories.map((s) => [s.storyIndex, s.vector, s.date])).toEqual([
			[1, [1, 0], '2026-11-23'],
			[2, [0.5, 0.5], '2026-11-23'],
		]);
		expect(prisma.storyVector.upsert).toHaveBeenCalledWith(
			expect.objectContaining({ update: { heading: '야구', vector: [0.5, 0.5] } }),
		);
	});

	it('오늘 소식마다 판정해 받아들인 바로 앞 소식과 잇고, 그날 연결은 새로 바꾼다', async () => {
		const { prisma, ai, service } = setup();
		prisma.newsletter.findMany.mockResolvedValueOnce(today).mockResolvedValueOnce(yesterday);
		ai.embed
			.mockResolvedValueOnce([
				[1, 0],
				[0, 1],
			])
			.mockResolvedValueOnce([[0.9, 0.44]]);
		ai.generate.mockResolvedValue({
			text: JSON.stringify({ results: [{ n: 1, follow: true, reason: '법원이 영장을 발부했다' }] }),
		});
		expect(await service.link('2026-11-23')).toEqual({ stories: 2, checked: 1, links: 1 });
		expect(ai.generate).toHaveBeenCalledTimes(1);
		expect(ai.generate.mock.calls[0][0]).toMatchObject({ stage: 'story-link', prefer: 'open', fallback: false });
		expect(prisma.storyLink.deleteMany).toHaveBeenCalledWith({ where: { newsletterId: { in: [30] } } });
		expect(prisma.storyLink.createMany.mock.calls[0][0].data).toEqual([
			expect.objectContaining({
				newsletterId: 30,
				storyIndex: 1,
				prevNewsletterId: 20,
				prevStoryIndex: 1,
				reason: '법원이 영장을 발부했다',
			}),
		]);
	});

	it(`판정을 못 하는 날은 아주 비슷한(${LINK_LIMITS.autoAccept} 이상) 것만, 임베딩을 못 하면 건너뛴다`, async () => {
		const { prisma, ai, service } = setup();
		prisma.newsletter.findMany.mockResolvedValueOnce(today).mockResolvedValueOnce(yesterday);
		// 영장 발부 0.6(후보지만 판정 없이는 안 받음) · 야구 0.8(받아들임)
		ai.embed
			.mockResolvedValueOnce([
				[0.6, 0.8],
				[0.8, 0.6],
			])
			.mockResolvedValueOnce([[1, 0]]);
		ai.generate.mockRejectedValue(new AiUnavailable('429'));
		await service.link('2026-11-23');
		expect(prisma.storyLink.createMany.mock.calls[0][0].data).toEqual([
			expect.objectContaining({ storyIndex: 2, reason: '' }),
		]);

		const failing = setup();
		failing.prisma.newsletter.findMany.mockResolvedValueOnce(today).mockResolvedValueOnce(yesterday);
		failing.ai.embed.mockRejectedValue(new AiUnavailable('429'));
		expect(await failing.service.link('2026-11-23')).toEqual({ stories: 0, checked: 0, links: 0 });
		expect(failing.prisma.$transaction).not.toHaveBeenCalled();
	});

	it('그날 뉴스레터가 없으면 아무것도 부르지 않는다', async () => {
		const { prisma, ai, service } = setup();
		prisma.newsletter.findMany.mockResolvedValue([]);
		expect(await service.link('2026-11-23')).toEqual({ stories: 0, checked: 0, links: 0 });
		expect(ai.embed).not.toHaveBeenCalled();
	});
});
