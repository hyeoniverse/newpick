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
	const news = (n: number, title: string, images: string[] = []) =>
		({ ...article(n, title), category: ['정치'], images }) as never;
	const setup = (recent: { headline: string; articles: unknown }[] = []) => {
		const prisma = {
			breakingAlert: {
				findMany: jest.fn().mockResolvedValue(recent),
				createMany: jest.fn().mockResolvedValue({ count: 1 }),
				updateMany: jest.fn().mockResolvedValue({ count: 1 }),
				findUnique: jest.fn(),
				findFirst: jest.fn(),
				// 오늘 이미 자동으로 나갔거나 나갈 속보 수
				count: jest.fn().mockResolvedValue(0),
			},
			// 자동 발송 스위치 (행이 없으면 켜짐)
			scheduleConfig: { findUnique: jest.fn().mockResolvedValue(null), upsert: jest.fn().mockResolvedValue({}) },
			// 메일의 '속보만 받지 않기'
			user: { findUnique: jest.fn(), updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
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

	it(`기준을 넘는 사건은 ${BREAKING_LIMITS.holdMinutes}분 뒤 발송 예정으로 남긴다 (오픈 모델 먼저, Claude로 넘길 수 있게)`, async () => {
		const { prisma, ai, mail, service } = setup();
		ai.generate.mockResolvedValue(judged([{ score: 10, headline: '비상계엄 선포', reason: '헌정', items: [1] }]));
		ai.embed.mockResolvedValue([[1, 0]]);
		const before = Date.now();
		expect(await service.detect([news(1, '대통령 비상계엄 선포', ['https://img.test/1.jpg']), news(2, '야구')])).toBe(
			1,
		);
		expect(ai.generate.mock.calls[0][0]).toMatchObject({ stage: 'breaking-judge', prefer: 'open' });
		expect(ai.generate.mock.calls[0][0].fallback).toBeUndefined();
		const [row] = prisma.breakingAlert.createMany.mock.calls[0][0].data;
		expect(row).toMatchObject({
			status: 'scheduled',
			score: 10,
			headline: '비상계엄 선포',
			// 기사 대표 사진도 함께 남긴다 (홈 큰 속보 칸)
			articles: [
				{ title: '대통령 비상계엄 선포', link: 'https://news.test/1', source: '연합', image: 'https://img.test/1.jpg' },
			],
		});
		expect(row.sendAt.getTime() - before).toBeGreaterThanOrEqual(BREAKING_LIMITS.holdMinutes * 60 * 1000 - 50);
		// 운영자 알림은 주소가 설정된 경우에만 (테스트 환경에는 없음)
		expect(mail.sendHtmlMail).not.toHaveBeenCalled();
	});

	it(`자동 발송이 꺼져 있거나 오늘 상한(${BREAKING_LIMITS.dailyLimit}건)을 채웠으면 보류로 남긴다`, async () => {
		const off = setup();
		off.prisma.scheduleConfig.findUnique.mockResolvedValue({ breakingAuto: false });
		off.ai.generate.mockResolvedValue(judged([{ score: 10, headline: '계엄', reason: '', items: [1] }]));
		off.ai.embed.mockResolvedValue([[1, 0]]);
		await off.service.detect([news(1, 'a')]);
		expect(off.prisma.breakingAlert.createMany.mock.calls[0][0].data[0]).toMatchObject({
			status: 'held',
			sendAt: null,
		});

		const full = setup();
		full.prisma.breakingAlert.count.mockResolvedValue(BREAKING_LIMITS.dailyLimit - 1);
		full.ai.generate.mockResolvedValue(
			judged([
				{ score: 10, headline: '계엄', reason: '', items: [1] },
				{ score: 9, headline: '휴교령', reason: '', items: [2] },
			]),
		);
		full.ai.embed.mockResolvedValue([
			[1, 0],
			[0, 1],
		]);
		await full.service.detect([news(1, 'a'), news(2, 'b')]);
		expect(full.prisma.breakingAlert.createMany.mock.calls[0][0].data.map((d: { status: string }) => d.status)).toEqual(
			['scheduled', 'held'],
		);
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

	it('보내지 않기 · 지금 바로 보내기는 아직 안 나간 것(보류 · 보낼 시각 전 발송 예정)만, 나갔거나 취소했으면 CONFLICT · 없으면 NOT_FOUND', async () => {
		const { prisma, service } = setup();
		expect(await service.decide(3, 'cancel', 7)).toEqual({ id: 3, status: 'canceled' });
		const { where, data } = prisma.breakingAlert.updateMany.mock.calls[0][0];
		expect(where.id).toBe(3);
		expect(where.OR).toEqual([{ status: 'held' }, { status: 'scheduled', sendAt: { gt: expect.any(Date) } }]);
		expect(data).toMatchObject({ status: 'canceled', sendAt: null, decidedBy: 7 });

		expect(await service.decide(3, 'send', 7)).toEqual({ id: 3, status: 'scheduled' });
		expect(prisma.breakingAlert.updateMany.mock.calls[1][0].data).toMatchObject({ status: 'scheduled', decidedBy: 7 });

		prisma.breakingAlert.updateMany.mockResolvedValue({ count: 0 });
		prisma.breakingAlert.findUnique.mockResolvedValueOnce({ id: 3 });
		await expect(service.decide(3, 'cancel', 7)).rejects.toMatchObject({ code: 'CONFLICT' });
		prisma.breakingAlert.findUnique.mockResolvedValueOnce(null);
		await expect(service.decide(4, 'cancel', 7)).rejects.toMatchObject({ code: 'NOT_FOUND' });
	});

	it(`홈 속보 띠: 나간 것(발송함 · 보낼 시각이 지난 발송 예정)만, ${BREAKING_LIMITS.noticeHours}시간 안, 없으면 null`, async () => {
		const { prisma, service } = setup();
		prisma.breakingAlert.findFirst.mockResolvedValueOnce(null);
		expect(await service.latestNotice()).toBeNull();
		const now = new Date('2026-11-24T12:00:00Z');
		prisma.breakingAlert.findFirst.mockResolvedValueOnce({
			id: 5,
			headline: '비상계엄 선포',
			reason: '헌정',
			articles: [
				{ title: 't', link: 'l', source: 's' },
				{ title: 't2', link: 'l2', source: 's', image: 'https://img.test/2.jpg' },
			],
			detectedAt: new Date('2026-11-24T11:50:00Z'),
		});
		// 사진은 관련 기사 가운데 사진이 있는 첫 기사의 것
		expect(await service.latestNotice(now)).toMatchObject({
			id: 5,
			headline: '비상계엄 선포',
			image: 'https://img.test/2.jpg',
		});
		const { where } = prisma.breakingAlert.findFirst.mock.calls[1][0];
		expect(where.OR).toEqual([{ status: 'sent' }, { status: 'scheduled', sendAt: { lte: now } }]);
		expect(where.detectedAt.gte).toEqual(new Date('2026-11-23T12:00:00Z'));
	});

	it('지난 속보: 나간 것만(메일 보냄 · 보낼 시각이 지난 발송 예정), 하나를 볼 때도 같은 조건이고 없으면 NOT_FOUND', async () => {
		const { prisma, service } = setup();
		const now = new Date('2026-11-24T12:00:00Z');
		prisma.breakingAlert.findMany.mockResolvedValueOnce([
			{ id: 3, headline: 'h', reason: 'r', articles: [], detectedAt: now },
		]);
		expect(await service.archive(now)).toEqual([
			{ id: 3, headline: 'h', reason: 'r', articles: [], detectedAt: now.toISOString(), image: null },
		]);
		expect(prisma.breakingAlert.findMany.mock.calls[0][0].where.OR).toEqual([
			{ status: 'sent' },
			{ status: 'scheduled', sendAt: { lte: now } },
		]);
		prisma.breakingAlert.findFirst.mockResolvedValueOnce(null);
		await expect(service.archiveItem(9, now)).rejects.toMatchObject({ code: 'NOT_FOUND' });
		expect(prisma.breakingAlert.findFirst.mock.calls[0][0].where).toMatchObject({ id: 9 });
	});

	it("'속보만 받지 않기': 확인은 가린 주소 · 받는지(바꾸지 않음), 끄기는 여러 번 불러도 같은 결과", async () => {
		const { prisma, service } = setup();
		prisma.user.findUnique.mockResolvedValueOnce({ email: 'hello@test.dev', breakingMail: true });
		expect(await service.offTarget(1)).toEqual({ email: 'he***@test.dev', receiving: true });
		expect(prisma.user.updateMany).not.toHaveBeenCalled();
		expect(await service.turnOff(1)).toEqual({ turnedOff: true });
		expect(prisma.user.updateMany).toHaveBeenCalledWith({
			where: { id: 1, breakingMail: true },
			data: { breakingMail: false },
		});
		prisma.user.updateMany.mockResolvedValueOnce({ count: 0 });
		expect(await service.turnOff(1)).toEqual({ turnedOff: false });
	});

	it('자동 발송 끄기 · 켜기는 설정 행에 남긴다', async () => {
		const { prisma, service } = setup();
		expect(await service.setAuto(false)).toEqual({ auto: false });
		expect(prisma.scheduleConfig.upsert.mock.calls[0][0]).toMatchObject({ update: { breakingAuto: false } });
	});
});
