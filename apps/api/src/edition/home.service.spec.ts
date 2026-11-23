import { HomeService } from './home.service';

const story = (heading: string, image = true) => ({
	kicker: '',
	heading,
	lead: `${heading} 리드`,
	blocks: [],
	sources: [],
	...(image && { image: { url: `https://img.test/${heading}.jpg`, alt: heading, caption: [] } }),
});

const edition = {
	date: '2026-11-23',
	sources: [
		{
			newsletterId: 10,
			categoryId: 1,
			category: 'IT',
			title: 'IT',
			stories: [story('반도체'), story('AI 규제', false)],
		},
		{ newsletterId: 20, categoryId: 3, category: '경제', title: '경제', stories: [story('환율'), story('금리')] },
	],
	editorial: {
		ranking: {
			'10-1': { importance: 5, line: '반도체 수출 석 달째 증가' },
			'20-1': { importance: 4, line: '환율 1,400원 돌파' },
			'20-2': { importance: 3, line: '기준금리 동결' },
			'10-2': { importance: 2, line: 'AI 규제 초안' },
		},
		duplicates: [],
		threads: [{ refs: ['10-1', '20-1', '99-1'], title: '수출과 환율', text: '반도체 수출이 늘며 환율이…' }],
	},
};

/** 뉴스레터 본문 HTML에 소식 하나 (태그 data-tags) */
const storyHtml = (heading: string, tags: string) =>
	`<div class="newsletter"><article class="story story-analysis" data-tags="${tags}"><h2>${heading}</h2><p class="lead">${heading} 리드</p></article></div>`;
const row = (id: number, keywords: string[], contentAsHTML: string | null, at: string) => ({
	id,
	keywords,
	contentAsHTML,
	createdAt: new Date(at),
	category: { name: '경제' },
});

const link = (id: number, index: number, prevId: number, prevIndex: number, reason: string) => ({
	newsletterId: id,
	storyIndex: index,
	prevNewsletterId: prevId,
	prevStoryIndex: prevIndex,
	reason,
});
const LINKS = [
	link(10, 1, 5, 1, '수출이 석 달째 늘었다'),
	link(5, 1, 3, 1, '정부가 지원책을 내놨다'),
	link(20, 1, 3, 1, '환율이 올랐다'),
	link(20, 2, 6, 2, '금리를 묶었다'),
];
const chainRow = (id: number, category: string, at: string, ...headings: string[]) => ({
	id,
	createdAt: new Date(at),
	contentAsHTML: `<div class="newsletter">${headings.map((h) => storyHtml(h, '').replace(/<\/?div[^>]*>/g, '')).join('')}</div>`,
	category: { name: category },
});
const CHAIN_NEWSLETTERS = [
	chainRow(3, 'IT', '2026-11-21T01:00:00Z', '반도체 수출 부진'),
	chainRow(5, 'IT', '2026-11-22T01:00:00Z', '반도체 지원책'),
	chainRow(6, '경제', '2026-11-22T01:00:00Z', '물가'),
	chainRow(10, 'IT', '2026-11-23T01:00:00Z', '반도체', 'AI 규제'),
	chainRow(20, '경제', '2026-11-23T01:00:00Z', '환율', '금리'),
];

function setup() {
	const prisma = {
		pageView: {
			// 오늘 · 최근 7일 모두 같은 결과: 금리(20)가 가장 많이 읽힘
			groupBy: jest.fn().mockResolvedValue([
				{ path: '/articles/detail/20', _count: { _all: 9 } },
				{ path: '/articles/detail/10?x=1', _count: { _all: 3 } },
				{ path: '/articles/detail/77', _count: { _all: 5 } },
			]),
		},
		// 이어지는 이야기: 10-1(오늘 반도체) → 5-1(어제) → 3-1(그제). 20-1(환율)도 3-1에서 시작해 같은 사건이라 하나만,
		// 20-2(금리)의 앞 소식 6-2는 다시 쓴 뉴스레터라 없다
		storyLink: {
			findMany: jest.fn(async (args: { where: { OR: { newsletterId: number; storyIndex: number }[] } }) =>
				LINKS.filter((l) =>
					args.where.OR.some((f) => f.newsletterId === l.newsletterId && f.storyIndex === l.storyIndex),
				),
			),
		},
		newsletter: {
			findMany: jest.fn(async (args: { select: { keywords?: boolean; contentAsHTML?: boolean } }) =>
				!args.select.keywords && args.select.contentAsHTML
					? CHAIN_NEWSLETTERS
					: args.select.keywords
						? [
								// 최근 3일(11-21~23 KST): 반도체 3편 · 환율 2편(한 편은 소식 태그로만) · 금리 1편 · 코스피 2편
								row(101, ['반도체', '코스피'], storyHtml('반도체 수출 석 달째 증가', '반도체'), '2026-11-23T01:00:00Z'),
								row(102, ['반도체', '금리'], storyHtml('반도체 공급망 재편', '반도체'), '2026-11-22T01:00:00Z'),
								row(
									103,
									['반도체', '코스피'],
									storyHtml('환율 급등에 수입물가 비상', '환율|반도체'),
									'2026-11-21T01:00:00Z',
								),
								row(104, ['환율'], storyHtml('원화 약세 이어져', '환율'), '2026-11-21T02:00:00Z'),
								// 그 전 4주: 반도체 1편, 코스피는 매일 (평소 3일에 3번 → 뜨는 태그 아님)
								row(90, ['반도체'], null, '2026-11-10T01:00:00Z'),
								...Array.from({ length: 28 }, (_, i) =>
									row(200 + i, ['코스피'], null, new Date(Date.UTC(2026, 9, 24 + i, 1)).toISOString()),
								),
							]
						: [
								{ id: 20, title: '경제 뉴스레터', category: { name: '경제' } },
								{ id: 10, title: 'IT 뉴스레터', category: { name: 'IT' } },
							],
			),
		},
		highlight: {
			groupBy: jest.fn().mockResolvedValue([{ newsletterId: 10, section: 'story-1', _count: { _all: 4 } }]),
			findMany: jest.fn().mockResolvedValue([{ newsletterId: 10, section: 'story-1', sectionTitle: '반도체' }]),
		},
	};
	const editionService = { latestEdition: jest.fn().mockResolvedValue(edition) };
	return { service: new HomeService(prisma as never, editionService as never), prisma, editionService };
}

const NOW = new Date('2026-11-23T03:00:00Z'); // 12:00 KST

describe('HomeService.today (홈 오늘 묶음)', () => {
	it('오늘의 3줄: 중요도 순 상위 3개, 편집자가 쓴 한 줄', async () => {
		const today = await setup().service.today(NOW);
		expect(today!.topLines.map((s) => [s.heading, s.line])).toEqual([
			['반도체', '반도체 수출 석 달째 증가'],
			['환율', '환율 1,400원 돌파'],
			['금리', '기준금리 동결'],
		]);
	});

	it('편집본에 순위가 없으면 뉴스레터를 쓸 때 매긴 중요도(data-importance, #360)로', async () => {
		const { service, editionService } = setup();
		editionService.latestEdition.mockResolvedValue({
			...edition,
			sources: [
				{
					...edition.sources[0],
					stories: [
						{ ...story('반도체'), importance: 2 },
						{ ...story('AI 규제'), importance: 5 },
					],
				},
			],
			editorial: null,
		});
		const today = await service.today(NOW);
		expect(today!.topLines.map((s) => [s.heading, s.importance, s.line])).toEqual([
			['AI 규제', 5, 'AI 규제 리드'],
			['반도체', 2, '반도체 리드'],
		]);
	});

	it('최신 트렌드(주제별): 뜨는 태그마다 그 태그가 붙은 최근 3일 소식을 새것부터, 소식이 겹치거나 하나뿐인 주제는 뺀다', async () => {
		const today = await setup().service.today(NOW);
		// 반도체: 101 · 102 · 103 (103은 소식 태그로). 환율은 103이 이미 반도체에 쓰여 104 하나만 남아 빠진다
		expect(
			today!.topics.map((t) => [t.tag, t.recent, t.stories.map((s) => [s.newsletterId, s.heading, s.category])]),
		).toEqual([
			[
				'반도체',
				3,
				[
					[101, '반도체 수출 석 달째 증가', '경제'],
					[102, '반도체 공급망 재편', '경제'],
					[103, '환율 급등에 수입물가 비상', '경제'],
				],
			],
		]);
	});

	it('분야를 넘는 흐름: 소식 번호를 제목 · 분야로 풀고, 없는 소식은 뺀다', async () => {
		const today = await setup().service.today(NOW);
		expect(today!.threads).toEqual([
			{
				title: '수출과 환율',
				text: '반도체 수출이 늘며 환율이…',
				stories: [
					{ newsletterId: 10, storyIndex: 1, category: 'IT', heading: '반도체' },
					{ newsletterId: 20, storyIndex: 1, category: '경제', heading: '환율' },
				],
			},
		]);
	});

	it('지금 뜨는 태그: 최근 3일을 그 전 4주와 견줘 늘어난 순, 최근 3일 2번 이상만, 소식 태그도 센다', async () => {
		const today = await setup().service.today(NOW);
		// 금리(1번)는 빠지고, 코스피는 평소(4주 하루 평균 × 3 = 3번)만큼이라 빠진다
		expect(today!.risingTags).toEqual([
			{ tag: '반도체', recent: 3, usual: 0.1 },
			{ tag: '환율', recent: 2, usual: 0 },
		]);
	});

	it('많이 읽은: 상세 조회 순, 지워진 뉴스레터는 뺀다 / 많이 스크랩한: 소식 제목으로', async () => {
		const today = await setup().service.today(NOW);
		expect(today!.mostRead.map((r) => [r.newsletterId, r.views])).toEqual([
			[20, 9],
			[10, 3],
		]);
		expect(today!.mostScrapped).toEqual([{ newsletterId: 10, heading: '반도체', category: 'IT', scraps: 4 }]);
	});

	it('이어지는 이야기: 오늘 소식에서 앞 소식을 거슬러 올라가 오래된 것부터, 같은 사건에서 시작한 사슬은 하나만, 없는 소식이 끼면 뺀다', async () => {
		const today = await setup().service.today(NOW);
		expect(today!.continuing).toEqual([
			{
				steps: [
					{
						newsletterId: 3,
						storyIndex: 1,
						category: 'IT',
						heading: '반도체 수출 부진',
						date: '2026-11-21',
						reason: '',
					},
					{
						newsletterId: 5,
						storyIndex: 1,
						category: 'IT',
						heading: '반도체 지원책',
						date: '2026-11-22',
						reason: '정부가 지원책을 내놨다',
					},
					{
						newsletterId: 10,
						storyIndex: 1,
						category: 'IT',
						heading: '반도체',
						date: '2026-11-23',
						reason: '수출이 석 달째 늘었다',
					},
				],
			},
		]);
	});

	it('5분 동안은 다시 모으지 않는다 (편집본이 없으면 null)', async () => {
		const { service, editionService } = setup();
		await service.today(NOW);
		await service.today(new Date(NOW.getTime() + 60_000));
		expect(editionService.latestEdition).toHaveBeenCalledTimes(1);
		editionService.latestEdition.mockResolvedValue(null);
		expect(await service.today(new Date(NOW.getTime() + 6 * 60_000))).toBeNull();
	});
});
