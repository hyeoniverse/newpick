import { Injectable, Logger } from '@nestjs/common';
import { MysqlPrismaService } from 'src/prisma/mysql.service';
import { AiSummaryService } from 'src/ai-summary/ai-summary.service';
import { CategoryRepository } from 'src/category/category.repository';
import { AppException } from 'src/common/errors/app.exception';
import { kstDayRange, kstStamp, toKstDate } from 'src/common/kst';
import { CrawlingRepository } from 'src/crawling/crawling.repository';
import { EditionService } from 'src/edition/edition.service';
import { FollowsService } from 'src/follows/follows.service';
import { StoryLinksService } from 'src/follows/story-links.service';
import { MailService } from 'src/mail/mail.service';
import { SiteCacheService } from 'src/site-cache/site-cache.service';
import { env } from 'src/config/env';
import { JobRunsService } from './job-runs.service';
import { backfillAt, BACKFILL_MAX_DAYS, summaryWindow } from './schedule';
import { ScheduleConfigService } from './schedule-config.service';
import { errorMessage } from 'src/common/error-message';

/** 요약에 실패한 관심사를 다시 시도하는 횟수 · 간격 (스트리밍으로 시간 초과는 줄었지만, 과부하 · 일시 오류 대비) */
const SUMMARY_RETRIES = 2;
const SUMMARY_RETRY_DELAY_MS = 60 * 1000;
/**
 * 그래도 실패한 관심사는 작업이 끝난 뒤 이 간격(분)으로 계속 다시 시도한다. 마지막 간격을 되풀이하며, 성공하거나 그날(KST)이 끝나면 멈춘다.
 * 작업 안에서 오래 기다리지 않는 것은 구독 메일이 요약이 끝나기를 기다리기 때문이다
 */
const AUTO_RETRY_MINUTES = [5, 10, 20, 30, 60];
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type Category = { id: number; name: string };

/** 작업이 끝난 뒤 실패한 관심사를 다시 시도할 계획 */
interface AutoRetry {
	/** 그 뉴스레터의 날 (KST). 지난 날짜 다시 만들기면 그날 */
	day: string;
	/** 지난 날짜 다시 만들기의 발행 시각 (오늘이면 없음) */
	at?: Date;
	categories: Category[];
	/** 몇 번째 자동 재시도인가 (1부터) */
	attempt: number;
	runAt: Date;
	timer: NodeJS.Timeout;
}

/**
 * AI 요약 작업: 분야마다 뉴스레터를 만들고(실패한 분야는 다시 시도), 그 뒤 편집 · 후속 판정 · 캐시 비우기 · 운영자 알림.
 * 한 번에 하나만 돈다 (메일 작업은 이것이 끝나기를 기다린다)
 */
@Injectable()
export class SummaryJobService {
	private isAiSummaryEnabled = true;
	/** 진행 중인 뉴스레터 생성. 메일 발송은 이것이 끝나기를 기다린다 (#55) */
	private summaryRun: Promise<void> | null = null;
	private readonly todayDoneListeners: (() => void)[] = [];
	/** 돌고 있는 실행이 오늘 전체 만들기인지 (지난 날짜 · 고른 분야 · 다시 쓰기가 아니면) */
	private summaryRunIsToday = false;
	/** 요약 다시 시도 간격. 테스트에서 0으로 바꾼다 */
	protected summaryRetryDelayMs = SUMMARY_RETRY_DELAY_MS;
	/** 작업이 끝난 뒤의 자동 재시도 (없으면 null) */
	private autoRetry: AutoRetry | null = null;

	private readonly logger = new Logger(SummaryJobService.name);

	constructor(
		private readonly mailService: MailService,
		private readonly aiSummaryService: AiSummaryService,
		private readonly crawlingRepository: CrawlingRepository,
		private readonly categoryRepository: CategoryRepository,
		private readonly prisma: MysqlPrismaService,
		private readonly editionService: EditionService,
		private readonly followsService: FollowsService,
		private readonly storyLinks: StoryLinksService,
		private readonly siteCache: SiteCacheService,
		private readonly scheduleConfig: ScheduleConfigService,
		private readonly jobRuns: JobRunsService,
	) {}

	get enabled() {
		return this.isAiSummaryEnabled;
	}

	/**
	 * AI 요약 (예약 시간은 setSchedule로). at을 주면 그날을 다시 만들고(지난 날짜),
	 * categoryId를 주면 그 분야만 (AI 기록에서 실패한 줄 다시 실행),
	 * replaceId를 주면 새로 만들지 않고 그 뉴스레터를 다시 쓴다 (관리자 '다시 쓰기', 그날 · 그 분야로)
	 */
	async makeAiSummary(at?: Date, categoryId?: number, replaceId?: number) {
		return this.start(at, categoryId ? [categoryId] : undefined, replaceId);
	}

	/** 그날 없는 관심사 중 고른 것만 만든다 (관리자 '빠진 날'에서 고른 항목) */
	async makeCategories(at: Date | undefined, categoryIds: number[]) {
		return this.start(at, categoryIds);
	}

	private start(at?: Date, categoryIds?: number[], replaceId?: number, auto = false): Promise<void> {
		const today = !at && !categoryIds && !replaceId;
		if (this.summaryRun) {
			// 오늘 전체 만들기(예약 · 따라잡기 · 지금 실행)가 지난 날짜 · 고른 분야 작업 뒤에 오면 버리지 않고 끝난 뒤에 돈다
			// (#341: 관리자가 빠진 날을 고치는 중에 예약 시각이 오면 그날 요약이 기록도 없이 사라졌다)
			if (today && !this.summaryRunIsToday)
				return this.summaryRun.then(() => this.start(at, categoryIds, replaceId, auto));
			return this.summaryRun;
		}
		this.summaryRunIsToday = today;
		this.summaryRun = this.runAiSummary(at, categoryIds, replaceId, auto).finally(() => {
			this.summaryRun = null;
		});
		return this.summaryRun;
	}

	/** 오늘(KST) 자동 재시도를 기다리는 분야 (#341: 메일은 이 분야를 고른 사람의 뉴스레터를 미룬다) */
	pendingCategories(now = new Date()): Category[] {
		return this.autoRetry?.day === toKstDate(now) ? [...this.autoRetry.categories] : [];
	}

	/** 오늘 만들기(예약 · 재시도 · 따라잡기 · 지금 실행)가 끝날 때마다 부를 것. 메일 작업이 미룬 사람에게 보내려고 쓴다 */
	onTodayDone(listener: () => void) {
		this.todayDoneListeners.push(listener);
	}

	/** 다음 자동 재시도 (대시보드). 없으면 null */
	getAutoRetry() {
		const retry = this.autoRetry;
		if (!retry) return null;
		return {
			at: retry.runAt.toISOString(),
			day: retry.day,
			categories: retry.categories.map((category) => category.name),
			attempt: retry.attempt,
		};
	}

	/** 자동 재시도를 그만둔다 (스케줄러를 끄면) */
	private cancelAutoRetry(reason: string) {
		if (!this.autoRetry) return;
		clearTimeout(this.autoRetry.timer);
		this.logger.log(`자동 재시도 그만둠 (${reason}): ${this.autoRetry.categories.map((c) => c.name).join(', ')}`);
		this.autoRetry = null;
	}

	/**
	 * 작업이 끝난 뒤 자동 재시도 계획을 고친다: 이번에 된(또는 건너뛴) 관심사는 빼고, 실패한 관심사는 더한다.
	 * 다음 시각이 오늘(KST)을 넘으면 그만둔다 (다음 날은 예약 실행이 새로 만든다)
	 */
	private planAutoRetry(day: string, at: Date | undefined, attempted: Category[], failed: Category[], auto: boolean) {
		const previous = this.autoRetry?.day === day ? this.autoRetry : null;
		if (this.autoRetry) clearTimeout(this.autoRetry.timer);
		this.autoRetry = null;

		const failedIds = new Set(failed.map((category) => category.id));
		const attemptedIds = new Set(attempted.map((category) => category.id));
		// 이번에 다루지 않은 관심사는 계속 기다리고, 이번에 실패한 관심사를 더한다
		const categories = [
			...(previous?.categories ?? []).filter((category) => !attemptedIds.has(category.id)),
			...failed,
		].filter((category, index, list) => list.findIndex((c) => c.id === category.id) === index);
		if (!categories.length) return;

		const attempt = auto && previous ? previous.attempt + 1 : (previous?.attempt ?? 1);
		const minutes = AUTO_RETRY_MINUTES[Math.min(attempt, AUTO_RETRY_MINUTES.length) - 1];
		const runAt = new Date(Date.now() + this.autoRetryDelayMs(minutes));
		if (toKstDate(runAt) !== toKstDate(new Date())) {
			this.logger.error(
				`자동 재시도 그만둠 (오늘이 끝남): ${categories.map((c) => c.name).join(', ')} · ${attempt - 1}번 시도`,
			);
			return;
		}
		this.logger.warn(
			`자동 재시도 ${attempt}번째 예정 ${kstStamp(runAt)}: ${categories.map((c) => c.name).join(', ')}` +
				(failedIds.size ? '' : ' (이전 실패분)'),
		);
		const timer = setTimeout(() => this.fireAutoRetry(), runAt.getTime() - Date.now());
		// 기다리는 재시도 때문에 프로세스(테스트 · 종료)가 붙잡히지 않게
		timer.unref?.();
		this.autoRetry = { day, at, categories, attempt, runAt, timer };
	}

	/** 자동 재시도 시각: 다른 요약이 도는 중이면 5분 뒤로 미룬다 */
	private fireAutoRetry() {
		const retry = this.autoRetry;
		if (!retry) return;
		if (this.summaryRun) {
			const runAt = new Date(Date.now() + this.autoRetryDelayMs(5));
			retry.runAt = runAt;
			retry.timer = setTimeout(() => this.fireAutoRetry(), runAt.getTime() - Date.now());
			retry.timer.unref?.();
			return;
		}
		this.jobRuns.markTrigger('summary', 'retry');
		void this.start(
			retry.at,
			retry.categories.map((category) => category.id),
			undefined,
			true,
		);
	}

	/** 자동 재시도 간격(분) → ms. 테스트에서 줄인다 */
	protected autoRetryDelayMs(minutes: number) {
		return minutes * 60 * 1000;
	}

	private async runAiSummary(at?: Date, categoryIds?: number[], replaceId?: number, auto = false) {
		// 지난 날짜 다시 만들기: 그날 기사로 그날 발행. 이미 있는 분야는 건너뛰고, 메일 편집 · 후속 판정 · 알림 메일은 하지 않는다
		const backfill = at ? toKstDate(at) : null;
		this.logger.debug(backfill ? `AI 요약 시작 (${backfill} 다시 만들기)` : 'AI 요약 시작');

		if (!this.isAiSummaryEnabled) {
			this.logger.log('ai 요약 스케줄러가 비활성화되었습니다.');
			this.cancelAutoRetry('스케줄러 꺼짐');
			this.jobRuns.finishRun('summary', 'skipped', '스케줄러가 꺼져 있어 건너뜀');
			return;
		}
		this.jobRuns.startRun('summary');

		try {
			const categoryList = (await this.categoryRepository.findAll()).filter(
				(category) => !categoryIds || categoryIds.includes(category.id),
			);
			const generatedNewsletter: { content: string }[] = [];
			// 그날의 뉴스만: 어제 수집 시각부터 지금까지 처음 모은 기사 (예전엔 지난 7일 전부라 지난 소식이 다시 실렸다)
			const {
				start: startDate,
				end: endDate,
				morningSince,
			} = summaryWindow(this.scheduleConfig.getSchedule().crawl, at);
			// 그날 이미 뉴스레터가 있는 분야는 건너뛴다: 일부만 실패해 다시 실행하면 된 분야까지 또 만들어 같은 날 두 편이 됐다
			const day = backfill ?? toKstDate(new Date());
			const { start: dayStart, end: dayEnd } = kstDayRange(day, day);
			const done = new Set(
				(
					await this.prisma.newsletter.findMany({
						where: { createdAt: { gte: dayStart, lte: dayEnd } },
						select: { categoryId: true },
					})
				).map((row) => row.categoryId),
			);

			// 관심사 하나 요약: 만들었으면 true, 요약할 뉴스가 없으면 null, 실패하면 오류를 던진다
			const summarize = async (category: { id: number; name: string }) => {
				// 다시 쓰기는 이미 있는 그 뉴스레터를 바꾸는 것이라 건너뛰지 않는다
				if (!replaceId && done.has(category.id)) {
					this.logger.log(`카테고리 ${category.name}: ${day}에 이미 있어 건너뜀`);
					return null;
				}
				const news = await this.crawlingRepository.getCrawledNewsBetween(startDate, endDate, category.id);
				if (news.length === 0) {
					this.logger.warn(`카테고리 ${category.name}: 요약할 뉴스 없음`);
					return null;
				}
				const newsletter = await this.aiSummaryService.summarizeText(
					news,
					category.id,
					false,
					morningSince,
					at,
					replaceId,
				);
				// 만든 뉴스레터 한 편 (예전엔 배열로 보고 길이를 봐서 늘 0편이었다: 캐시 새로 고침 · 후속 판정 · 알림도 건너뜀)
				// 예약 작업은 test 없이 부르므로 늘 저장한 뉴스레터다 (content가 있다)
				if (newsletter.newsletter && 'content' in newsletter.newsletter)
					generatedNewsletter.push(newsletter.newsletter);
				this.logger.log(`카테고리 ${category.name}: 뉴스 ${news.length}건 요약`);
				return true;
			};

			// 카테고리 하나가 실패해도 나머지 카테고리는 계속 요약합니다.
			let failed: { id: number; name: string }[] = [];
			for (const category of categoryList) {
				try {
					await summarize(category);
				} catch (error) {
					failed.push(category);
					this.logger.error(`카테고리 ${category.name} 요약 실패: ${errorMessage(error)}`);
				}
			}

			// 실패한 관심사는 나머지를 다 만든 뒤 잠시 쉬었다가 다시 시도한다 (일시적인 시간 초과 · 과부하 대비)
			let retried = 0;
			for (let round = 1; round <= SUMMARY_RETRIES && failed.length; round++) {
				await sleep(this.summaryRetryDelayMs);
				this.logger.warn(`요약 다시 시도 ${round}/${SUMMARY_RETRIES}: ${failed.map((c) => c.name).join(', ')}`);
				const still: typeof failed = [];
				for (const category of failed) {
					try {
						if (await summarize(category)) retried++;
					} catch (error) {
						still.push(category);
						this.logger.error(`카테고리 ${category.name} 다시 시도 실패: ${errorMessage(error)}`);
					}
				}
				failed = still;
			}
			const failedCategories = failed.map((c) => c.name);
			if (failedCategories.length) {
				this.logger.error(`요약 실패 카테고리: ${failedCategories.join(', ')}`);
			}
			// 그래도 실패한 관심사는 작업이 끝난 뒤 계속 다시 시도한다 (다시 쓰기는 관리자가 다시 누른다)
			if (!replaceId) this.planAutoRetry(day, at, categoryList, failed, auto);
			const scope = [
				replaceId && `#${replaceId}`,
				backfill,
				categoryIds && categoryList.map((category) => category.name).join(' · '),
			]
				.filter(Boolean)
				.join(' ');
			const skipped = replaceId ? 0 : categoryList.filter((c) => done.has(c.id)).length;
			const made = replaceId
				? `${scope} 다시 쓰기: ${generatedNewsletter.length ? '바꿈' : '바꾸지 못함'}`
				: `${scope ? `${scope} 다시 만들기: ` : ''}뉴스레터 ${generatedNewsletter.length}편 생성` +
					(skipped ? ` · 이미 있어 건너뜀 ${skipped}` : '');
			const again = retried ? ` · 다시 시도로 ${retried}편` : '';
			const next = this.autoRetry ? ` · ${kstStamp(this.autoRetry.runAt).slice(11, 16)}에 자동 재시도` : '';
			const failedText = failedCategories.length ? ` · 실패: ${failedCategories.join(', ')}${next}` : '';
			// 오늘 것을 하나도 만들지 못했고 이미 있던 것도 없으면(요약할 뉴스가 없음 · 수집이 멈춤) 실패로 (#341: '0편 생성 · 성공'이었다)
			const nothing = !replaceId && !backfill && generatedNewsletter.length === 0 && skipped === 0;
			this.jobRuns.finishRun(
				'summary',
				failedCategories.length === 0 && !nothing ? 'success' : generatedNewsletter.length > 0 ? 'partial' : 'failed',
				made + (nothing && !failedCategories.length ? ' · 요약할 뉴스 없음' : '') + again + failedText,
			);

			// 새 글이 생겼으면 사이트 첫 화면·목록이 10분 기다리지 않고 바로 보여 주게 (#73)
			if (backfill) {
				if (generatedNewsletter.length > 0) {
					await this.siteCache.refresh('지난 날짜 뉴스레터 생성');
				}
				return;
			}

			// 오늘 나온 전 분야 소식을 한 번 편집해 둔다 (구독 메일·미리보기에 씀)
			await this.editionService.ensureEdition();
			// 재시도 계획 · 편집본이 정해진 뒤에 알린다 (기다리지 않는다: 메일은 이 실행이 끝나기를 기다린다)
			for (const listener of this.todayDoneListeners) listener();

			if (generatedNewsletter.length > 0) {
				// 이어지는 이야기: 오늘 소식을 지난 며칠 같은 사건 소식과 잇는다 (홈 '이어지는 이야기'). 오늘 소식 임베딩도 여기서 계산해 둔다
				await this.storyLinks.link().catch((error) => this.logger.warn(`이어지는 이야기 판정 실패: ${error.message}`));
				// 후속 지켜보기: 오늘 소식이 누군가 지켜보는 소식의 후속인지 판정 (실패해도 요약은 끝난 것)
				await this.followsService
					.detect()
					.catch((error) => this.logger.warn(`후속 지켜보기 판정 실패: ${error.message}`));
			}

			// 새 글이 생겼으면 사이트 첫 화면·목록이 10분 기다리지 않고 바로 보여 주게 (#73)
			if (generatedNewsletter.length > 0) {
				await this.siteCache.refresh('뉴스레터 생성');
			}

			// 운영자 알림 메일은 ADMIN_NOTIFY_EMAIL이 설정된 경우에만 보냅니다.
			const adminEmail = env.adminNotifyEmail;
			if (adminEmail && generatedNewsletter.length > 0) {
				await this.mailService.sendHtmlMail(
					adminEmail,
					'',
					generatedNewsletter.map((n) => n.content).join('\n\n'),
					`${generatedNewsletter.length}개의 뉴스레터가 생성되었습니다`,
				);
				this.logger.log(`생성 뉴스 수 : ${generatedNewsletter.length}`);
				this.logger.log('메일 발송 완료');
			}
		} catch (error) {
			this.logger.error(`AI 요약 실패: ${errorMessage(error)}`);
			// 자동 재시도 자체가 통째로 실패했으면(DB 오류 등) 같은 관심사로 다음 간격에 다시
			if (auto && this.autoRetry) {
				const { day, at: retryAt, categories } = this.autoRetry;
				this.planAutoRetry(day, retryAt, [], categories, true);
			}
			// 뉴스레터는 이미 만들어졌고 뒤의 편집 · 캐시 · 알림에서 실패했을 수도 있어 실패로 덮어쓴다
			this.jobRuns.finishRun('summary', 'failed', errorMessage(error));
		}
	}

	toggleAiSummaryScheduler(enable: boolean) {
		this.isAiSummaryEnabled = enable;
		if (!enable) this.cancelAutoRetry('스케줄러 꺼짐');
		this.logger.debug(this.isAiSummaryEnabled ? '활성화' : '비활성화');
	}

	/**
	 * 다시 만들 날(YYYY-MM-DD)의 발행 시각. 오늘이면 undefined(평소처럼 지금 실행),
	 * 지난 날짜면 그날 요약 시각. 앞날 · 기사가 지워진 날은 여기서 바로 거절 (요청에 400)
	 */
	backfillMoment(date: string) {
		if (date === toKstDate(new Date())) return undefined;
		return backfillAt(date, this.scheduleConfig.getSchedule().summary);
	}

	/** AI 요약이 도는 중인가 (예약 · 지금 실행 · 다시 만들기 모두) */
	isSummaryRunning() {
		return this.summaryRun !== null;
	}

	/**
	 * 다시 쓸 뉴스레터의 그날 · 분야. 모은 기사가 지워진(BACKFILL_MAX_DAYS일 넘은) 뉴스레터는 다시 쓸 재료가 없어 거절
	 */
	async regenerateTarget(newsletterId: number, day?: string) {
		const newsletter = await this.prisma.newsletter.findUnique({
			where: { id: newsletterId },
			select: { createdAt: true, categoryId: true },
		});
		if (!newsletter) throw new AppException('NEWSLETTER_NOT_FOUND');
		// 날짜 하나 고쳐 채우기에서는 그날 뉴스레터만
		if (day && toKstDate(newsletter.createdAt) !== day) {
			throw new AppException('BAD_REQUEST', `#${newsletterId} 뉴스레터는 ${day}에 발행된 것이 아닙니다.`);
		}
		const oldest = Date.now() - BACKFILL_MAX_DAYS * 24 * 60 * 60 * 1000;
		if (newsletter.createdAt.getTime() < oldest) {
			throw new AppException(
				'BAD_REQUEST',
				`수집한 기사는 ${BACKFILL_MAX_DAYS}일 동안만 보관하므로 그보다 오래된 뉴스레터는 다시 작성할 수 없습니다.`,
			);
		}
		// 그 뉴스레터를 만든 시각까지 모은 기사로 (그때와 같은 재료)
		return { at: newsletter.createdAt, categoryId: newsletter.categoryId };
	}

	/** 진행 중인 요약이 있으면 끝나기를 기다린다 (메일 작업이 부른다) */
	async waitUntilDone() {
		if (this.summaryRun) {
			this.logger.log('뉴스레터 생성이 끝나기를 기다립니다.');
			await this.summaryRun;
		}
	}
}
