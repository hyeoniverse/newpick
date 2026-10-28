import { MysqlPrismaService } from 'prisma/mysql.service';

export type SubscriptionEventType = 'subscribe' | 'pause' | 'resume' | 'cancel';

/**
 * 구독 기록 한 줄 (#122 통계). 구독 상태를 바꾸는 쓰기와 같은 $transaction 배열에 넣어,
 * 상태만 바뀌고 기록이 빠지는 일이 없게 한다
 */
export function subscriptionEvent(
  prisma: MysqlPrismaService,
  userId: number,
  type: SubscriptionEventType,
  interests?: number[],
) {
  return prisma.subscriptionEvent.create({
    data: { userId, type, ...(interests && { interests }) },
  });
}
