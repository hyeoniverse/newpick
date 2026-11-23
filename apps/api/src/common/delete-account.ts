import { randomInt } from 'node:crypto';
import { MysqlPrismaService } from 'src/prisma/mysql.service';
import { AppException } from './errors/app.exception';
import { subscriptionEvent } from './subscription-event';

/**
 * 회원과 그 회원의 개인정보를 한 번에 지운다 (#65, 개인정보 처리방침 "탈퇴하면 함께 파기").
 * - 관심 분야·구독·북마크·로그인 토큰: users를 지우면 함께 지워진다 (onDelete: Cascade)
 * - 메일 발송 기록(email_archives) · 맞춤 메일 계획(mail_plans): 회원과 연결 없이 이메일 문자열로 저장돼 따로 지운다
 *   (#340: mail_plans가 빠져 탈퇴 뒤에도 남았다)
 * - 구독 기록(subscription_events, 통계용): 회원 번호를 누구인지 알 수 없는 음수 번호로 바꾼다 (#341: 처리방침은 탈퇴하면
 *   구독 상태 · 일시를 함께 지운다고 적는데 회원 번호째 남았다). 통계는 기록을 사람마다 따라가 세므로 지우거나 비우지 않고
 *   사람 단위는 남긴다. 회원 번호는 다시 쓰이지 않고(autoincrement) 음수라 새 회원과 겹치지 않는다
 * 둘 중 하나만 지워지지 않게 한 트랜잭션으로 묶는다
 */
export async function deleteAccount(prisma: MysqlPrismaService, userId: number) {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			email: true,
			subscribers: { select: { status: true } },
		},
	});
	if (!user) throw new AppException('USER_NOT_FOUND');

	// 구독 중(일시정지 포함)에 탈퇴하면 통계에는 해지로 남긴다 (#122). 구독 기록은 회원과 묶지 않아 남는다
	const subscribed = user.subscribers.some((s) => s.status !== 'cancelled');
	const [archives] = await prisma.$transaction([
		prisma.emailArchive.deleteMany({ where: { email: user.email } }),
		prisma.mailPlan.deleteMany({ where: { email: user.email } }),
		prisma.user.delete({ where: { id: user.id } }),
		...(subscribed ? [subscriptionEvent(prisma, user.id, 'cancel')] : []),
		prisma.subscriptionEvent.updateMany({ where: { userId: user.id }, data: { userId: -randomInt(1, 2 ** 31 - 1) } }),
	]);
	return { id: user.id, deletedEmailArchives: archives.count };
}
