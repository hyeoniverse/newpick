'use client';

import { ADMIN } from '@/copy';
import { ROUTES } from '@/constants/routes';
import type { Dashboard as DashboardData, JobName } from '@newpick/shared';
import { LuArrowRight, LuCalendarPlus, LuClock, LuInfo, LuPlay } from 'react-icons/lu';
import Title from '@/components/common/Title';
import Text from '@/components/common/Text';
import Button from '@/components/common/Button';
import MoreLink from '@/components/common/MoreLink';
import StatusBadge, { toneOf } from '@/components/common/StatusBadge';
import { useAdminQuery } from '../period';
import { when } from '../../_lib/format';
import { JOB_LABEL, RUN_STATUS_LABEL, scheduleText, TRIGGER_LABEL } from '../../_lib/jobs';
import type { JobActions } from './useJobActions';

/** 예약 작업: 켜기 · 끄기 스위치, 언제 도는지, 마지막 실행 결과, 지금 실행 · 빠진 날, 시간 설정 */
export default function JobsTable({
	scheduler,
	actions,
}: {
	scheduler: DashboardData['scheduler'];
	actions: JobActions;
}) {
	const { today, periodQuery } = useAdminQuery();
	const { editSchedule, toggle, runNow, fillDay } = actions;
	return (
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
						{ADMIN.jobs.autoOff}
						<code>SCHEDULER_ENABLED=false</code>
					</span>
				</p>
			)}
			<ul className="jobs">
				{(Object.keys(JOB_LABEL) as JobName[]).map((job) => {
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
								aria-label={`${JOB_LABEL[job]} 예약 실행`}
								className="switch"
								onClick={() => toggle(job, !enabled)}
							>
								<span className="knob" aria-hidden />
							</button>
							<div className="job-main">
								<span className="job-name">{JOB_LABEL[job]}</span>
								<span className="job-when">{scheduleText(job, scheduler.schedule)}</span>
							</div>
							<div className="job-run">
								<StatusBadge tone={toneOf(state)} className="job-badge">
									{run.running ? '진행 중' : run.status ? RUN_STATUS_LABEL[run.status] : '기록 없음'}
								</StatusBadge>
								<span className="job-message">
									{run.running
										? `${when(run.startedAt, today)} 시작`
										: run.finishedAt
											? `${when(run.finishedAt, today)}${run.trigger && run.trigger !== 'schedule' ? ` · ${TRIGGER_LABEL[run.trigger]}` : ''} · ${run.message}`
											: ADMIN.jobs.noRunsYet}
								</span>
								{/* AI 요약에서 실패한 관심사는 작업이 끝난 뒤 자동으로 다시 시도한다: 다음 시각 · 관심사 */}
								{job === 'summary' && scheduler.summaryRetry && (
									<span className="job-retry">
										{ADMIN.jobs.retryPlanned(
											when(scheduler.summaryRetry.at, today),
											scheduler.summaryRetry.categories.join(', '),
											scheduler.summaryRetry.attempt,
										)}
									</span>
								)}
							</div>
							<div className="job-actions">
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
							</div>
						</li>
					);
				})}
			</ul>
			<Text size="extraSmall" color="subText" className="note">
				{ADMIN.jobs.toggleNote}
			</Text>
		</section>
	);
}
