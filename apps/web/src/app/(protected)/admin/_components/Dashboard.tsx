'use client';

import { useConfirmAction } from '@/hooks/useConfirmAction';
import { ROUTES } from '@/constants/routes';
import {
	fetchDashboard,
	fetchMailRecipients,
	fetchNewsletterList,
	rerunSummary,
	runJobNow,
	toggleJob,
} from '@/api/admin';
import { queryKeys } from '@/api/queryKeys';

import type { JobName, JobResult } from '@newpick/shared';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PeriodPicker, PeriodTitle, useAdminQuery } from './period';
import { PROCESS_LABEL, usd, when } from '../_lib/format';
import { LuArrowRight, LuCalendarPlus, LuChevronDown, LuClock, LuInfo, LuPlay } from 'react-icons/lu';
import ScheduleEditor, { describe, type Schedule } from './ScheduleEditor';
import { errorMessage } from '@/api/client';
import { useToast } from '@/hooks/useToast';
import { useModal } from '@/hooks/useModal';
import { mapIdToTitle } from '@/utils/mapInterests';
import { CATEGORIES } from '@/constants/categories';
import Title from '@/components/common/Title';
import Text from '@/components/common/Text';
import Button from '@/components/common/Button';
import ModalContents from '@/components/common/modal/ModalContent';
import { SkeletonBlock } from '@/components/common/loader/Skeleton';
import StatusBadge, { toneOf } from '@/components/common/StatusBadge';
import MoreLink from '@/components/common/MoreLink';

/** 대시보드 응답 (@newpick/shared, api 응답과 같다) */

/** 작업마다: API 이름 · 언제 도는지 · 지금 실행 전 확인 문구 */
const JOBS: Record<JobName, { label: string; warning: string }> = {
	crawling: {
		label: '기사 수집',
		warning: '언론사 기사를 지금 모읍니다. 분야가 없는 기사는 Claude로 분류해 비용이 조금 듭니다.',
	},
	summary: {
		label: 'AI 요약',
		warning:
			'생성에 실패한 분야의 뉴스레터를 다시 시도합니다. 생성에 성공한 항목을 제외하고, 실패한 항목만 재시도하며, Claude 비용이 발생합니다.',
	},
	mail: {
		label: '구독 메일',
		warning: '모든 구독자에게 오늘 뉴스레터를 지금 보냅니다. 이미 보냈다면 같은 메일을 한 번 더 받습니다.',
	},
};

const STATUS_LABEL: Record<JobResult, string> = {
	success: '성공',
	partial: '일부 실패',
	failed: '실패',
	skipped: '건너뜀',
};

/** 작업마다 언제 도는지: '매시 00분' · '매일 08:30' · '매주 월요일 08:40' */
const scheduleText = (job: JobName, schedule: Schedule) =>
	job === 'crawling'
		? `매시 ${String(schedule.crawl.minute).padStart(2, '0')}분`
		: job === 'summary'
			? describe(schedule.summary)
			: describe(schedule.mail, schedule.mail.day);

/** 그날 받은 사람: 펼칠 때만 불러온다 */
function MailRecipients({ date, today }: { date: string; today: string }) {
	const { data, isPending, isError } = useQuery({
		queryKey: queryKeys.admin.mailRecipients(date),
		queryFn: () => fetchMailRecipients(date),
	});
	if (isPending) return <p className="recipients-state">불러오는 중…</p>;
	if (isError) return <p className="recipients-state">받은 사람을 불러오지 못했습니다.</p>;
	if (data.length === 0) return <p className="recipients-state">기록이 없습니다.</p>;
	return (
		<ul className="recipients">
			{data.map((row) => (
				<li key={row.email}>
					<span className="email">{row.email}</span>
					<span className="cats">{mapIdToTitle(row.categoryIds).join(' · ')}</span>
					<span className="time">{when(row.sentAt, today)}</span>
				</li>
			))}
		</ul>
	);
}

/**
 * 관리자 대시보드 (#21): 오늘 아침 작업이 제대로 돌았는지 서버에 접속하지 않고 본다.
 * 진행 중인 작업이 있으면 5초마다, 아니면 1분마다 새로 고친다
 */
export default function Dashboard() {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const { openModal, closeModal } = useModal();
	const confirm = useConfirmAction();
	// 고른 기간은 주소(?from=&to=)에. 상세 화면으로 같은 기간을 들고 간다
	const { today, from, to, periodQuery } = useAdminQuery();
	const [openDay, setOpenDay] = useState<string | null>(null);

	const { data, isPending, isError, refetch } = useQuery({
		queryKey: queryKeys.admin.dashboard.range(from, to),
		queryFn: () => fetchDashboard(from, to),
		placeholderData: (previous) => previous,
		refetchInterval: (query) =>
			Object.values(query.state.data?.scheduler.runs ?? {}).some((run) => run.running) ? 5000 : 60000,
	});

	const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard.all });

	const editSchedule = () =>
		data &&
		openModal(
			<ScheduleEditor
				initial={data.scheduler.schedule}
				onCancel={closeModal}
				onSaved={() => {
					closeModal();
					showToast('예약 시간을 바꿨습니다. 다음 실행부터 적용됩니다.', 'success');
					refresh();
				}}
			/>,
		);

	const toggle = async (job: JobName, enable: boolean) => {
		try {
			await toggleJob(job, enable);
			showToast(
				enable
					? `${JOBS[job].label}을 켰습니다.`
					: `${JOBS[job].label}을 껐습니다. 서버를 다시 시작하면 다시 켜집니다.`,
				'info',
			);
			refresh();
		} catch (error) {
			showToast(errorMessage(error, '바꾸지 못했습니다.'), 'error');
		}
	};

	// 빠진 날 채우기: 고른 날에 뉴스레터가 없는 관심사만 그날 기사 · 그날 날짜로 (서버가 있는 관심사는 건너뛴다)
	const fillDay = () =>
		openModal(
			<FillDay
				onCancel={closeModal}
				onConfirm={async (date) => {
					closeModal();
					try {
						await rerunSummary({ date });
						showToast(`${date} 누락된 뉴스레터 생성을 시작했습니다. 관심사당 1~2분 소요됩니다.`, 'success');
						setTimeout(refresh, 800);
					} catch (error) {
						showToast(errorMessage(error, '시작하지 못했습니다.'), 'error');
					}
				}}
			/>,
		);

	const runNow = (job: JobName) =>
		confirm({
			title: `${JOBS[job].label}을 지금 실행하시겠습니까?`,
			content: JOBS[job].warning,
			confirmLabel: '지금 실행',
			// AI 요약은 오늘 아직 없는 분야만 만들므로, 어느 분야를 만드는지 보여 준다
			children: job === 'summary' && <MissingCategories date={kstDay(0)} label="재생성 항목" />,
			run: () => runJobNow(job),
			success: `${JOBS[job].label}을 시작했습니다.`,
			failure: '시작하지 못했습니다.',
			// 서버가 실행 기록을 남길 틈을 주고 새로 고친다
			onDone: () => setTimeout(refresh, 800),
		});

	if (isPending) {
		return (
			<div className="np-admin-dashboard-dashboard" aria-busy>
				<SkeletonBlock $height="14rem" $radius="8px" />
			</div>
		);
	}

	if (isError || !data) {
		return (
			<div className="np-admin-dashboard-dashboard">
				<Text size="small" color="subText">
					대시보드를 불러오지 못했습니다.{' '}
					<button type="button" className="retry" onClick={() => refetch()}>
						다시 시도
					</button>
				</Text>
			</div>
		);
	}

	const { scheduler, crawling, newsletters, summaryLogs, mail, aiCost } = data;
	const recipients = mail.byDay.reduce((sum, row) => sum + row.recipients, 0);
	const singleDay = from === to;
	const days = Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000) + 1;

	return (
		<div className="np-admin-dashboard-dashboard">
			<section aria-labelledby="dash-today">
				<div className="section-head period-head">
					<Title as="h2" size="extraSmall" weight="bold" className="section-title">
						<PeriodTitle id="dash-today" />
					</Title>
					<PeriodPicker />
				</div>
				<dl className="numbers">
					<div>
						<dt>수집한 기사</dt>
						<dd>{crawling.count.toLocaleString()}건</dd>
						<span className="sub">마지막 {when(crawling.latestAt, today)}</span>
						<MoreLink href={`${ROUTES.admin.articles}${periodQuery}`}>기사 보기 →</MoreLink>
					</div>
					<div>
						<dt>발행한 뉴스레터</dt>
						<dd>{newsletters.total.toLocaleString()}편</dd>
						<span className="sub">
							{singleDay
								? `관심사 6개 중 ${new Set(newsletters.items.map((n) => n.categoryId)).size}개`
								: `${days}일 · 하루 평균 ${(newsletters.total / days).toFixed(1)}편`}
						</span>
						<MoreLink href={`${ROUTES.admin.newsletters}${periodQuery}`}>발행 목록 보기 →</MoreLink>
					</div>
					<div>
						<dt>AI 비용</dt>
						<dd>{usd(aiCost.total)}</dd>
						<span className="sub">
							{aiCost.unknown > 0 ? `비용 모르는 이전 기록 ${aiCost.unknown}건 제외` : `AI 호출 ${summaryLogs.total}건`}
						</span>
						<MoreLink href={`${ROUTES.admin.aiLogs}${periodQuery}`}>AI 기록 보기 →</MoreLink>
					</div>
					<div>
						<dt>메일 받은 사람</dt>
						<dd>{recipients.toLocaleString()}명</dd>
						<span className="sub">구독 중 {mail.activeSubscribers.toLocaleString()}명</span>
						<MoreLink href={`${ROUTES.admin.mail}${periodQuery}`}>발송 기록 보기 →</MoreLink>
					</div>
				</dl>
			</section>

			<section aria-labelledby="dash-jobs">
				<div className="section-head">
					{/* 시간 설정은 제목 바로 오른쪽, 기록 보기는 오른쪽 끝 */}
					<div className="head-title">
						<Title as="h2" size="extraSmall" weight="bold" className="section-title">
							<span id="dash-jobs">예약 작업</span>
						</Title>
						<Button
							scheme="monoOutline"
							size="small"
							icon={<LuClock aria-hidden />}
							iconPosition="left"
							onClick={editSchedule}
						>
							시간 설정
						</Button>
						{/* 예약 실행이 꺼진 서버(보통 로컬): 제목 옆 배지로 짧게, 풀어 쓴 설명은 아래 한 줄 */}
						{scheduler.autoRun === false && <StatusBadge tone="neutral">자동 실행 꺼짐</StatusBadge>}
					</div>
					<MoreLink href={`${ROUTES.admin.jobRuns}${periodQuery}`}>
						실행 기록 보기 <LuArrowRight aria-hidden />
					</MoreLink>
				</div>
				{scheduler.autoRun === false && (
					<p className="auto-off" role="note">
						<LuInfo aria-hidden />
						<span>
							이 서버는 예약 시각에 저절로 돌지 않습니다. 필요할 때 &lsquo;지금 실행&rsquo;으로 돌려 주십시오.
							<code>SCHEDULER_ENABLED=false</code>
						</span>
					</p>
				)}
				<ul className="jobs">
					{(Object.keys(JOBS) as JobName[]).map((job) => {
						const run = scheduler.runs[job];
						const enabled = scheduler.enabled[job];
						const state = run.running ? 'running' : (run.status ?? 'none');
						return (
							<li key={job} className="job">
								{/* 켜기 · 끄기: 줄 맨 앞, 글자 없이 스위치만 (상태는 화면 읽기 프로그램에 aria-checked로) */}
								<button
									type="button"
									role="switch"
									aria-checked={enabled}
									aria-label={`${JOBS[job].label} 예약 실행`}
									className="switch"
									onClick={() => toggle(job, !enabled)}
								>
									<span className="knob" aria-hidden />
								</button>
								<div className="job-main">
									<span className="job-name">{JOBS[job].label}</span>
									<span className="job-when">{scheduleText(job, scheduler.schedule)}</span>
								</div>
								<div className="job-run">
									<StatusBadge tone={toneOf(state)} className="job-badge">
										{run.running ? '진행 중' : run.status ? STATUS_LABEL[run.status] : '기록 없음'}
									</StatusBadge>
									<span className="job-message">
										{run.running
											? `${when(run.startedAt, today)} 시작`
											: run.finishedAt
												? `${when(run.finishedAt, today)}${run.trigger === 'manual' ? ' · 지금 실행' : ''} · ${run.message}`
												: '아직 실행 기록이 없습니다'}
									</span>
								</div>
								<div className="job-actions">
									<Button
										scheme="monoOutline"
										size="small"
										icon={<LuPlay aria-hidden />}
										iconPosition="left"
										onClick={() => runNow(job)}
										disabled={run.running}
									>
										지금 실행
									</Button>
									{job === 'summary' && (
										<Button
											scheme="monoOutline"
											size="small"
											icon={<LuCalendarPlus aria-hidden />}
											iconPosition="left"
											onClick={fillDay}
											disabled={run.running}
										>
											빠진 날
										</Button>
									)}
								</div>
							</li>
						);
					})}
				</ul>
				<Text size="extraSmall" color="subText" className="note">
					켜기 · 끄기는 서버 메모리에만 있어 서버를 다시 시작하면 켜짐으로 돌아갑니다. 시간과 실행 기록은 남습니다.
				</Text>
			</section>

			<div className="two">
				<section aria-labelledby="dash-newsletters">
					<div className="section-head">
						<Title as="h2" size="extraSmall" weight="bold" className="section-title">
							<span id="dash-newsletters">발행</span>
						</Title>
						<MoreLink href={`${ROUTES.admin.newsletters}${periodQuery}`}>
							전체 {newsletters.total.toLocaleString()}편 보기 <LuArrowRight aria-hidden />
						</MoreLink>
					</div>
					{newsletters.items.length === 0 ? (
						<Text size="small" color="subText">
							이 기간에 발행한 뉴스레터가 없습니다.
						</Text>
					) : (
						<ul className="list">
							{newsletters.items.map((n) => (
								<li key={n.id}>
									<span className="category">{mapIdToTitle([n.categoryId])[0]}</span>
									<a href={ROUTES.article(n.id)} className="title">
										{n.title}
									</a>
									<span className="time">{when(n.createdAt, today)}</span>
								</li>
							))}
						</ul>
					)}
				</section>

				<section aria-labelledby="dash-mail">
					<div className="section-head">
						<Title as="h2" size="extraSmall" weight="bold" className="section-title">
							<span id="dash-mail">날짜별 발송</span>
						</Title>
						<MoreLink href={`${ROUTES.admin.mail}${periodQuery}`}>
							발송 기록 보기 <LuArrowRight aria-hidden />
						</MoreLink>
					</div>
					{mail.byDay.length === 0 ? (
						<Text size="small" color="subText">
							이 기간에 보낸 메일이 없습니다.
						</Text>
					) : (
						<ul className="list">
							{mail.byDay.slice(0, 5).map((row) => {
								const open = openDay === row.day;
								return (
									<li key={row.day} className="mail-day">
										{/* 누르면 그날 받은 사람(이메일 · 받은 관심사 · 보낸 시각) */}
										<button
											type="button"
											className="day-toggle"
											aria-expanded={open}
											onClick={() => setOpenDay(open ? null : row.day)}
										>
											<span className="title">{row.day}</span>
											<span className="time">{row.recipients.toLocaleString()}명</span>
											<LuChevronDown aria-hidden className={open ? 'chevron open' : 'chevron'} />
										</button>
										{open && <MailRecipients date={row.day} today={today} />}
									</li>
								);
							})}
						</ul>
					)}
				</section>
			</div>

			<section aria-labelledby="dash-logs">
				<div className="section-head">
					<Title as="h2" size="extraSmall" weight="bold" className="section-title">
						<span id="dash-logs">AI 기록</span>
					</Title>
					<MoreLink href={`${ROUTES.admin.aiLogs}${periodQuery}`}>
						전체 {summaryLogs.total.toLocaleString()}건 보기 <LuArrowRight aria-hidden />
					</MoreLink>
				</div>
				{summaryLogs.items.length === 0 ? (
					<Text size="small" color="subText">
						이 기간에 기록이 없습니다.
					</Text>
				) : (
					<div className="table-wrap">
						<table>
							<thead>
								<tr>
									<th scope="col">시각</th>
									<th scope="col">종류</th>
									<th scope="col">결과</th>
									<th scope="col">걸린 시간</th>
									<th scope="col">토큰 (입력 / 출력)</th>
									<th scope="col">비용</th>
									<th scope="col">내용</th>
								</tr>
							</thead>
							<tbody>
								{summaryLogs.items.map((log) => (
									<tr key={log.id}>
										<td className="nowrap">{when(log.createdAt, today)}</td>
										<td className="nowrap" title={log.model ?? undefined}>
											{PROCESS_LABEL[log.processType] ?? log.processType}
										</td>
										<td className="nowrap">
											<StatusBadge tone={toneOf(log.status)}>{log.status === 'success' ? '성공' : '실패'}</StatusBadge>
										</td>
										<td className="nowrap num">{log.duration.toFixed(1)}초</td>
										<td className="nowrap num">
											{log.inputTokens || log.outputTokens
												? `${log.inputTokens.toLocaleString()} / ${log.outputTokens.toLocaleString()}`
												: log.token.toLocaleString()}
										</td>
										<td className="nowrap num">{usd(log.costUsd)}</td>
										<td className="content" title={log.error ?? log.result ?? undefined}>
											{log.error ?? log.result}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</section>
		</div>
	);
}

/** KST로 daysAgo일 전 날짜 (YYYY-MM-DD) */
const kstDay = (daysAgo: number) =>
	new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });

/** 그날 아직 뉴스레터가 없는 분야: 서버가 만들 분야와 같다 (있는 분야는 건너뛴다) */
function MissingCategories({ date, label }: { date: string; label: string }) {
	const { data: missing, isPending } = useQuery({
		queryKey: queryKeys.admin.newsletters.day(date),
		queryFn: async () => {
			const query = new URLSearchParams({ from: date, to: date, limit: '100', offset: '0' });
			const data = await fetchNewsletterList(query.toString());
			const done = new Set(data.items.map((item) => item.categoryId));
			return CATEGORIES.filter((category) => category.id !== 0 && !done.has(category.id));
		},
	});
	return (
		<p className="np-admin-dashboard-missing" aria-live="polite">
			<span className="label">{label}</span>
			{isPending
				? '확인 중입니다.'
				: !missing?.length
					? '모든 분야가 이미 생성되어 대상이 없습니다.'
					: missing.map((category) => category.name).join(' · ')}
		</p>
	);
}

/** 빠진 날 채우기 창: 날짜 하나 고르기 (어제부터 모은 기사가 남아 있는 29일 전까지) */
function FillDay({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: (date: string) => void }) {
	const day = kstDay;
	const [date, setDate] = useState(day(1));
	return (
		<ModalContents
			icon={<LuCalendarPlus />}
			title="누락된 날짜 채우기"
			content="선택한 날짜에 수집된 기사로, 그날 발행되지 않은 관심사의 뉴스레터를 생성해 해당 날짜로 게시합니다. 구독 메일은 발송하지 않으며, Claude 비용이 발생합니다."
			outlineButton="취소"
			filledButton="생성"
			onCancelClick={onCancel}
			onConfirmClick={() => date && onConfirm(date)}
		>
			<label className="np-admin-dashboard-fill-day">
				<span className="np-field-label">날짜</span>
				<input
					type="date"
					className="np-field-control"
					value={date}
					min={day(29)}
					max={day(1)}
					onChange={(event) => setDate(event.target.value)}
				/>
			</label>
			{date && <MissingCategories date={date} label="생성 항목" />}
		</ModalContents>
	);
}
