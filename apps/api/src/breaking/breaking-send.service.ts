import { Injectable, Logger } from '@nestjs/common';
import type { BreakingArticle } from '@newpick/shared';
import { MysqlPrismaService } from 'src/prisma/mysql.service';
import { MailService, type BuiltMail } from 'src/mail/mail.service';
import { createUnsubscribeToken } from 'src/subscriber/unsubscribe-token';
import { env } from 'src/config/env';
import { errorMessage } from 'src/common/error-message';
import { BREAKING_LIMITS, isNight } from './breaking';
import { renderBreakingMail, type BreakingMailInput } from './breaking-mail';

const HOUR = 60 * 60 * 1000;

type Recipient = { email: string; userId: number; name: string | null };
type AlertRow = Omit<BreakingMailInput, 'articles'> & { articles: unknown };

/**
 * 속보 메일 보내기 (속보 뉴스레터 2단계). 1분마다(SchedulerService) 돈다:
 * - 보낼 시각이 된 '발송 예정'을 '메일 보냄'으로 바꾸고(먼저 바꿔 두 번 보내지 않게) 구독자에게 보낸다.
 *   받는 사람: 구독 중 · 속보 메일 켜짐. 밤(22시~7시)에는 '밤에도 바로 받기'를 켠 사람만, 나머지는 아침으로 미룬다(nightPending)
 * - 밤이 아니면 미뤄 둔 속보를 '밤에도 바로 받기'를 끈 사람에게 보낸다 (아침 7시 첫 회차. 서버가 그때 멈춰 있었어도 다음 회차에)
 * - 너무 늦었으면(staleHours · morningHours) 메일은 보내지 않는다 (홈 · 사이트에는 그대로 보인다)
 */
@Injectable()
export class BreakingSendService {
	private readonly logger = new Logger(BreakingSendService.name);
	/** 한 회차가 길어져도(구독자가 많음) 다음 회차와 겹치지 않게 */
	private running = false;

	constructor(
		private readonly prisma: MysqlPrismaService,
		private readonly mail: MailService,
	) {}

	async tick(now = new Date()) {
		if (this.running) return;
		this.running = true;
		try {
			await this.sendDue(now);
			if (!isNight(now)) await this.sendMorning(now);
		} catch (error) {
			this.logger.error(`속보 메일 회차 실패: ${errorMessage(error)}`);
		} finally {
			this.running = false;
		}
	}

	/** 보낼 시각이 된 속보: 지금 받을 사람에게 보낸다 */
	private async sendDue(now: Date) {
		const due = await this.prisma.breakingAlert.findMany({
			where: { status: 'scheduled', sendAt: { lte: now } },
			orderBy: { sendAt: 'asc' },
		});
		const night = isNight(now);
		for (const alert of due) {
			const stale = alert.sendAt!.getTime() < now.getTime() - BREAKING_LIMITS.staleHours * HOUR;
			// 먼저 '메일 보냄'으로 바꿔 둔다: 다른 회차 · 다른 서버가 같은 속보를 또 보내지 않게
			const { count } = await this.prisma.breakingAlert.updateMany({
				where: { id: alert.id, status: 'scheduled' },
				data: { status: 'sent', sentAt: now, nightPending: night && !stale },
			});
			if (!count) continue;
			if (stale) {
				this.logger.warn(
					`속보 ${alert.id}: 보낼 시각이 ${BREAKING_LIMITS.staleHours}시간 넘게 지나 메일은 보내지 않음`,
				);
				continue;
			}
			await this.send(alert, await this.recipients(night ? 'night' : 'all'), night ? '밤' : '바로');
		}
	}

	/** 밤에 나간 속보를 아침에: '밤에도 바로 받기'를 끈 사람에게 */
	private async sendMorning(now: Date) {
		const pending = await this.prisma.breakingAlert.findMany({
			where: { status: 'sent', nightPending: true },
			orderBy: { detectedAt: 'asc' },
		});
		for (const alert of pending) {
			const { count } = await this.prisma.breakingAlert.updateMany({
				where: { id: alert.id, nightPending: true },
				data: { nightPending: false },
			});
			if (!count) continue;
			if (alert.detectedAt.getTime() < now.getTime() - BREAKING_LIMITS.morningHours * HOUR) {
				this.logger.warn(
					`속보 ${alert.id}: 감지한 지 ${BREAKING_LIMITS.morningHours}시간이 넘어 아침 메일은 보내지 않음`,
				);
				continue;
			}
			await this.send(alert, await this.recipients('morning'), '아침');
		}
	}

	/** all 지금 다 · night 밤에도 받는 사람 · morning 밤에 미룬 사람 */
	private async recipients(who: 'all' | 'night' | 'morning'): Promise<Recipient[]> {
		const rows = await this.prisma.subscriber.findMany({
			where: {
				status: 'active',
				user: {
					breakingMail: true,
					...(who === 'night' && { breakingNight: true }),
					...(who === 'morning' && { breakingNight: false }),
				},
			},
			select: { userId: true, user: { select: { email: true, username: true } } },
		});
		return rows.map((row) => ({ email: row.user.email, userId: row.userId, name: row.user.username }));
	}

	private async send(alert: AlertRow, recipients: Recipient[], when: string) {
		if (!recipients.length) {
			this.logger.log(`속보 ${alert.id} (${when}): 받을 사람 없음`);
			return;
		}
		const input: BreakingMailInput = {
			id: alert.id,
			headline: alert.headline,
			reason: alert.reason,
			articles: Array.isArray(alert.articles) ? (alert.articles as BreakingArticle[]) : [],
			detectedAt: alert.detectedAt,
		};
		const result = await this.mail.sendBulkMail(
			recipients.map((r) => ({ ...r, interests: [] })),
			(r) => breakingMailFor(input, r.userId!),
		);
		await this.prisma.breakingAlert.update({
			where: { id: alert.id },
			data: { recipients: { increment: result.success } },
		});
		this.logger.warn(`속보 ${alert.id} 메일 (${when}): 성공 ${result.success} · 실패 ${result.failed}`);
	}
}

/**
 * 받는 사람 한 명의 속보 메일: '속보만 받지 않기'와 수신 거부를 로그인 없이 (토큰 용도가 달라 서로 바꿔 쓸 수 없다).
 * 메일 앱의 '구독 취소' 단추(List-Unsubscribe)는 속보만 끈다: 이 메일 목록은 속보이므로
 */
export function breakingMailFor(alert: BreakingMailInput, userId: number): BuiltMail {
	const base = env.frontendUrl.replace(/\/$/, '');
	const off = createUnsubscribeToken(userId, 'breaking-off');
	const { subject, html } = renderBreakingMail(alert, base, env.mailUser, {
		offUrl: `${base}/breaking/off?token=${off}`,
		unsubscribeUrl: `${base}/unsubscribe?token=${createUnsubscribeToken(userId)}`,
	});
	return {
		subject,
		html,
		// 매일 뉴스레터 발송 기록(email_archives)에는 남기지 않는다: 속보 기록은 breaking_alerts
		newsletterIds: [],
		headers: {
			'List-Unsubscribe': `<${base}/api/breaking/off?token=${off}>`,
			'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
		},
	};
}
