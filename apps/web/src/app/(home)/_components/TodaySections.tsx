import Link from 'next/link';
import type { HomeMostRead, HomeMostScrapped, HomeRisingTag, HomeStory, HomeThread, HomeToday } from '@newpick/shared';
import { ROUTES } from '@/constants/routes';
import TodayTrendSection from './TodayTrendSection';
import { SECTION, SectionHeader } from './SectionHeader';
import { HOME } from '@/copy';

const COPY = HOME.today;

/**
 * 홈 '오늘' 칸들 (GET /edition/today, 서버에서 받아 그린다). 이미 만든 편집본 · 조회 · 스크랩 · 태그를 모은 것이라 AI 호출이 없다.
 * 데이터가 비면 그 칸은 그리지 않는다
 */

/** 2026-11-23 → 11월 23일 */
const dayLabel = (date: string) => {
	const [, month, day] = date.split('-').map(Number);
	return month && day ? `${month}월 ${day}일` : date;
};

/** 오늘의 3줄: 오늘 모든 분야 소식 가운데 중요도 상위 3개를 한 줄씩 */
export function TodayLinesSection({ date, stories }: { date: string; stories: HomeStory[] }) {
	if (!stories.length) return null;
	return (
		<section className={SECTION} data-track-section="home-today-lines">
			<SectionHeader title={COPY.lines} note={COPY.linesNote(dayLabel(date))} />
			<ol className="m-0 grid list-none grid-cols-3 gap-4 p-0 tablet:grid-cols-1">
				{stories.map((story, i) => (
					<li key={`${story.newsletterId}-${story.storyIndex}`} className="flex">
						<Link
							href={ROUTES.article(story.newsletterId)}
							className="flex w-full gap-4 rounded-surface bg-surface p-5 text-inherit no-underline transition-colors hover:bg-neutral"
						>
							<span className="text-[2rem] leading-none font-semi-bold text-primary" aria-hidden>
								{i + 1}
							</span>
							<span className="flex min-w-0 flex-col gap-1.5">
								<span className="text-small font-semi-bold text-primary">{story.category}</span>
								<strong className="text-medium leading-snug font-semi-bold">{story.heading}</strong>
								{story.line && <span className="text-small leading-relaxed text-sub-text">{story.line}</span>}
							</span>
						</Link>
					</li>
				))}
			</ol>
		</section>
	);
}

/** 분야를 넘는 흐름: 서로 다른 분야 소식을 잇는 해설 (편집본) */
export function ThreadsSection({ threads }: { threads: HomeThread[] }) {
	if (!threads.length) return null;
	return (
		<section className={SECTION} data-track-section="home-threads">
			<SectionHeader title={COPY.threads} />
			<div className="grid w-full grid-cols-2 gap-4 tablet:grid-cols-1">
				{threads.map((thread) => (
					<article key={thread.title} className="flex flex-col gap-3 border-l-4 border-primary py-1 pl-5">
						<h3 className="m-0 text-medium leading-snug font-semi-bold">{thread.title}</h3>
						<p className="m-0 text-small leading-relaxed text-sub-text">{thread.text}</p>
						<ul className="m-0 flex list-none flex-wrap gap-2 p-0">
							{thread.stories.map((story) => (
								<li key={`${story.newsletterId}-${story.storyIndex}`} className="max-w-full">
									<Link
										href={ROUTES.article(story.newsletterId)}
										className="flex max-w-full items-center gap-1.5 rounded-chip border border-light-grey px-3 py-1 text-small text-inherit no-underline transition-colors hover:border-primary"
									>
										<span className="shrink-0 font-semi-bold text-primary">{story.category}</span>
										<span className="truncate">{story.heading}</span>
									</Link>
								</li>
							))}
						</ul>
					</article>
				))}
			</div>
		</section>
	);
}

function RankList<T>({
	title,
	items,
	keyOf,
	render,
}: {
	title: string;
	items: T[];
	keyOf: (item: T) => string;
	render: (item: T) => { href: string; label: string; category: string; count: string };
}) {
	return (
		<div className="flex min-w-0 flex-col gap-4">
			<h3 className="m-0 text-medium font-semi-bold">{title}</h3>
			<ol className="m-0 flex list-none flex-col p-0">
				{items.map((item, i) => {
					const { href, label, category, count } = render(item);
					return (
						<li key={keyOf(item)} className="border-b border-light-grey last:border-b-0">
							<Link
								href={href}
								className="flex items-baseline gap-3 py-2.5 text-inherit no-underline hover:text-primary"
							>
								<span className="w-4 shrink-0 font-semi-bold text-primary">{i + 1}</span>
								<span className="min-w-0 flex-1 truncate">{label}</span>
								<span className="shrink-0 text-small text-sub-text">
									{category} · {count}
								</span>
							</Link>
						</li>
					);
				})}
			</ol>
		</div>
	);
}

/** 지금 뜨는 태그 · 많이 읽은 · 많이 스크랩한: 한 줄에 세 칸 (좁은 화면은 위아래로) */
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
	return (
		<section className={SECTION} data-track-section="home-popular">
			<SectionHeader title={COPY.popular} />
			<div className="grid w-full grid-cols-3 gap-10 tablet:grid-cols-1 tablet:gap-8">
				{risingTags.length > 0 && (
					<div className="flex min-w-0 flex-col gap-4">
						<h3 className="m-0 text-medium font-semi-bold">{COPY.risingTags}</h3>
						<ul className="m-0 flex list-none flex-wrap gap-2 p-0">
							{risingTags.map((tag) => (
								<li key={tag.tag}>
									<Link
										href={ROUTES.articlesByKeyword(tag.tag)}
										className="flex items-center gap-1.5 rounded-chip bg-surface px-3 py-1.5 text-small text-inherit no-underline transition-colors hover:bg-neutral"
									>
										<span>#{tag.tag}</span>
										<span className="text-[0.75rem] font-semi-bold text-primary">
											{tag.average === 0 ? COPY.risingNew : COPY.risingTimes(Math.round(tag.today / tag.average))}
										</span>
									</Link>
								</li>
							))}
						</ul>
						<p className="m-0 text-[0.75rem] text-sub-text">{COPY.risingNote}</p>
					</div>
				)}
				{mostRead.length > 0 && (
					<RankList
						title={COPY.mostRead}
						items={mostRead}
						keyOf={(item) => String(item.newsletterId)}
						render={(item) => ({
							href: ROUTES.article(item.newsletterId),
							label: item.title,
							category: item.category,
							count: COPY.views(item.views),
						})}
					/>
				)}
				{mostScrapped.length > 0 && (
					<RankList
						title={COPY.mostScrapped}
						items={mostScrapped}
						keyOf={(item) => `${item.newsletterId}-${item.heading}`}
						render={(item) => ({
							href: ROUTES.article(item.newsletterId),
							label: item.heading,
							category: item.category,
							count: COPY.scraps(item.scraps),
						})}
					/>
				)}
			</div>
		</section>
	);
}

/** 홈 '오늘' 칸 전부. 받지 못했으면(편집본 없음) 아무것도 그리지 않는다 */
export function TodayTop({ today }: { today: HomeToday | null }) {
	if (!today) return null;
	return (
		<>
			<TodayLinesSection date={today.date} stories={today.topLines} />
			<TodayTrendSection stories={today.trending} />
			<ThreadsSection threads={today.threads} />
		</>
	);
}
