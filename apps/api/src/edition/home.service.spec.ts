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
		newsletter: {
			findMany: jest.fn(async (args: { select: { keywords?: boolean } }) =>
				args.select.keywords
					? [
							// 그날(11-23 KST) 2편, 그 전 7일 1편
							{ keywords: ['반도체', '환율'], createdAt: new Date('2026-11-23T00:00:00Z') },
							{ keywords: ['반도체'], createdAt: new Date('2026-11-23T01:00:00Z') },
							{ keywords: ['환율', '반도체'], createdAt: new Date('2026-11-20T00:00:00Z') },
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

	it('오늘의 트렌드: 3줄과 겹치지 않고, 사진 있는 소식 먼저', async () => {
		const today = await setup().service.today(NOW);
		expect(today!.trending.map((s) => s.heading)).toEqual(['AI 규제']);
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

	it('지금 뜨는 태그: 그날 수가 지난 7일 하루 평균보다 많은 것, 많이 는 순', async () => {
		const today = await setup().service.today(NOW);
		expect(today!.risingTags).toEqual([
			{ tag: '반도체', today: 2, average: 0.1 },
			{ tag: '환율', today: 1, average: 0.1 },
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

	it('5분 동안은 다시 모으지 않는다 (편집본이 없으면 null)', async () => {
		const { service, editionService } = setup();
		await service.today(NOW);
		await service.today(new Date(NOW.getTime() + 60_000));
		expect(editionService.latestEdition).toHaveBeenCalledTimes(1);
		editionService.latestEdition.mockResolvedValue(null);
		expect(await service.today(new Date(NOW.getTime() + 6 * 60_000))).toBeNull();
	});
});
