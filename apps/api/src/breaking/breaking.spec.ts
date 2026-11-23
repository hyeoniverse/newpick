import { AiUnavailable } from 'src/ai/ai.service';
import { BREAKING_LIMITS, breakingPrompt, eventsFrom } from './breaking';
import { BreakingService } from './breaking.service';

const article = (n: number, title = `기사 ${n}`) => ({
	title,
	link: `https://news.test/${n}`,
	source: '연합',
	category: '정치',
});

describe('속보 판정 규칙', () => {
	const articles = [article(1, '대통령 비상계엄 선포'), article(2, '계엄군 국회 진입'), article(3, '프로야구 결과')];

	it(`${BREAKING_LIMITS.minScore}점 이상만, 기사 번호는 실제 기사로 (없는 번호 · 중복은 빼고), 점수 높은 순`, () => {
		const events = eventsFrom(
			{
				events: [
					{ score: 9, headline: '전국 휴교령', reason: '전국 단위 긴급 조치', items: [3] },
					{ score: 10, headline: ' 대통령, 비상계엄 선포 ', reason: '헌정 질서', items: [1, 2, 2, 9] },
					{ score: 8, headline: '정책 발표', reason: '', items: [1] },
					{ score: 10, headline: '기사 없음', reason: '', items: [99] },
				],
			},
			articles,
		);
		expect(events.map((e) => [e.score, e.headline, e.articles.map((a) => a.link)])).toEqual([
			[10, '대통령, 비상계엄 선포', ['https://news.test/1', 'https://news.test/2']],
			[9, '전국 휴교령', ['https://news.test/3']],
		]);
		expect(eventsFrom({ nope: 1 }, articles)).toEqual([]);
	});

	it('프롬프트: 기준을 아주 엄격하게, 애매하면 낮게, 대부분은 하나도 없다', () => {
		const prompt = breakingPrompt(articles);
		expect(prompt).toContain('[1] (정치) 대통령 비상계엄 선포');
		expect(prompt).toContain('계엄 선포');
		expect(prompt).toContain('수능');
		expect(prompt).toContain('애매하면 낮게');
	});
});

describe('BreakingService', () => {
	const news = (n: number, title: string) => ({ ...article(n, title), category: ['정치'] }) as never;
	const setup = (recent: { headline: string; articles: unknown }[] = []) => {
		const prisma = {
			breakingAlert: {
				findMany: jest.fn().mockResolvedValue(recent),
				createMany: jest.fn().mockResolvedValue({ count: 1 }),
				updateMany: jest.fn().mockResolvedValue({ count: 1 }),
				findUnique: jest.fn(),
			},
		};
		const ai = { generate: jest.fn(), embed: jest.fn() };
		const mail = { sendHtmlMail: jest.fn().mockResolvedValue({}) };
		return { prisma, ai, mail, service: new BreakingService(prisma as never, ai as never, mail as never) };
	};
	const judged = (events: unknown[]) => ({ text: JSON.stringify({ events }) });

	it('새 기사가 없으면 아무것도 부르지 않는다', async () => {
		const { ai, service } = setup();
		expect(await service.detect([])).toBe(0);
		expect(await service.detect(undefined)).toBe(0);
		expect(ai.generate).not.toHaveBeenCalled();
	});

	it('기준을 넘는 사건을 확인 대기로 남긴다 (오픈 모델 먼저, Claude로 넘길 수 있게)', async () => {
		const { prisma, ai, service } = setup();
		ai.generate.mockResolvedValue(judged([{ score: 10, headline: '비상계엄 선포', reason: '헌정', items: [1] }]));
		ai.embed.mockResolvedValue([[1, 0]]);
		expect(await service.detect([news(1, '대통령 비상계엄 선포'), news(2, '야구')])).toBe(1);
		expect(ai.generate.mock.calls[0][0]).toMatchObject({ stage: 'breaking-judge', prefer: 'open' });
		expect(ai.generate.mock.calls[0][0].fallback).toBeUndefined();
		expect(prisma.breakingAlert.createMany).toHaveBeenCalledWith({
			data: [
				{
					score: 10,
					headline: '비상계엄 선포',
					reason: '헌정',
					articles: [{ title: '대통령 비상계엄 선포', link: 'https://news.test/1', source: '연합' }],
				},
			],
		});
	});

	it('최근 후보와 같은 사건은 다시 올리지 않는다: 관련 기사가 겹치거나 한 줄이 아주 비슷하면', async () => {
		const { prisma, ai, service } = setup([
			{ headline: '비상계엄 선포', articles: [{ title: '', link: 'https://news.test/1', source: '' }] },
			{ headline: '서울 지진', articles: [] },
		]);
		ai.generate.mockResolvedValue(
			judged([
				{ score: 10, headline: '계엄 해제 요구', reason: '', items: [1] }, // 기사 겹침
				{ score: 10, headline: '서울 규모 7 지진', reason: '', items: [2] }, // 한 줄이 비슷함
				{ score: 9, headline: '전국 휴교령', reason: '', items: [3] },
			]),
		);
		ai.embed.mockResolvedValue([
			[1, 0, 0],
			[0, 1, 0],
			[0, 0, 1],
			[1, 0, 0],
			[0, 0.99, 0.1],
		]);
		expect(await service.detect([news(1, 'a'), news(2, 'b'), news(3, 'c')])).toBe(1);
		expect(prisma.breakingAlert.createMany.mock.calls[0][0].data.map((d: { headline: string }) => d.headline)).toEqual([
			'전국 휴교령',
		]);
	});

	it('판정을 못 하면 이번 회차는 건너뛴다 (던지지 않음)', async () => {
		const { prisma, ai, service } = setup();
		ai.generate.mockRejectedValue(new AiUnavailable('429'));
		expect(await service.detect([news(1, 'a')])).toBe(0);
		expect(prisma.breakingAlert.createMany).not.toHaveBeenCalled();
	});

	it('승인 · 기각은 확인 대기인 것만, 이미 처리했으면 CONFLICT · 없으면 NOT_FOUND', async () => {
		const { prisma, service } = setup();
		expect(await service.decide(3, 'approve', 7)).toEqual({ id: 3, status: 'approved' });
		expect(prisma.breakingAlert.updateMany.mock.calls[0][0]).toMatchObject({
			where: { id: 3, status: 'pending' },
			data: { status: 'approved', decidedBy: 7 },
		});
		prisma.breakingAlert.updateMany.mockResolvedValue({ count: 0 });
		prisma.breakingAlert.findUnique.mockResolvedValueOnce({ id: 3 });
		await expect(service.decide(3, 'reject', 7)).rejects.toMatchObject({ code: 'CONFLICT' });
		prisma.breakingAlert.findUnique.mockResolvedValueOnce(null);
		await expect(service.decide(4, 'reject', 7)).rejects.toMatchObject({ code: 'NOT_FOUND' });
	});
});
