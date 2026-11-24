'use client';

import type { PipelineCategory, PipelineLive, PipelineRun, PipelineState, PipelineStep } from '@newpick/shared';
import { useQuery } from '@tanstack/react-query';
import { LuCheck, LuX } from 'react-icons/lu';
import { queryKeys } from '@/api/queryKeys';
import { fetchPipelineLive } from '@/api/edition';
import { HOME } from '@/copy';
import { cx } from '@/styles/tw';
import { SECTION, SectionHeader } from './SectionHeader';

const COPY = HOME.live;
/** 도는 동안은 자주, 아닐 때는 가끔 (다음 수집이 시작됐는지 알 만큼) */
const RUNNING_POLL = 4000;
const IDLE_POLL = 60_000;

const isRunning = (live?: PipelineLive | null) =>
	live?.crawl?.status === 'running' || live?.summary?.status === 'running';

/** '12:03' (KST) */
const clock = (iso: string) =>
	new Intl.DateTimeFormat('ko-KR', {
		timeZone: 'Asia/Seoul',
		hour: '2-digit',
		minute: '2-digit',
		hourCycle: 'h23',
	}).format(new Date(iso));

/** 단계 아래 작은 글: 도는 동안은 진행, 끝나면 센 수 */
function detailOf(step: PipelineStep) {
	const d = COPY.detail;
	const [done, total] = step.progress ?? [0, 0];
	switch (step.key) {
		case 'fetch':
			return step.state === 'running' ? d.fetchRunning(done, total) : d.fetch(step.count ?? 0);
		case 'classify':
			return step.state === 'running' ? d.classifyRunning(done, total) : d.classify(step.count ?? 0);
		case 'cluster':
			return d.cluster(step.count ?? 0);
		case 'breaking':
			return d.breaking(step.count ?? 0);
		case 'newsletters':
			return d.newsletters(done, total);
		case 'edition':
			return d.edition;
		case 'links':
			return d.links;
		default:
			return '';
	}
}

/** 단계 동그라미: 끝남은 체크, 도는 중은 깜빡이는 고리, 기다림 · 건너뜀은 회색 번호 */
function Mark({ state, index }: { state: PipelineState; index: number }) {
	return (
		<span
			className={cx(
				'relative z-1 flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-solid text-small font-bold',
				state === 'done' && 'border-primary bg-primary text-background',
				state === 'running' && 'border-primary bg-background text-primary',
				state === 'failed' && 'border-error bg-background text-error',
				(state === 'waiting' || state === 'skipped') && 'border-border bg-background text-sub-text',
			)}
		>
			{state === 'running' && (
				<span className="np-live-ping absolute inset-[-6px] rounded-full bg-primary" aria-hidden />
			)}
			{state === 'done' ? <LuCheck aria-hidden /> : state === 'failed' ? <LuX aria-hidden /> : index + 1}
		</span>
	);
}

/** 단계 흐름: 왼쪽에서 오른쪽(휴대폰은 위에서 아래)으로, 사이를 실선으로 잇는다. 끝난 곳까지는 강조색 */
function Steps({ run }: { run: PipelineRun }) {
	return (
		<ol
			className={cx(
				'm-0 grid list-none gap-4 p-0 mobile:grid-cols-1',
				run.steps.length === 4 ? 'grid-cols-4' : 'grid-cols-3',
			)}
		>
			{run.steps.map((step, index) => (
				<li
					key={step.key}
					className="relative flex flex-col items-start gap-2 mobile:flex-row mobile:items-center mobile:gap-3"
					aria-label={`${step.label}: ${COPY.state[step.state]}`}
				>
					{index > 0 && (
						<span
							aria-hidden
							className={cx(
								// 앞 단계 동그라미 오른쪽(앞 칸 왼쪽 + 2.5rem + 여백)부터 이 칸 왼쪽 앞까지. 칸 사이 간격 1rem
								'absolute top-5 left-[calc(2rem-100%)] h-0.5 w-[calc(100%-2.5rem)] -translate-y-1/2 mobile:hidden',
								run.steps[index - 1].state === 'done' ? 'bg-primary' : 'bg-border',
							)}
							data-live-line
						/>
					)}
					<Mark state={step.state} index={index} />
					<div className="flex min-w-0 flex-col">
						<span className={cx('font-semi-bold', step.state === 'skipped' && 'text-sub-text')}>{step.label}</span>
						<span className="text-small text-sub-text tabular-nums">
							{step.state === 'waiting' ? COPY.state.waiting : detailOf(step)}
						</span>
					</div>
				</li>
			))}
		</ol>
	);
}

/** 분야별 새 기사: 가장 많은 분야를 끝까지 채운 막대 */
function Categories({ categories }: { categories: PipelineCategory[] }) {
	const max = Math.max(1, ...categories.map((c) => c.count));
	return (
		<ul className="m-0 flex list-none flex-col gap-2 p-0">
			{categories.map((category) => (
				<li key={category.name} className="grid grid-cols-[3.5rem_1fr_2.5rem] items-center gap-3 text-small">
					<span className="font-semi-bold">{category.name}</span>
					<span className="h-2 overflow-hidden rounded-full bg-border">
						<span
							className="block h-full rounded-full bg-primary [transition:width_0.6s_ease]"
							style={{ width: `${(category.count / max) * 100}%` }}
						/>
					</span>
					<span className="text-right text-sub-text tabular-nums">{COPY.size(category.count)}</span>
				</li>
			))}
		</ul>
	);
}

/** 많이 나온 낱말: 순위가 높을수록 크게, 놓는 순서는 가나다 (뜨는 태그와 같은 규칙) */
const wordSize = (rank: number) =>
	rank < 2 ? 'text-[1.375rem]' : rank < 5 ? 'text-large' : rank < 9 ? 'text-medium' : 'text-small';

function Keywords({ keywords }: { keywords: PipelineRun['keywords'] }) {
	if (!keywords.length) return <p className="m-0 text-small text-sub-text">{COPY.keywordsEmpty}</p>;
	return (
		<ul className="m-0 flex list-none flex-wrap items-baseline gap-x-3 gap-y-1.5 p-0">
			{keywords
				.map((keyword, rank) => ({ keyword, rank }))
				.sort((a, b) => a.keyword.word.localeCompare(b.keyword.word, 'ko'))
				.map(({ keyword, rank }) => (
					<li key={keyword.word} className={cx('font-semi-bold', wordSize(rank))}>
						{keyword.word}
						<span className="ml-0.5 text-[0.75rem] font-regular text-sub-text">{keyword.count}</span>
					</li>
				))}
		</ul>
	);
}

function Clusters({ clusters }: { clusters: PipelineRun['clusters'] }) {
	if (!clusters.length) return <p className="m-0 text-small text-sub-text">{COPY.clustersEmpty}</p>;
	return (
		<ul className="m-0 flex list-none flex-col gap-2 p-0">
			{clusters.map((cluster) => (
				<li
					key={cluster.label}
					className="flex items-center justify-between gap-3 rounded-surface bg-surface px-3 py-2"
				>
					<span className="min-w-0 truncate font-semi-bold">{cluster.label}</span>
					<span className="shrink-0 text-small text-sub-text tabular-nums">{COPY.size(cluster.size)}</span>
				</li>
			))}
		</ul>
	);
}

/** 오늘 아침 뉴스레터 만들기: 분야마다 상태 (도는 동안은 위 큰 흐름이 이것) */
function SummaryRow({ run, next }: { run: PipelineRun; next: string | null }) {
	return (
		<div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-solid border-border pt-5 text-small">
			<span className="font-semi-bold">{COPY.summary}</span>
			{run.finishedAt && <span className="text-sub-text">{COPY.summaryAt(clock(run.finishedAt))}</span>}
			<ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
				{run.categories.map((category) => (
					<li
						key={category.name}
						className={cx(
							'flex items-center gap-1 rounded-full px-2.5 py-0.5',
							category.state === 'done' ? 'bg-tertiary text-primary' : 'bg-surface text-sub-text',
						)}
						aria-label={`${category.name}: ${COPY.state[category.state ?? 'waiting']}`}
					>
						{category.state === 'done' && <LuCheck aria-hidden />}
						{category.name}
					</li>
				))}
			</ul>
			{next && <span className="ml-auto text-sub-text">{COPY.nextSummary(clock(next))}</span>}
		</div>
	);
}

/**
 * 홈 '지금 뉴픽은': 뉴픽이 소식을 만드는 과정. 매시 수집(모으기 → 분야 나누기 → 같은 사건 묶기 → 속보 판정)과
 * 매일 아침 뉴스레터 만들기를 돌 때는 실시간으로(몇 초마다 새로), 아닐 때는 마지막 결과를 보여 준다.
 * 언론사 기사 제목은 보여 주지 않는다: 분야별 건수 · 많이 나온 낱말 · 같은 사건 묶음(이름은 낱말)만.
 * 아직 한 번도 돌지 않았으면 그리지 않는다
 */
export default function LiveSection() {
	const { data } = useQuery({
		queryKey: queryKeys.pipelineLive,
		queryFn: fetchPipelineLive,
		refetchInterval: (query) => (isRunning(query.state.data) ? RUNNING_POLL : IDLE_POLL),
	});
	if (!data || (!data.crawl && !data.summary)) return null;
	const summarizing = data.summary?.status === 'running';
	const main = summarizing ? data.summary! : (data.crawl ?? data.summary!);
	const running = main.status === 'running';

	const status = running
		? [summarizing ? COPY.summarizing : COPY.crawling, COPY.startedAt(clock(main.startedAt))]
		: [
				main.kind === 'crawl' && main.finishedAt && COPY.lastCrawl(clock(main.finishedAt)),
				data.next.crawl && COPY.nextCrawl(clock(data.next.crawl)),
			].filter((text): text is string => Boolean(text));

	return (
		<section className={SECTION} data-track-section="home-live" aria-busy={running}>
			<SectionHeader
				eyebrow={HOME.today.eyebrow.live}
				title={COPY.title}
				aside={
					<span className="flex items-center gap-2 text-small text-sub-text" aria-live="polite">
						<span
							className={cx('size-2 rounded-full', running ? 'np-breaking-dot bg-primary' : 'bg-light-grey')}
							aria-hidden
						/>
						{status.join(' · ')}
					</span>
				}
			/>
			<Steps run={main} />
			{main.kind === 'crawl' && (
				<div className="grid grid-cols-3 gap-8 tablet:grid-cols-1">
					<div className="flex flex-col gap-3">
						<h3 className="m-0 text-medium font-semi-bold">{COPY.categories}</h3>
						<Categories categories={main.categories} />
					</div>
					<div className="flex flex-col gap-3">
						<h3 className="m-0 text-medium font-semi-bold">{COPY.keywords}</h3>
						<Keywords keywords={main.keywords} />
					</div>
					<div className="flex flex-col gap-3">
						<h3 className="m-0 text-medium font-semi-bold">{COPY.clusters}</h3>
						<Clusters clusters={main.clusters} />
					</div>
				</div>
			)}
			{!summarizing && data.summary && <SummaryRow run={data.summary} next={data.next.summary} />}
			{summarizing && data.summary && (
				<ul className="m-0 flex list-none flex-wrap gap-2 p-0">
					{data.summary.categories.map((category) => (
						<li
							key={category.name}
							className={cx(
								'flex items-center gap-2 rounded-surface px-3 py-2 text-small',
								category.state === 'running' ? 'bg-tertiary text-primary' : 'bg-surface',
							)}
						>
							<span className="font-semi-bold">{category.name}</span>
							<span className="text-sub-text">{COPY.state[category.state ?? 'waiting']}</span>
						</li>
					))}
				</ul>
			)}
			<p className="m-0 text-[0.75rem] text-sub-text">{COPY.note}</p>
		</section>
	);
}
