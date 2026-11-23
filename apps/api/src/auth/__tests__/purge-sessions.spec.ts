import { AuthService } from '../auth.service';

describe('만료된 로그인 세션 정리 (#341)', () => {
	it('지금보다 먼저 끝난 세션만 지운다', async () => {
		const deleteMany = jest.fn().mockResolvedValue({ count: 3 });
		const service = new AuthService({} as never, { oAuthToken: { deleteMany } } as never);
		const before = Date.now();

		expect(await service.purgeExpiredSessions()).toBe(3);
		const lt = deleteMany.mock.calls[0][0].where.expiresAt.lt as Date;
		expect(lt.getTime()).toBeGreaterThanOrEqual(before);
	});
});
