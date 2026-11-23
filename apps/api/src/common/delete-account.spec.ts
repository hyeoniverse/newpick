import { deleteAccount } from './delete-account';
import { MyPageController } from 'src/mypage/mypage.controller';

function prismaMock(
	user: {
		id: number;
		email: string;
		subscribers?: { status: string }[];
	} | null,
) {
	const ops: string[] = [];
	const prisma = {
		user: {
			findUnique: jest.fn().mockResolvedValue(user && { subscribers: [], ...user }),
			delete: jest.fn((args) => {
				ops.push(`user.delete ${args.where.id}`);
				return 'user.delete';
			}),
		},
		subscriptionEvent: {
			create: jest.fn((args) => {
				ops.push(`subscriptionEvent.create ${args.data.type}`);
				return 'event';
			}),
			updateMany: jest.fn((args) => {
				ops.push(`subscriptionEvent.updateMany ${args.where.userId}`);
				return 'anonymize';
			}),
		},
		emailArchive: {
			deleteMany: jest.fn((args) => {
				ops.push(`emailArchive.deleteMany ${args.where.email}`);
				return 'archives';
			}),
		},
		mailPlan: {
			deleteMany: jest.fn((args) => {
				ops.push(`mailPlan.deleteMany ${args.where.email}`);
				return 'plans';
			}),
		},
		$transaction: jest.fn(async (list: unknown[]) => {
			ops.push(`transaction(${list.length})`);
			return [{ count: 3 }, { id: user?.id }];
		}),
	};
	return { prisma, ops };
}

describe('회원 탈퇴 (#65)', () => {
	it('메일 발송 기록 · 맞춤 메일 계획(이메일로 저장)과 회원을 한 트랜잭션으로 지운다 (#340: 계획이 남았다)', async () => {
		const { prisma, ops } = prismaMock({ id: 7, email: 'a@example.com' });
		const result = await deleteAccount(prisma as never, 7);

		expect(ops).toEqual([
			'emailArchive.deleteMany a@example.com',
			'mailPlan.deleteMany a@example.com',
			'user.delete 7',
			'subscriptionEvent.updateMany 7',
			'transaction(4)',
		]);
		expect(result).toEqual({ id: 7, deletedEmailArchives: 3 });
	});

	it('구독 중(일시정지 포함)에 탈퇴하면 같은 트랜잭션에 해지 기록을 남긴다 (#122 통계)', async () => {
		const { prisma, ops } = prismaMock({
			id: 7,
			email: 'a@example.com',
			subscribers: [{ status: 'paused' }],
		});
		await deleteAccount(prisma as never, 7);
		expect(ops).toEqual([
			'emailArchive.deleteMany a@example.com',
			'mailPlan.deleteMany a@example.com',
			'user.delete 7',
			'subscriptionEvent.create cancel',
			'subscriptionEvent.updateMany 7',
			'transaction(5)',
		]);
	});

	it('구독 기록은 지우지 않고 회원 번호만 알 수 없는 음수 번호로 바꾼다 (#341 처리방침 · 통계는 사람 단위로 남음)', async () => {
		const { prisma } = prismaMock({ id: 7, email: 'a@example.com', subscribers: [{ status: 'active' }] });
		await deleteAccount(prisma as never, 7);
		const { where, data } = prisma.subscriptionEvent.updateMany.mock.calls[0][0];
		expect(where).toEqual({ userId: 7 });
		expect(data.userId).toBeLessThan(0);
		expect(Number.isInteger(data.userId)).toBe(true);
	});

	it('없는 회원이면 404, 아무것도 지우지 않는다', async () => {
		const { prisma } = prismaMock(null);
		await expect(deleteAccount(prisma as never, 9)).rejects.toMatchObject({
			code: 'USER_NOT_FOUND',
			status: 404,
		});
		expect(prisma.$transaction).not.toHaveBeenCalled();
	});

	it('탈퇴 API는 지운 뒤 로그인 쿠키 3개를 지운다', async () => {
		const service = { deleteAccount: jest.fn().mockResolvedValue({}) };
		const res = { clearCookie: jest.fn() };
		await new MyPageController(
			service as never,
			{} as never,
			{} as never,
			{} as never,
			{} as never,
			{} as never,
			{} as never,
			{} as never,
		).deleteAccount({ user: { id: 7 } } as never, res as never);

		expect(service.deleteAccount).toHaveBeenCalledWith(7);
		expect(res.clearCookie.mock.calls.map(([name]) => name)).toEqual(['access_token', 'refresh_token', 'logged_in']);
	});
});
