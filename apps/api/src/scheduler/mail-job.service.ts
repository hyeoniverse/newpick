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

/** 오늘 편집한 소식 (없는 날은 메일을 보내지 않으므로 여기서는 늘 있다) */
type Edition = NonNullable<Awaited<ReturnType<EditionService['ensureEdition']>>>;
type Subscriber = Awaited<ReturnType<SubscriberService['getSubscribers']>>[number];

/** 구독 메일 작업 (#55): 구독자마다 고른 분야 · 맞춤 · 추천 기사 · 후속 · 팔로우한 태그로 오늘 소식 한 통 */
@Injectable()
export class MailJobService {
	private isMailSendEnabled = true;

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

	/**
	 * 구독 메일 발송 (기본: 매일 08:40 KST). cron 등록은 onApplicationBootstrap에서 합니다.
	 * 구독자마다 고른 분야로 오늘 소식을 엮은 한 통을 보냅니다 (#55)
	 */
	async sendEmailSummary() {
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

		// 사람마다 붙일 칸: 맞춤 순서 · 추천 기사 · 지켜보던 소식의 후속 · 팔로우한 태그
		const plans = await this.buildPlans(edition, validSubscribers);

		const result = await this.mailService.sendBulkMail(
			validSubscribers.map((subscriber) => ({
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

		this.logger.log(`발송 결과 ${result.success}건 성공, ${result.failed}건 실패, ${result.skipped}건 해당 없음`);
		this.jobRuns.finishRun(
			'mail',
			result.failed === 0 ? 'success' : result.success > 0 ? 'partial' : 'failed',
			`성공 ${result.success} · 실패 ${result.failed} · 해당 없음 ${result.skipped}`,
		);
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
