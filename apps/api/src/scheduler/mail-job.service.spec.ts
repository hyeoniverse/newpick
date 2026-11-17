import { setup } from './__tests__/jobs.setup';
import { SUMMARY_WINDOW_HOURS } from './schedule';

describe('구독 메일 (#55)', () => {
	it('뉴스레터를 다 만든 뒤 오늘 소식을 한 번 편집해 둔다', async () => {
		const { summaryJob, aiSummaryService, editionService } = setup(0);
		await summaryJob.makeAiSummary();
		expect(editionService.ensureEdition).toHaveBeenCalledTimes(1);
		expect(editionService.ensureEdition.mock.invocationCallOrder[0]).toBeGreaterThan(
			aiSummaryService.summarizeText.mock.invocationCallOrder.at(-1)!,
		);
	});

	it('관심 분야가 있는 구독자마다 고른 분야로 엮은 메일을 보낸다', async () => {
		const edition = { date: '2026-10-27', sources: [], editorial: null };
		const { mailJob, mailService, editionService } = setup(0, edition);
		await mailJob.sendEmailSummary();

		const [subscribers] = mailService.sendBulkMail.mock.calls[0];
		expect(subscribers.map((s: { email: string }) => s.email)).toEqual(['a@example.com']);
		// 사람마다 원클릭 해지(#18)를 붙이도록 회원 id도 넘긴다
		expect(editionService.composeMail).toHaveBeenCalledWith(edition, [1, 3], 7, undefined);
		// 취향 신호가 없으면 맞춤 글도 쓰지 않는다
		expect(editionService.writeNote).not.toHaveBeenCalled();
	});

	it('취향이 있는 구독자는 맞춤 계획을 세우고 사람마다 글을 써서 넘긴다', async () => {
		const edition = {
			date: '2026-10-27',
			editorial: null,
			sources: [
				{
					newsletterId: 20,
					categoryId: 1,
					category: '경제',
					title: '경제',
					stories: [
						{
							kicker: '',
							heading: '반도체 수출 늘어',
							lead: '반도체 수출이 석 달째 늘었다',
							blocks: [],
							sources: [],
						},
					],
				},
			],
		};
		const { mailJob, editionService, tasteService } = setup(0, edition);
		tasteService.profiles.mockResolvedValue(new Map([[7, { topics: [{ name: '반도체', key: '반도체', score: 3 }] }]]));
		await mailJob.sendEmailSummary();

		// 메일을 받는 구독자(관심 분야가 있는 7)만
		expect(tasteService.profiles).toHaveBeenCalledWith([7]);
		expect(editionService.writeNote).toHaveBeenCalledTimes(1);
		const plan = (editionService.composeMail.mock.calls[0] as unknown[])[3] as {
			picks: { ref: string }[];
			note: { subject: string };
		};
		// 임베딩이 없으면(여기서는 빈 결과) 관심 태그로
		expect(tasteService.signalTexts).toHaveBeenCalledWith([7]);
		expect(editionService.embedForPlans).toHaveBeenCalledTimes(1);
		expect(plan.picks).toEqual([{ ref: '20-1', newsletterId: 20 }]);
		expect(plan.note.subject).toBe('맞춤 제목');
	});

	it('추천 기사: 맞춤 신호 그대로 그날 뉴스레터를 빼고 고르고, 맞춤으로 고른 소식이 없어도 계획에 붙는다', async () => {
		const edition = {
			date: '2026-10-27',
			editorial: null,
			sources: [
				{
					newsletterId: 20,
					categoryId: 1,
					category: '경제',
					title: '경제',
					stories: [{ kicker: '', heading: '환율', lead: '', blocks: [], sources: [] }],
				},
			],
		};
		const { mailJob, editionService, tasteService, recommendService } = setup(0, edition);
		const signals = [{ kind: 'bookmark', label: 'x', vector: [1, 0] }];
		tasteService.profiles.mockResolvedValue(
			new Map([[7, { topics: [{ name: '야구', key: '야구', score: 1 }], signals }]]),
		);
		const articles = [
			{
				title: '기사',
				link: 'https://n.news/1',
				source: '한경',
				category: '경제',
				score: 0.7,
			},
		];
		recommendService.forUsers.mockResolvedValue(new Map([[7, articles]]));
		await mailJob.sendEmailSummary();

		const [users, window, newsletterIds] = recommendService.forUsers.mock.calls[0];
		// 임베딩이 없으면(여기서는 빈 결과) 메일에 실린 소식 벡터도 없다
		expect(users).toEqual([{ userId: 7, signals, shown: [] }]);
		expect(window.end.getTime() - window.start.getTime()).toBe(SUMMARY_WINDOW_HOURS * 60 * 60 * 1000);
		expect(newsletterIds).toEqual([20]);
		// 관심(야구)이 소식에 안 닿아 맞춤 계획은 없지만 추천 기사는 붙는다
		expect((editionService.composeMail.mock.calls[0] as unknown[])[3]).toEqual({
			picks: [],
			articles,
		});
	});

	it('맞춤 메일을 끈 사람은 취향을 계산하지 않고 분야별 메일을 받는다 (#123 16)', async () => {
		const edition = { date: '2026-10-27', sources: [], editorial: null };
		const { mailJob, tasteService, editionService, prisma } = setup(0, edition);
		prisma.optedOut.add(7);
		await mailJob.sendEmailSummary();
		expect(tasteService.profiles).toHaveBeenCalledWith([]);
		expect((editionService.composeMail.mock.calls[0] as unknown[])[3]).toBeFalsy();
	});

	it('팔로우한 태그 칸: 맞춤을 꺼도, 태그마다 그날 소식(모든 분야) · 기사, 소식 · 기사가 없는 태그는 뺀다', async () => {
		const edition = {
			date: '2026-10-27',
			editorial: null,
			sources: [
				{
					newsletterId: 30,
					categoryId: 3,
					category: '세계',
					title: '세계',
					stories: [
						{
							kicker: '',
							heading: '룰라 4선',
							lead: '',
							blocks: [],
							sources: [],
						},
					],
				},
			],
		};
		const { mailJob, editionService, tasteService, recommendService, prisma } = setup(0, edition);
		prisma.optedOut.add(7);
		tasteService.tagFollows.mockResolvedValue(
			new Map([
				[
					7,
					[
						{ name: '룰라', key: '룰라' },
						{ name: '야구', key: '야구' },
					],
				],
			]),
		);
		const article = {
			title: '룰라 여파',
			link: 'https://n.news/1',
			source: '한경',
			category: '경제',
			score: 1,
		};
		recommendService.forTags.mockResolvedValue(new Map([[7, new Map([['룰라', [article]]])]]));
		await mailJob.sendEmailSummary();
		expect(tasteService.tagFollows).toHaveBeenCalledWith([7]);
		expect((editionService.composeMail.mock.calls[0] as unknown[])[3]).toEqual({
			picks: [],
			tags: [
				{
					tag: '룰라',
					stories: [
						{
							ref: '30-1',
							newsletterId: 30,
							category: '세계',
							heading: '룰라 4선',
						},
					],
					articles: [article],
				},
			],
		});
	});

	it('지켜보던 소식의 후속: 맞춤을 꺼도(취향 없음) 계정 있는 구독자 모두에게, 지난 메일 이후 것만', async () => {
		const edition = { date: '2026-10-27', sources: [], editorial: null };
		const { mailJob, editionService, followsService, prisma } = setup(0, edition);
		prisma.optedOut.add(7);
		const follows = [
			{
				followed: '룰라 4선',
				followedNewsletterId: 63,
				heading: '보우소나루 불복',
				reason: '선거 무효 요청',
				newsletterId: 69,
				category: '세계',
			},
		];
		followsService.forMail.mockResolvedValue(new Map([[7, follows]]));
		await mailJob.sendEmailSummary();
		const [ids, since] = followsService.forMail.mock.calls[0];
		expect(ids).toEqual([7]);
		expect(Date.now() - since.getTime()).toBeGreaterThanOrEqual(SUMMARY_WINDOW_HOURS * 60 * 60 * 1000 - 1000);
		expect((editionService.composeMail.mock.calls[0] as unknown[])[3]).toEqual({
			picks: [],
			follows,
		});
	});

	it('오늘 나온 뉴스레터가 없으면 보내지 않는다 (어제 메일을 다시 보내지 않게)', async () => {
		const { mailJob, mailService } = setup(0, null);
		await mailJob.sendEmailSummary();
		expect(mailService.sendBulkMail).not.toHaveBeenCalled();
	});

	it('생성이 진행 중이면 끝난 뒤에 보낸다', async () => {
		const edition = { date: '2026-10-27', sources: [], editorial: null };
		const { mailJob, summaryJob, aiSummaryService, mailService } = setup(0, edition);
		let finish: () => void;
		aiSummaryService.summarizeText.mockImplementationOnce(
			() => new Promise((resolve) => (finish = () => resolve({ newsletter: null }))),
		);
		const summary = summaryJob.makeAiSummary();
		const mail = mailJob.sendEmailSummary();
		await new Promise((r) => setImmediate(r));
		expect(mailService.sendBulkMail).not.toHaveBeenCalled();

		finish!();
		await Promise.all([summary, mail]);
		expect(mailService.sendBulkMail).toHaveBeenCalledTimes(1);
	});
});
