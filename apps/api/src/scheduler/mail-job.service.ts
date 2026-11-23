import { Injectable, Logger } from '@nestjs/common';
import { MysqlPrismaService } from 'src/prisma/mysql.service';
import { storyRef } from 'src/edition/editor';
import { EditionService } from 'src/edition/edition.service';
import { planMail, tagStories } from 'src/edition/personalize';
import type { MailPlan } from 'src/edition/mail-plan';
import { TAG_LIMITS } from 'src/tags/tags';
import { FollowsService } from 'src/follows/follows.service';
import { MailService } from 'src/mail/mail.service';
import { RecommendService } from 'src/recommend/recommend.service';
import { SubscriberService } from 'src/subscriber/subscriber.service';
import { TasteService } from 'src/taste/taste.service';
import { JobRunsService } from './job-runs.service';
import { SUMMARY_WINDOW_HOURS } from './schedule';
import { SummaryJobService } from './summary-job.service';
import { errorMessage } from 'src/common/error-message';
import { kstDayRange } from 'src/common/kst';

/** 오늘 편집한 소식 (없는 날은 메일을 보내지 않으므로 여기서는 늘 있다) */
type Edition = NonNullable<Awaited<ReturnType<EditionService['ensureEdition']>>>;
type Subscriber = Awaited<ReturnType<SubscriberService['getSubscribers']>>[number];

/** 구독 메일 작업 (#55): 구독자마다 고른 분야 · 맞춤 · 추천 기사 · 후속 · 팔로우한 태그로 오늘 소식 한 통 */
@Injectable()
export class MailJobService {
	private isMailSendEnabled = true;
	/** 보내는 중인 실행. 겹쳐 돌지 않게 한다 (#341: 예약 발송 중 '지금 실행' · 두 번 누름이 그대로 두 번 보냈다) */
	private sending: Promise<void> | null = null;

	private readonly logger = new Logger(MailJobService.name);

	constructor(
		private readonly mailService: MailService,
		private readonly subscriberService: SubscriberService,
		private readonly prisma: MysqlPrismaService,
		private readonly editionService: EditionService,
		private readonly followsService: FollowsService,
		private readonly tasteService: TasteService,
		private readonly recommendService: RecommendService,
		private readonly summaryJob: SummaryJobService,
		private readonly jobRuns: JobRunsService,
	) {}

	get enabled() {
		return this.isMailSendEnabled;
	}

	get isSending() {
		return this.sending !== null;
	}

	/**
	 * 구독 메일 발송 (기본: 매일 08:40 KST). cron 등록은 onApplicationBootstrap에서 합니다.
	 * 구독자마다 고른 분야로 오늘 소식을 엮은 한 통을 보냅니다 (#55)
	 */
	async sendEmailSummary() {
		if (this.sending) {
			// 앞 실행의 기록을 덮어쓰지 않게 새 실행 기록도 만들지 않는다
			this.logger.warn('이미 메일을 보내는 중이라 이번 실행은 건너뜁니다.');
			return;
		}
		this.sending = this.runSend().finally(() => {
			this.sending = null;
		});
		return this.sending;
	}

	private async runSend() {
		if (!this.isMailSendEnabled) {
			this.logger.log('메일 발송 스케줄러가 비활성화되었습니다.');
			this.jobRuns.finishRun('mail', 'skipped', '스케줄러가 꺼져 있어 건너뜀');
			return;
		}
		this.jobRuns.startRun('mail');
		try {
			await this.sendEditionToSubscribers();
		} catch (error) {
			this.jobRuns.finishRun('mail', 'failed', errorMessage(error));
			throw error;
		}
	}

	private async sendEditionToSubscribers() {
		// 생성이 늦어지면 끝난 뒤에 보낸다 (빠진 분야 없이)
		await this.summaryJob.waitUntilDone();

		const subscribers = await this.subscriberService.getSubscribers();
		this.logger.debug(`구독자 수: ${subscribers.length}`);

		// cron 안에서 예외를 던지면 받는 곳이 없으므로 로그만 남깁니다.
		if (subscribers.length === 0) {
			this.logger.warn('구독자가 없습니다.');
			this.jobRuns.finishRun('mail', 'skipped', '구독자 없음');
			return;
		}

		// 관심사가 설정된 구독자만 필터링
		const validSubscribers = subscribers.filter(
			(subscriber) => subscriber.interests && subscriber.interests.length > 0,
		);

		if (validSubscribers.length === 0) {
			this.logger.warn('관심사가 설정된 구독자가 없습니다.');
			this.jobRuns.finishRun('mail', 'skipped', '관심사를 고른 구독자 없음');
			return;
		}

		// 오늘 나온 뉴스레터가 없으면 보내지 않는다 (어제 메일을 다시 보내지 않게)
		const edition = await this.editionService.ensureEdition();
		if (!edition) {
			this.logger.warn('오늘 나온 뉴스레터가 없어 메일을 보내지 않습니다.');
			this.jobRuns.finishRun('mail', 'skipped', '오늘 나온 뉴스레터 없음');
			return;
		}

		// 오늘(KST) 이미 받은 주소는 뺀다 (#341): 발송 도중 재시작된 뒤 다시 돌리거나 '지금 실행'을 눌러도 한 사람이 같은 날 두 통을 받지 않게
		const alreadySent = await this.sentToday(validSubscribers.map((subscriber) => subscriber.email));
		const recipients = validSubscribers.filter((subscriber) => !alreadySent.has(subscriber.email));
		if (recipients.length === 0) {
			this.logger.log('오늘 메일을 모두 이미 받았습니다.');
			this.jobRuns.finishRun('mail', 'skipped', `오늘 이미 받음 ${alreadySent.size}`);
			return;
		}

		// 사람마다 붙일 칸: 맞춤 순서 · 추천 기사 · 지켜보던 소식의 후속 · 팔로우한 태그
		const plans = await this.buildPlans(edition, recipients);

		const result = await this.mailService.sendBulkMail(
			recipients.map((subscriber) => ({
				email: subscriber.email,
				interests: subscriber.interests,
				name: subscriber.name,
				userId: subscriber.userId,
			})),
			// 사람마다 원클릭 해지(#18)를 붙여 만든다
			(subscriber) =>
				this.editionService.composeMail(
					edition,
					subscriber.interests,
					subscriber.userId,
					subscriber.userId !== undefined ? plans.get(subscriber.userId) : null,
				),
		);

		const already = alreadySent.size ? ` · 오늘 이미 받음 ${alreadySent.size}` : '';
		this.logger.log(
			`발송 결과 ${result.success}건 성공, ${result.failed}건 실패, ${result.skipped}건 해당 없음${already}`,
		);
		this.jobRuns.finishRun(
			'mail',
			result.failed === 0 ? 'success' : result.success > 0 ? 'partial' : 'failed',
			`성공 ${result.success} · 실패 ${result.failed} · 해당 없음 ${result.skipped}${already}`,
		);
	}

	/** 오늘(KST) 받은 메일 기록이 있는 주소. 기록은 보낸 직후에 남는다 (MailService.archive) */
	private async sentToday(emails: string[]): Promise<Set<string>> {
		const { start, end } = kstDayRange(new Date(), new Date());
		const rows = await this.prisma.emailArchive.findMany({
			where: { email: { in: emails }, sentAt: { gte: start, lte: end } },
			select: { email: true },
			distinct: ['email'],
		});
		return new Set(rows.map((row) => row.email));
	}

	/**
	 * 사람마다 메일에 붙일 칸 (userId → 계획). 모두 실패하면 그 칸 없이 분야별 메일로 보낸다
	 * - 맞춤 순서 · 맞춤 글 (#123 3단계, 맞춤을 켠 사람만)
	 * - 추천 기사 · 지켜보던 소식의 후속 · 팔로우한 태그 (직접 고른 것은 맞춤을 꺼도 싣는다)
	 */
	private async buildPlans(edition: Edition, validSubscribers: Subscriber[]) {
		// 맞춤 메일 (#123 3단계): 구독자 모두의 취향을 한 번에 계산 (AI 호출 없음). 실패하면 맞춤 없이 그대로 보낸다.
		// 맞춤을 끈 사람(#123 16)은 빼서 분야별 메일을 받게 한다
		const personalIds = await this.personalMailUsers(
			validSubscribers.map((s) => s.userId).filter((id): id is number => typeof id === 'number'),
		);
		const profiles = await this.tasteService.profiles(personalIds).catch((error) => {
			this.logger.warn(`맞춤 취향 계산 실패, 맞춤 없이 보냄: ${error.message}`);
			return new Map();
		});

		// 관심 점수는 뜻으로 (북마크 · 스크랩과 오늘 소식의 임베딩). 실패하면 관심 태그로만
		const texts = await this.tasteService.signalTexts([...profiles.keys()]).catch(() => new Map());
		const vectors = await this.editionService.embedForPlans(edition, profiles, texts);

		// 사람마다: 분야를 나누지 않고 점수 높은 소식을 고르고(계산), 오픈 모델로 제목 · 맞춤 브리핑을 쓴다.
		// 글쓰기는 3명씩 동시에. 못 쓰면 그 사람은 맞춤 순서만 있는 메일
		const plans = new Map<number, MailPlan | null>();
		const planned = validSubscribers.filter((s) => typeof s.userId === 'number' && profiles.has(s.userId));
		for (let i = 0; i < planned.length; i += 3) {
			await Promise.all(
				planned.slice(i, i + 3).map(async (subscriber) => {
					const profile = profiles.get(subscriber.userId!)!;
					const plan = planMail(edition.sources, subscriber.interests, profile, vectors, edition.editorial);
					if (plan) plan.note = await this.editionService.writeNote(edition, subscriber.interests, plan, profile);
					plans.set(subscriber.userId!, plan);
				}),
			);
		}
		if (planned.length) {
			const notes = [...plans.values()].filter((p) => p?.note).length;
			this.logger.log(`맞춤 메일 ${plans.size}명 (사람마다 쓴 글 ${notes}명)`);
		}

		// 추천 기사: 맞춤 계획에 쓴 신호 임베딩 그대로, 그날 뉴스레터 재료와 같은 창에서 뉴스레터에 안 쓴 기사.
		// 맞춤으로 고른 소식이 없는 사람도 추천 기사만 붙는다 (분야별 메일 + 추천 기사)
		const now = new Date();
		const recommended = await this.recommendService.forUsers(
			planned.map((s) => {
				// 그 사람 메일에 실린 소식: 맞춤이면 고른 소식, 아니면 구독 분야 소식 전부
				const refs =
					plans.get(s.userId!)?.picks.map((p) => p.ref) ??
					edition.sources
						.filter((source) => s.interests.includes(source.categoryId))
						.flatMap((source) => source.stories.map((_, i) => storyRef(source.newsletterId, i)));
				return {
					userId: s.userId!,
					signals: profiles.get(s.userId!)?.signals ?? [],
					shown: refs.map((ref) => vectors.get(ref)).filter((v): v is number[] => !!v),
				};
			}),
			{
				start: new Date(now.getTime() - SUMMARY_WINDOW_HOURS * 60 * 60 * 1000),
				end: now,
			},
			edition.sources.map((s) => s.newsletterId),
		);
		for (const [userId, articles] of recommended)
			plans.set(userId, { ...(plans.get(userId) ?? { picks: [] }), articles });

		// 지켜보던 소식의 후속 (메일 맨 위): 직접 고른 지켜보기라 맞춤을 꺼도 싣는다. 지난 메일 이후(24시간)에 생긴 것.
		// 읽기에 실패하면 후속 칸 없이 보낸다
		const followUps = await this.followsService
			.forMail(
				validSubscribers.map((s) => s.userId).filter((id): id is number => typeof id === 'number'),
				new Date(Date.now() - SUMMARY_WINDOW_HOURS * 60 * 60 * 1000),
			)
			.catch((error) => {
				this.logger.warn(`후속 읽기 실패, 후속 칸 없이 보냄: ${error.message}`);
				return new Map();
			});
		for (const [userId, follows] of followUps) plans.set(userId, { ...(plans.get(userId) ?? { picks: [] }), follows });
		// 팔로우한 태그 칸 (#123 5단계): 직접 고른 것이라 맞춤을 꺼도 싣는다. 태그마다 그날 소식 · 뉴스레터에 안 실린 기사.
		// 맞춤 순서(오늘을 한눈에)에는 섞지 않는다. 읽기에 실패하면 이 칸 없이
		const accountIds = validSubscribers.map((s) => s.userId).filter((id): id is number => typeof id === 'number');
		const followedTags = await this.tasteService
			.tagFollows(accountIds)
			.catch(() => new Map<number, { name: string; key: string }[]>());
		const tagArticleMap = await this.recommendService.forTags(
			[...followedTags].map(([userId, tags]) => ({ userId, tags })),
			{
				start: new Date(now.getTime() - SUMMARY_WINDOW_HOURS * 60 * 60 * 1000),
				end: now,
			},
			edition.sources.map((s) => s.newsletterId),
		);
		for (const [userId, tags] of followedTags) {
			const stories = tagStories(edition.sources, tags);
			const articles = tagArticleMap.get(userId);
			const news = tags
				.map((t) => ({
					tag: t.name,
					stories: stories.get(t.name) ?? [],
					articles: articles?.get(t.name) ?? [],
				}))
				.filter((t) => t.stories.length || t.articles.length)
				.slice(0, TAG_LIMITS.tags);
			if (news.length)
				plans.set(userId, {
					...(plans.get(userId) ?? { picks: [] }),
					tags: news,
				});
		}
		return plans;
	}

	toggleMailSendScheduler(enable: boolean) {
		this.isMailSendEnabled = enable;
		this.logger.debug(this.isMailSendEnabled ? '활성화' : '비활성화');
	}

	/** 맞춤 메일을 켜 둔 사용자만 (기본은 켜짐). 읽기에 실패하면 아무도 맞춤으로 보내지 않는다 */
	private async personalMailUsers(userIds: number[]) {
		if (!userIds.length) return [];
		const rows = await this.prisma.user
			.findMany({
				where: { id: { in: userIds }, personalMail: true },
				select: { id: true },
			})
			.catch((error) => {
				this.logger.warn(`맞춤 설정 읽기 실패, 맞춤 없이 보냄: ${error.message}`);
				return [];
			});
		return rows.map((r) => r.id);
	}
}
