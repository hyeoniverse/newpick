import { BREAKING_LIMITS, isNight } from './breaking';
import { renderBreakingMail } from './breaking-mail';
import { BreakingSendService, breakingMailFor } from './breaking-send.service';
import { verifyUnsubscribeToken } from 'src/subscriber/unsubscribe-token';

const HOUR = 60 * 60 * 1000;
/** KST 시각 (2026-11-24) */
const kst = (hour: number, minute = 0) =>
	new Date(`2026-11-24T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+09:00`);

const alertRow = (over: Record<string, unknown> = {}) => ({
	id: 7,
	status: 'scheduled',
	headline: '대통령 비상계엄 선포',
	reason: '헌정 질서에 영향을 주는 긴급 조치',
	articles: [{ title: '계엄 선포', link: 'https://news.test/1', source: '연합' }],
	detectedAt: kst(14, 0),
	sendAt: kst(14, 5),
	nightPending: false,
	...over,
});

const sub = (userId: number) => ({ userId, user: { email: `u${userId}@test.dev`, username: null } });

const setup = ({ due = [] as unknown[], pending = [] as unknown[], claimed = 1 } = {}) => {
	const prisma = {
		breakingAlert: {
			findMany: jest.fn(({ where }) => Promise.resolve(where.nightPending ? pending : due)),
			updateMany: jest.fn().mockResolvedValue({ count: claimed }),
			update: jest.fn().mockResolvedValue({}),
		},
		subscriber: { findMany: jest.fn().mockResolvedValue([sub(1), sub(2)]) },
	};
	const mail = {
		sendBulkMail: jest.fn(async (subscribers: { userId: number }[], build: (s: never) => unknown) => {
			subscribers.forEach((s) => build(s as never));
			return { success: subscribers.length, failed: 0, skipped: 0, details: [] };
		}),
	};
	const service = new BreakingSendService(prisma as never, mail as never);
	return { service, prisma, mail };
};

describe('속보 메일 보내기', () => {
	it('밤: KST 22시부터 아침 7시 전까지', () => {
		expect([21, 22, 3, 6, 7, 14].map((h) => isNight(kst(h, 30)))).toEqual([false, true, true, true, false, false]);
	});

	it('낮: 보낼 시각이 된 속보를 먼저 메일 보냄으로 바꾸고, 구독 중 · 속보 켜진 사람 모두에게 보낸 뒤 받은 수를 남긴다', async () => {
		const { service, prisma, mail } = setup({ due: [alertRow()] });
		await service.tick(kst(14, 6));
		expect(prisma.breakingAlert.updateMany).toHaveBeenCalledWith({
			where: { id: 7, status: 'scheduled' },
			data: { status: 'sent', sentAt: kst(14, 6), nightPending: false },
		});
		expect(prisma.subscriber.findMany.mock.calls[0][0].where).toEqual({
			status: 'active',
			user: { breakingMail: true },
		});
		expect(mail.sendBulkMail).toHaveBeenCalledTimes(1);
		expect(prisma.breakingAlert.update).toHaveBeenCalledWith({
			where: { id: 7 },
			data: { recipients: { increment: 2 } },
		});
	});

	it('밤: 밤에도 바로 받기를 켠 사람에게만 보내고, 아침에 보낼 차례로 남긴다', async () => {
		const { service, prisma } = setup({ due: [alertRow({ sendAt: kst(23, 5) })] });
		await service.tick(kst(23, 6));
		expect(prisma.breakingAlert.updateMany.mock.calls[0][0].data.nightPending).toBe(true);
		expect(prisma.subscriber.findMany.mock.calls[0][0].where.user).toEqual({ breakingMail: true, breakingNight: true });
	});

	it('아침(밤이 아닐 때): 미뤄 둔 속보를 밤에 받지 않기로 한 사람에게 보내고 차례를 지운다', async () => {
		const pending = alertRow({ status: 'sent', nightPending: true, detectedAt: kst(1, 0) });
		const { service, prisma, mail } = setup({ pending: [pending] });
		await service.tick(kst(7, 0));
		expect(prisma.breakingAlert.updateMany).toHaveBeenCalledWith({
			where: { id: 7, nightPending: true },
			data: { nightPending: false },
		});
		expect(prisma.subscriber.findMany.mock.calls[0][0].where.user).toEqual({
			breakingMail: true,
			breakingNight: false,
		});
		expect(mail.sendBulkMail).toHaveBeenCalledTimes(1);
	});

	it('밤에는 미뤄 둔 속보를 보내지 않는다', async () => {
		const { service, mail, prisma } = setup({ pending: [alertRow({ status: 'sent', nightPending: true })] });
		await service.tick(kst(3, 0));
		expect(mail.sendBulkMail).not.toHaveBeenCalled();
		expect(prisma.breakingAlert.findMany).toHaveBeenCalledTimes(1);
	});

	it(`늦은 속보는 메일을 보내지 않는다: 보낼 시각이 ${BREAKING_LIMITS.staleHours}시간 넘게 지남 · 아침에 감지한 지 ${BREAKING_LIMITS.morningHours}시간 넘음`, async () => {
		const stale = setup({
			due: [alertRow({ sendAt: new Date(kst(14).getTime() - (BREAKING_LIMITS.staleHours + 1) * HOUR) })],
		});
		await stale.service.tick(kst(14));
		expect(stale.prisma.breakingAlert.updateMany.mock.calls[0][0].data).toMatchObject({
			status: 'sent',
			nightPending: false,
		});
		expect(stale.mail.sendBulkMail).not.toHaveBeenCalled();

		const old = setup({
			pending: [alertRow({ status: 'sent', nightPending: true, detectedAt: new Date(kst(7).getTime() - 13 * HOUR) })],
		});
		await old.service.tick(kst(7));
		expect(old.mail.sendBulkMail).not.toHaveBeenCalled();
	});

	it('다른 회차가 먼저 가져갔으면(바꾼 행 0) 보내지 않는다: 같은 속보를 두 번 보내지 않게', async () => {
		const { service, mail } = setup({ due: [alertRow()], claimed: 0 });
		await service.tick(kst(14, 6));
		expect(mail.sendBulkMail).not.toHaveBeenCalled();
	});

	it("받는 사람 한 명의 메일: '속보만 받지 않기'와 메일 앱 구독 취소 단추는 속보만 끄는 토큰, 수신 거부는 구독 해지 토큰", () => {
		const mail = breakingMailFor({ ...alertRow(), detectedAt: kst(14) } as never, 42);
		expect(mail.subject).toBe('[속보] 대통령 비상계엄 선포');
		expect(mail.newsletterIds).toEqual([]);
		const off = /\/breaking\/off\?token=([^"&]+)/.exec(mail.html)![1];
		expect(verifyUnsubscribeToken(off, 'breaking-off')).toBe(42);
		expect(verifyUnsubscribeToken(off)).toBeNull();
		const unsub = /\/unsubscribe\?token=([^"&]+)/.exec(mail.html)![1];
		expect(verifyUnsubscribeToken(unsub)).toBe(42);
		expect(mail.headers!['List-Unsubscribe']).toContain(`/api/breaking/off?token=${off}`);
		expect(mail.headers!['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
	});

	it('메일 HTML: 사건 · 이유 · 관련 기사(웹 주소만) · 뉴픽에서 보기, 글자는 이스케이프', () => {
		const { html } = renderBreakingMail(
			{
				id: 7,
				headline: '<b>계엄</b>',
				reason: '이유',
				articles: [
					{ title: '기사', link: 'https://news.test/1', source: '연합' },
					{ title: '나쁜 링크', link: 'javascript:alert(1)', source: 'x' },
				],
				detectedAt: kst(15, 12),
			},
			'https://newpick.test/',
		);
		expect(html).toContain('&lt;b&gt;계엄&lt;/b&gt;');
		expect(html).toContain('https://news.test/1');
		expect(html).not.toContain('javascript:');
		expect(html).toContain('https://newpick.test/breaking/7?utm_source=newsletter');
		expect(html).toContain('오후 3:12');
	});
});
