import Link from 'next/link';
import type {
	HomeContinuing,
	HomeMostRead,
	HomeMostScrapped,
	HomeRisingTag,
	HomeStory,
	HomeThread,
	HomeTopic,
} from '@newpick/shared';
import { ROUTES } from '@/constants/routes';
import Image from '@/components/common/Image';
import FullWidthPanel from '@/components/common/FullWidthPanel';
import { HOME } from '@/copy';
import { cx } from '@/styles/tw';
import { SECTION, SectionHeader } from './SectionHeader';

const COPY = HOME.today;

/**
 * 홈 '오늘' 칸들 (GET /edition/today, 서버에서 받아 그린다). 이미 만든 편집본 · 조회 · 스크랩 · 태그를 모은 것이라 AI 호출이 없다.
 * 칸마다 모양을 다르게 한다 (같은 제목 · 같은 카드 줄이 이어지면 단조롭다):
 * 핵심 3줄은 세 줄 목록 띠, 최신 트렌드는 주제 카드, 흐름은 분야를 잇는 세로 줄, 이어지는 이야기는 날짜를 잇는 가로 줄, 많이 보는 것은 세 칸 순위.
 * 데이터가 비면 그 칸은 그리지 않는다
 */

const storyKey = (s: { newsletterId: number; storyIndex: number }) => `${s.newsletterId}-${s.storyIndex}`;

/** 2026-11-23 → 11월 23일 */
const monthDay = (date: string) => {
	const [, month, day] = date.split('-').map(Number);
	return month && day ? `${month}월 ${day}일` : date;
};

/**
 * 핵심 3줄: 그날 모든 분야 소식 가운데 중요도 상위 3개를 말 그대로 세 줄로 (번호 · 분야 · 제목 · 한 줄 요약).
 * 사진 · 큰 글자를 넣었을 때는 칸이 비대해져 '한눈에'가 되지 않았다. 띠는 화면 끝까지, 바탕은 어두운 색 (다른 칸과 구분)
 */
export function KeyLinesSection({ date, stories }: { date: string; stories: HomeStory[] }) {
	if (!stories.length) return null;
	return (
		// 어두운 띠: 안쪽은 다크 테마 색으로 (라이트 테마의 진한 보라는 어두운 바탕에 묻힌다). 사용자 정의 속성은 DOM을 따라 물려받아 contents여도 된다
		<div data-theme="dark" className="contents">
			<FullWidthPanel background="surface" color="text" className="my-4 border-x-0 py-10 mobile:py-8">
				<div className={cx(SECTION, 'max-w-[1024px] gap-4 py-0')} data-track-section="home-today-lines">
					<SectionHeader eyebrow={COPY.eyebrow.lines} title={COPY.lines} note={COPY.basis(monthDay(date))} />
					<ol className="m-0 flex list-none flex-col p-0">
						{stories.map((story, i) => (
							<li key={storyKey(story)} className="border-b border-light-grey last:border-b-0">
								<Link
									href={ROUTES.article(story.newsletterId)}
									className="group grid grid-cols-[2.5rem_4rem_1fr] items-baseline gap-x-3 py-3 text-inherit no-underline mobile:grid-cols-[2rem_1fr]"
								>
									<span className="text-[1.25rem] leading-none font-bold text-primary" aria-hidden>
										{String(i + 1).padStart(2, '0')}
									</span>
									<span className="text-small font-semi-bold text-primary mobile:hidden">{story.category}</span>
									<span className="flex min-w-0 flex-col gap-0.5">
										<strong className="leading-snug font-bold group-hover:underline">
											<span className="mr-2 hidden text-small font-semi-bold text-primary mobile:inline">
												{story.category}
											</span>
											{story.heading}
										</strong>
										{story.line && (
											<span className="line-clamp-1 text-small text-sub-text mobile:line-clamp-2">{story.line}</span>
										)}
									</span>
								</Link>
							</li>
						))}
					</ol>
				</div>
			</FullWidthPanel>
		</div>
	);
}

/** 뜬 정도: 그 전 4주에 없던 태그면 NEW, 아니면 평소보다 더 나온 횟수 (몇 배로 보이면 평소가 0.1번인 태그도 10배로 부풀었다) */
const riseLabel = (tag: HomeRisingTag) =>
	tag.usual === 0 ? COPY.risingNew : COPY.risingMore(Math.max(1, Math.round(tag.recent - tag.usual)));

/** 주제 머리: #태그 · 뜬 정도 · 그 주제 소식 수 (누르면 그 태그로 검색) */
function TopicLabel({ topic }: { topic: HomeTopic }) {
	return (
		<span className="flex flex-wrap items-baseline gap-x-2 text-small">
			<span className="font-bold text-primary">#{topic.tag}</span>
			<span className="text-[0.75rem] font-semi-bold text-primary">{riseLabel(topic)}</span>
			<span className="text-sub-text">{COPY.topicCount(topic.stories.length)}</span>
		</span>
	);
}

/**
 * 최신 트렌드(주제별): 지금 뜨는 주제마다 그 주제를 다룬 최근 3일 소식 가운데 가장 새것 (분야 · 날짜를 가리지 않는다).
 * 예전에는 최근 발행분 소식을 중요도 · 조회로 줄 세운 것이라 아래 최신 뉴스레터와 같은 소식을 한 번 더 보여 줬다.
 * 모양은 잡지형: 첫 주제는 큰 사진으로, 나머지는 옆에 작은 사진 목록
 */
/** 최신 트렌드 소식의 분야 · 날짜 (최근 3일 가운데 어느 날 소식인지) */
function StoryMeta({ story }: { story: HomeTopic['stories'][number] }) {
	return (
		<span className="text-small text-sub-text">
			{story.category} · {monthDay(story.date)}
		</span>
	);
}

export function TopicTrendSection({ topics }: { topics: HomeTopic[] }) {
	const [lead, ...rest] = topics;
	if (!lead) return null;
	const leadStory = lead.stories[0];
	return (
		<section className={SECTION} data-track-section="home-today-trend">
			<SectionHeader eyebrow={COPY.eyebrow.trend} title={COPY.trend} note={COPY.trendNote} />
			<div className="grid w-full grid-cols-[1.35fr_1fr] gap-8 tablet:grid-cols-1 tablet:gap-6">
				<div className="flex flex-col gap-3">
					<Link
						href={ROUTES.article(leadStory.newsletterId)}
						className="group flex flex-col gap-3 text-inherit no-underline"
					>
						{leadStory.image && (
							<Image
								src={leadStory.image}
								alt={leadStory.heading}
								ratio="wide"
								sizes="(max-width: 1023px) 100vw, 580px"
								className="w-full"
							/>
						)}
						<TopicLabel topic={lead} />
						<strong className="text-[1.5rem] leading-snug font-bold group-hover:underline mobile:text-[1.25rem]">
							{leadStory.heading}
						</strong>
						{leadStory.line && <span className="leading-relaxed text-sub-text">{leadStory.line}</span>}
						<StoryMeta story={leadStory} />
					</Link>
					<Link
						href={ROUTES.articlesByKeyword(lead.tag)}
						className="self-start text-small text-primary no-underline hover:underline"
					>
						{COPY.topicMore(lead.tag)}
					</Link>
				</div>
				<ul className="m-0 flex list-none flex-col p-0">
					{rest.map((topic) => {
						const story = topic.stories[0];
						return (
							<li key={topic.tag} className="border-b border-light-grey last:border-b-0">
								<Link
									href={ROUTES.article(story.newsletterId)}
									className="group flex gap-4 py-4 text-inherit no-underline"
								>
									<span className="flex min-w-0 flex-1 flex-col gap-1">
										<TopicLabel topic={topic} />
										<strong className="line-clamp-2 leading-snug font-semi-bold group-hover:underline">
											{story.heading}
										</strong>
										{story.line && <span className="line-clamp-2 text-small text-sub-text">{story.line}</span>}
										<StoryMeta story={story} />
									</span>
									{story.image && (
										<Image
											src={story.image}
											alt=""
											ratio="square"
											sizes="96px"
											width={96}
											height={96}
											className="w-24 shrink-0 mobile:w-20"
										/>
									)}
								</Link>
							</li>
						);
					})}
				</ul>
			</div>
		</section>
	);
}

/** 분야를 넘는 흐름: 해설 + 잇는 소식을 분야 마디로 이은 줄 (옅은 바탕 띠) */
export function ThreadsSection({ threads }: { threads: HomeThread[] }) {
	if (!threads.length) return null;
	return (
		<FullWidthPanel background="surface" color="text" className="my-4 py-14 mobile:py-10">
			<div className={cx(SECTION, 'max-w-[1024px] py-0')} data-track-section="home-threads">
				<SectionHeader eyebrow={COPY.eyebrow.threads} title={COPY.threads} />
				<div className="grid w-full grid-cols-2 gap-6 tablet:grid-cols-1">
					{threads.map((thread) => (
						<article key={thread.title} className="flex flex-col gap-4 rounded-surface bg-background p-6">
							<h3 className="m-0 text-large leading-snug font-bold">{thread.title}</h3>
							<p className="m-0 text-small leading-relaxed text-sub-text">{thread.text}</p>
							{/* 분야 마디를 세로 실선으로 잇는다: 한 흐름 안의 소식이 이어져 있다는 것을 모양으로 */}
							<ol className="m-0 flex list-none flex-col p-0">
								{thread.stories.map((story) => (
									<li
										key={storyKey(story)}
										className="relative pb-3 pl-6 before:absolute before:top-2 before:left-[5px] before:h-full before:w-px before:bg-light-grey last:pb-0 last:before:hidden"
									>
										<span
											className="absolute top-1.5 left-0 size-[11px] rounded-full border-2 border-primary bg-background"
											aria-hidden
										/>
										<Link
											href={ROUTES.article(story.newsletterId)}
											className="flex flex-col text-inherit no-underline hover:text-primary"
										>
											<span className="text-small font-semi-bold text-primary">{story.category}</span>
											<span className="leading-snug">{story.heading}</span>
										</Link>
									</li>
								))}
							</ol>
						</article>
					))}
				</div>
			</div>
		</FullWidthPanel>
	);
}

/** 사건이 처음 나온 날부터 마지막 소식까지 며칠째인지 (같은 날이면 1) */
const daysBetween = (from: string, to: string) =>
	Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / (24 * 60 * 60 * 1000)) + 1;

/** 날짜 축에 두는 날 수 (그보다 오래된 마디는 뺀다) */
const AXIS_DAYS = 7;

/**
 * 이어지는 이야기: 날짜 축 표. 가로축은 날짜(사건들에 나오는 날만), 사건마다 한 줄.
 * 처음 나온 날부터 가장 새 소식까지 실선으로 잇고, 소식이 있는 날에 점과 제목을 둔다 (가장 새 소식만 채운 점 + 새로 나온 것 한 줄).
 * 여러 사건이 언제 시작해 얼마나 이어졌는지 한눈에 견준다. 좁은 화면은 표를 가로로 밀어 본다
 */
export function ContinuingSection({ stories }: { stories: HomeContinuing[] }) {
	if (!stories.length) return null;
	const dates = [...new Set(stories.flatMap(({ steps }) => steps.map((step) => step.date)))].sort().slice(-AXIS_DAYS);
	const latestDate = dates[dates.length - 1];
	return (
		<section className={SECTION} data-track-section="home-continuing">
			<SectionHeader eyebrow={COPY.eyebrow.continuing} title={COPY.continuing} note={COPY.continuingNote} />
			<div className="w-full overflow-x-auto">
				<div
					role="table"
					aria-label={COPY.continuing}
					className="grid min-w-[calc(8rem+var(--days)*10rem)] grid-cols-[8rem_repeat(var(--days),minmax(0,1fr))] tablet:min-w-[calc(7rem+var(--days)*11rem)] tablet:grid-cols-[7rem_repeat(var(--days),minmax(0,1fr))] mobile:min-w-[calc(4rem+var(--days)*9rem)] mobile:grid-cols-[4rem_repeat(var(--days),minmax(0,1fr))]"
					style={{ '--days': dates.length } as React.CSSProperties}
				>
					<div role="row" className="contents">
						<span role="columnheader" className="border-b border-light-grey" />
						{dates.map((date) => (
							<span
								key={date}
								role="columnheader"
								className={cx(
									'border-b border-light-grey px-3 pb-2 text-small',
									date === latestDate ? 'font-semi-bold text-primary' : 'text-sub-text',
								)}
							>
								{monthDay(date)}
							</span>
						))}
					</div>
					{stories.map(({ steps }) => {
						const shown = steps.filter((step) => dates.includes(step.date));
						const byDate = new Map(shown.map((step) => [step.date, step]));
						const first = dates.indexOf(shown[0].date);
						const last = dates.indexOf(shown[shown.length - 1].date);
						const latest = steps[steps.length - 1];
						return (
							<div key={storyKey(steps[0])} role="row" className="contents">
								<span role="rowheader" className="flex flex-col gap-1 border-b border-light-grey py-4 pr-3 mobile:pr-1">
									<span className="text-small font-semi-bold text-primary">{latest.category}</span>
									<span className="text-small text-sub-text">
										{COPY.continuingDays(daysBetween(steps[0].date, latest.date))}
									</span>
								</span>
								{dates.map((date, col) => {
									const step = byDate.get(date);
									const isLatest = step === latest;
									return (
										<div key={date} role="cell" className="relative border-b border-light-grey px-3 py-4">
											{/* 사건을 잇는 실선: 첫 마디의 점에서 마지막 마디의 점까지 (칸 가운데가 아니라 점 높이) */}
											{col >= first && col <= last && (
												<span
													aria-hidden
													className={cx(
														'absolute top-[calc(1rem+5px)] h-px bg-primary/40',
														col === first ? 'left-[calc(0.75rem+5px)]' : 'left-0',
														col === last ? 'right-[calc(100%-0.75rem-5px)]' : 'right-0',
													)}
												/>
											)}
											{step && (
												<Link
													href={ROUTES.article(step.newsletterId)}
													className="group relative flex flex-col gap-1.5 text-inherit no-underline"
												>
													<span
														aria-hidden
														className={cx(
															'size-[11px] rounded-full border-2 border-primary',
															isLatest ? 'bg-primary' : 'bg-background',
														)}
													/>
													<span
														className={cx(
															'line-clamp-3 text-small leading-snug group-hover:underline',
															isLatest ? 'font-bold' : 'font-semi-bold',
														)}
													>
														{step.heading}
													</span>
													{/* 가장 새 소식만: 앞 소식보다 새로 나온 것 */}
													{isLatest && step.reason && (
														<span className="line-clamp-3 text-[0.75rem] leading-relaxed text-sub-text">
															{step.reason}
														</span>
													)}
												</Link>
											)}
										</div>
									);
								})}
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}

function RankList<T>({
	title,
	period,
	items,
	keyOf,
	render,
	empty,
}: {
	title: string;
	/** 세는 기간 (제목 옆에 작게) */
	period: string;
	items: T[];
	keyOf: (item: T) => string;
	render: (item: T) => { href: string; label: string; meta: string };
	/** 비었을 때 칸을 빼지 않고 보일 안내 (없으면 빈 목록) */
	empty?: { title: string; text: string };
}) {
	return (
		<div className="flex min-w-0 flex-col gap-3">
			<h3 className="m-0 flex items-baseline gap-2 text-medium font-semi-bold">
				{title}
				<span className="text-small font-regular text-sub-text">{period}</span>
			</h3>
			{!items.length && empty && (
				<p className="m-0 flex flex-col gap-1 rounded-surface bg-surface p-5 text-small leading-relaxed text-sub-text">
					<strong className="text-medium font-semi-bold text-text">{empty.title}</strong>
					{empty.text}
				</p>
			)}
			<ol className="m-0 flex list-none flex-col gap-3 p-0 empty:hidden">
				{items.map((item, i) => {
					const { href, label, meta } = render(item);
					return (
						<li key={keyOf(item)}>
							<Link href={href} className="group flex items-start gap-3 text-inherit no-underline">
								<span
									className={cx(
										'w-7 shrink-0 text-[1.5rem] leading-none font-bold',
										i === 0 ? 'text-primary' : 'text-light-grey',
									)}
								>
									{i + 1}
								</span>
								<span className="flex min-w-0 flex-col">
									<span className="line-clamp-2 leading-snug group-hover:text-primary">{label}</span>
									<span className="text-small text-sub-text">{meta}</span>
								</span>
							</Link>
						</li>
					);
				})}
			</ol>
		</div>
	);
}

/**
 * 태그 크기: 많이 뜬 순서(API가 평소보다 늘어난 만큼 → 최근 횟수 순으로 준다)대로 두 개씩 한 단계 작게.
 * 처음에는 오늘 횟수에 비례했는데, 횟수가 다 1인 날은 전부 같은 크기라 차이가 보이지 않았다
 */
const TAG_SIZES = ['text-[1.5rem]', 'text-[1.25rem]', 'text-medium', 'text-small'];
const tagSize = (rank: number) => TAG_SIZES[Math.min(TAG_SIZES.length - 1, Math.floor(rank / 2))];

/** 지금 뜨는 소식: 지금 뜨는 태그(많을수록 큰 글자) · 많이 읽은 · 많이 스크랩한, 세로 실선으로 나눈 세 칸 */
export function PopularSection({
	risingTags,
	mostRead,
	mostScrapped,
}: {
	risingTags: HomeRisingTag[];
	mostRead: HomeMostRead[];
	mostScrapped: HomeMostScrapped[];
}) {
	if (!risingTags.length && !mostRead.length && !mostScrapped.length) return null;
	// 뜨는 태그 · 많이 읽은 것은 없으면 빼고, 많이 스크랩한 칸은 비어도 안내를 둔다
	const column = 'min-w-0 border-l border-light-grey pl-8 first:border-l-0 first:pl-0 tablet:border-l-0 tablet:pl-0';
	return (
		<section className={SECTION} data-track-section="home-popular">
			<SectionHeader eyebrow={COPY.eyebrow.popular} title={COPY.popular} />
			<div className="grid w-full grid-cols-3 gap-8 tablet:grid-cols-1">
				{risingTags.length > 0 && (
					<div className={cx(column, 'flex flex-col gap-3')}>
						<h3 className="m-0 flex items-baseline gap-2 text-medium font-semi-bold">
							{COPY.risingTags}
							<span className="text-small font-regular text-sub-text">{COPY.risingPeriod}</span>
						</h3>
						<ul className="m-0 flex list-none flex-wrap items-baseline gap-x-4 gap-y-2 p-0">
							{/* 크기는 뜬 순서로 정하고, 놓는 순서는 가나다: 뜬 순서대로 놓으면 큰 글자부터 계단처럼 줄어들어 어색했다 */}
							{risingTags
								.map((tag, rank) => ({ tag, rank }))
								.sort((a, b) => a.tag.tag.localeCompare(b.tag.tag, 'ko'))
								.map(({ tag, rank }) => (
									<li key={tag.tag}>
										<Link
											href={ROUTES.articlesByKeyword(tag.tag)}
											className={cx(
												'inline-flex items-baseline gap-1 font-semi-bold text-inherit no-underline hover:text-primary',
												tagSize(rank),
											)}
										>
											<span>#{tag.tag}</span>
											<span className="text-[0.75rem] font-semi-bold text-primary">{riseLabel(tag)}</span>
										</Link>
									</li>
								))}
						</ul>
						<p className="m-0 text-[0.75rem] text-sub-text">{COPY.risingNote}</p>
					</div>
				)}
				{mostRead.length > 0 && (
					<div className={column}>
						<RankList
							title={COPY.mostRead}
							period={COPY.mostReadPeriod}
							items={mostRead}
							keyOf={(item) => String(item.newsletterId)}
							render={(item) => ({
								href: ROUTES.article(item.newsletterId),
								label: item.title,
								meta: `${item.category} · ${COPY.views(item.views)}`,
							})}
						/>
					</div>
				)}
				{/* 스크랩이 아직 없어도 칸은 두고 안내를 보인다 (세 칸이 늘 가지런하게) */}
				<div className={column}>
					<RankList
						title={COPY.mostScrapped}
						period={COPY.mostScrappedPeriod}
						items={mostScrapped}
						keyOf={(item) => `${item.newsletterId}-${item.heading}`}
						render={(item) => ({
							href: ROUTES.article(item.newsletterId),
							label: item.heading,
							meta: `${item.category} · ${COPY.scraps(item.scraps)}`,
						})}
						empty={{ title: COPY.mostScrappedEmptyTitle, text: COPY.mostScrappedEmpty }}
					/>
				</div>
			</div>
		</section>
	);
}
