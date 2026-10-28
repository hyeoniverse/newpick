'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PeriodPicker, PeriodTitle, useAdminQuery } from './period';
import { PROCESS_LABEL, usd, when } from './format';
import styled from 'styled-components';
import { LuArrowRight, LuChevronDown, LuClock, LuInfo, LuPlay, LuTriangleAlert } from 'react-icons/lu';
import ScheduleEditor, { clock, describe, type Schedule } from './ScheduleEditor';
import { apiFetch, ApiError } from '@/api/client';
import API_ENDPOINTS from '@/constants/api';
import { useToast } from '@/hooks/useToast';
import { useModal } from '@/hooks/useModal';
import { mapIdToTitle } from '@/utils/mapInterests';
import Title from '@/components/common/Title';
import Text from '@/components/common/Text';
import Button from '@/components/common/Button';
import ModalContents from '@/components/common/modal/ModalContent';
import { SkeletonBlock } from '@/components/common/loader/Skeleton';
import StatusBadge, { toneOf } from '@/components/common/StatusBadge';
import MoreLink from '@/components/common/MoreLink';

type JobKey = 'crawling' | 'summary' | 'mail';
type RunStatus = 'success' | 'partial' | 'failed' | 'skipped' | null;

interface JobRun {
	running: boolean;
	trigger: 'schedule' | 'manual' | null;
	startedAt: string | null;
	finishedAt: string | null;
	status: RunStatus;
	message: string | null;
}

interface DashboardData {
	range: { from: string; to: string };
	scheduler: {
		/** false면 이 서버는 예약 시각에 저절로 돌지 않는다 ('지금 실행'만) */
		autoRun?: boolean;
		enabled: Record<JobKey, boolean>;
		schedule: Schedule;
		runs: Record<JobKey, JobRun>;
	};
	crawling: { count: number; latestAt: string | null };
	newsletters: { total: number; items: { id: number; title: string; categoryId: number; createdAt: string }[] };
	aiCost: { total: number; unknown: number };
	summaryLogs: {
		total: number;
		items: {
			id: number;
			processType: string;
			status: string;
			duration: number;
			token: number;
			createdAt: string;
			result: string | null;
			error: string | null;
			model: string | null;
			inputTokens: number;
			outputTokens: number;
			costUsd: number | null;
		}[];
	};
	mail: { activeSubscribers: number; byDay: { day: string; recipients: number }[] };
}

/** 작업마다: API 이름 · 언제 도는지 · 지금 실행 전 확인 문구 */
const JOBS: Record<JobKey, { label: string; api: 'crawling' | 'ai-summary' | 'mail-send'; warning: string }> = {
	crawling: {
		label: '기사 수집',
		api: 'crawling',
		warning: '언론사 기사를 지금 모읍니다. 분야가 없는 기사는 Claude로 분류해 비용이 조금 듭니다.',
	},
	summary: {
		label: 'AI 요약',
		api: 'ai-summary',
		warning: '관심사 6개의 뉴스레터를 지금 다시 만듭니다. Claude 비용이 들고, 오늘 것이 있으면 하나 더 생깁니다.',
	},
	mail: {
		label: '구독 메일',
		api: 'mail-send',
		warning: '모든 구독자에게 오늘 뉴스레터를 지금 보냅니다. 이미 보냈다면 같은 메일을 한 번 더 받습니다.',
	},
};

const STATUS_LABEL: Record<Exclude<RunStatus, null>, string> = {
	success: '성공',
	partial: '일부 실패',
	failed: '실패',
	skipped: '건너뜀',
};

/** 작업마다 언제 도는지: '08:00부터 3시간마다' · '매일 08:30' · '매주 월요일 08:40' */
const scheduleText = (job: JobKey, schedule: Schedule) =>
	job === 'crawling'
		? `${clock(schedule.crawl)}부터 3시간마다`
		: job === 'summary'
			? describe(schedule.summary)
			: describe(schedule.mail, schedule.mail.day);

/** 그날 받은 사람: 펼칠 때만 불러온다 */
function MailRecipients({ date, today }: { date: string; today: string }) {
	const { data, isPending, isError } = useQuery({
		queryKey: ['adminMailRecipients', date],
		queryFn: () =>
			apiFetch<{ data: { email: string; sentAt: string; categoryIds: number[] }[] }>(
				API_ENDPOINTS.ADMIN.MAIL_RECIPIENTS(date),
			).then((r) => r.data),
	});
	if (isPending) return <p className="recipients-state">불러오는 중…</p>;
	if (isError) return <p className="recipients-state">받은 사람을 불러오지 못했어요.</p>;
	if (data.length === 0) return <p className="recipients-state">기록이 없어요.</p>;
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
	// 고른 기간은 주소(?from=&to=)에. 상세 화면으로 같은 기간을 들고 간다
	const { today, from, to, periodQuery } = useAdminQuery();
	const [openDay, setOpenDay] = useState<string | null>(null);

	const { data, isPending, isError, refetch } = useQuery({
		queryKey: ['adminDashboard', from, to],
		queryFn: () =>
			apiFetch<{ data: DashboardData }>(`${API_ENDPOINTS.ADMIN.DASHBOARD()}?from=${from}&to=${to}`).then((r) => r.data),
		placeholderData: (previous) => previous,
		refetchInterval: (query) =>
			Object.values(query.state.data?.scheduler.runs ?? {}).some((run) => run.running) ? 5000 : 60000,
	});

	const refresh = () => queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });

	const editSchedule = () =>
		data &&
		openModal(
			<ScheduleEditor
				initial={data.scheduler.schedule}
				onCancel={closeModal}
				onSaved={() => {
					closeModal();
					showToast('예약 시간을 바꿨습니다. 다음 실행부터 적용돼요.', 'success');
					refresh();
				}}
			/>,
		);

	const toggle = async (job: JobKey, enable: boolean) => {
		try {
			await apiFetch(API_ENDPOINTS.ADMIN.TOGGLE(JOBS[job].api), {
				method: 'POST',
				body: { enable },
			});
			showToast(
				enable
					? `${JOBS[job].label}을 켰습니다.`
					: `${JOBS[job].label}을 껐습니다. 서버를 다시 시작하면 다시 켜집니다.`,
				'info',
			);
			refresh();
		} catch (error) {
			showToast(error instanceof ApiError ? error.message : '바꾸지 못했습니다.', 'error');
		}
	};

	const runNow = (job: JobKey) =>
		openModal(
			<ModalContents
				icon={<LuTriangleAlert />}
				title={`${JOBS[job].label}을 지금 실행할까요?`}
				content={JOBS[job].warning}
				outlineButton="취소"
				filledButton="지금 실행"
				onCancelClick={closeModal}
				onConfirmClick={async () => {
					closeModal();
					try {
						await apiFetch(API_ENDPOINTS.ADMIN.RUN_NOW(JOBS[job].api), { method: 'POST' });
						showToast(`${JOBS[job].label}을 시작했습니다.`, 'success');
						// 서버가 실행 기록을 남길 틈을 주고 새로 고친다
						setTimeout(refresh, 800);
					} catch (error) {
						showToast(error instanceof ApiError ? error.message : '시작하지 못했습니다.', 'error');
					}
				}}
			/>,
		);

	if (isPending) {
		return (
			<StyledDashboard aria-busy>
				<SkeletonBlock $height="14rem" $radius="8px" />
			</StyledDashboard>
		);
	}

	if (isError || !data) {
		return (
			<StyledDashboard>
				<Text size="small" color="subText">
					대시보드를 불러오지 못했습니다.{' '}
					<button type="button" className="retry" onClick={() => refetch()}>
						다시 시도
					</button>
				</Text>
			</StyledDashboard>
		);
	}

	const { scheduler, crawling, newsletters, summaryLogs, mail, aiCost } = data;
	const recipients = mail.byDay.reduce((sum, row) => sum + row.recipients, 0);
	const singleDay = from === to;
	const days = Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000) + 1;

	return (
		<StyledDashboard>
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
						<MoreLink href={`/admin/articles${periodQuery}`}>기사 보기 →</MoreLink>
					</div>
					<div>
						<dt>발행한 뉴스레터</dt>
						<dd>{newsletters.total.toLocaleString()}편</dd>
						<span className="sub">
							{singleDay
								? `관심사 6개 중 ${new Set(newsletters.items.map((n) => n.categoryId)).size}개`
								: `${days}일 · 하루 평균 ${(newsletters.total / days).toFixed(1)}편`}
						</span>
						<MoreLink href={`/admin/newsletters${periodQuery}`}>발행 목록 보기 →</MoreLink>
					</div>
					<div>
						<dt>AI 비용</dt>
						<dd>{usd(aiCost.total)}</dd>
						<span className="sub">
							{aiCost.unknown > 0 ? `비용 모르는 이전 기록 ${aiCost.unknown}건 제외` : `AI 호출 ${summaryLogs.total}건`}
						</span>
						<MoreLink href={`/admin/ai-logs${periodQuery}`}>AI 기록 보기 →</MoreLink>
					</div>
					<div>
						<dt>메일 받은 사람</dt>
						<dd>{recipients.toLocaleString()}명</dd>
						<span className="sub">구독 중 {mail.activeSubscribers.toLocaleString()}명</span>
						<MoreLink href={`/admin/mail${periodQuery}`}>발송 기록 보기 →</MoreLink>
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
					<MoreLink href={`/admin/job-runs${periodQuery}`}>
						실행 기록 보기 <LuArrowRight aria-hidden />
					</MoreLink>
				</div>
				{scheduler.autoRun === false && (
					<p className="auto-off" role="note">
						<LuInfo aria-hidden />
						<span>
							이 서버는 예약 시각에 저절로 돌지 않아요. 필요할 때 &lsquo;지금 실행&rsquo;으로 돌려 주세요.
							<code>SCHEDULER_ENABLED=false</code>
						</span>
					</p>
				)}
				<ul className="jobs">
					{(Object.keys(JOBS) as JobKey[]).map((job) => {
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
												: '아직 실행 기록이 없어요'}
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
								</div>
							</li>
						);
					})}
				</ul>
				<Text size="extraSmall" color="subText" className="note">
					켜기 · 끄기는 서버 메모리에만 있어 서버를 다시 시작하면 켜짐으로 돌아갑니다. 시간과 실행 기록은 남아요.
				</Text>
			</section>

			<div className="two">
				<section aria-labelledby="dash-newsletters">
					<div className="section-head">
						<Title as="h2" size="extraSmall" weight="bold" className="section-title">
							<span id="dash-newsletters">발행</span>
						</Title>
						<MoreLink href={`/admin/newsletters${periodQuery}`}>
							전체 {newsletters.total.toLocaleString()}편 보기 <LuArrowRight aria-hidden />
						</MoreLink>
					</div>
					{newsletters.items.length === 0 ? (
						<Text size="small" color="subText">
							이 기간에 발행한 뉴스레터가 없어요.
						</Text>
					) : (
						<ul className="list">
							{newsletters.items.map((n) => (
								<li key={n.id}>
									<span className="category">{mapIdToTitle([n.categoryId])[0]}</span>
									<a href={`/articles/detail/${n.id}`} className="title">
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
						<MoreLink href={`/admin/mail${periodQuery}`}>
							발송 기록 보기 <LuArrowRight aria-hidden />
						</MoreLink>
					</div>
					{mail.byDay.length === 0 ? (
						<Text size="small" color="subText">
							이 기간에 보낸 메일이 없어요.
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
					<MoreLink href={`/admin/ai-logs${periodQuery}`}>
						전체 {summaryLogs.total.toLocaleString()}건 보기 <LuArrowRight aria-hidden />
					</MoreLink>
				</div>
				{summaryLogs.items.length === 0 ? (
					<Text size="small" color="subText">
						이 기간에 기록이 없어요.
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
		</StyledDashboard>
	);
}

const StyledDashboard = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2.5rem;
	margin-top: 2rem;

	.retry {
		padding: 0;
		color: ${({ theme }) => theme.color.primary};
		text-decoration: underline;
		cursor: pointer;
	}

	.section-title {
		margin-bottom: 1rem;
	}

	/* 첫 칸 머리: 기간 이름 + 기간 고르기 */
	.section-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;

		/* 첫 칸(기간): 제목(괄호 속 날짜로 고르기) 왼쪽, 오늘 · 어제 · … 버튼은 오른쪽 끝 */
		&.period-head {
			gap: 0.5rem 1.25rem;
		}
		gap: 0.5rem 1rem;
		margin-bottom: 1rem;

		.section-title {
			margin-bottom: 0;
		}
	}

	.head-title {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	/* 섹션 머리 오른쪽: 상세 화면으로 */
	/* 오늘 숫자 세 칸 */
	.numbers {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		margin: 0;

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			grid-template-columns: repeat(2, 1fr);

			> div:nth-child(3) {
				border-left: none;
			}

			> div:nth-child(n + 3) {
				border-top: 1px solid ${({ theme }) => theme.color.border};
			}
		}
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			grid-template-columns: 1fr;
		}

		> div {
			display: flex;
			flex-direction: column;
			gap: 0.25rem;
			padding: 1.25rem 1.5rem;

			& + div {
				border-left: 1px solid ${({ theme }) => theme.color.border};

				@media ${({ theme }) => theme.mediaQuery.mobile} {
					border-left: none;
					border-top: 1px solid ${({ theme }) => theme.color.border};
				}
			}
		}

		dt {
			font-size: ${({ theme }) => theme.fontSize.small};
			color: ${({ theme }) => theme.color.subText};
		}

		dd {
			margin: 0;
			font-size: ${({ theme }) => theme.heading.extraSmall.fontSize};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			font-variant-numeric: tabular-nums;
		}

		.sub {
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			color: ${({ theme }) => theme.color.subText};
		}
	}

	/* 예약 작업 줄 */
	.jobs {
		margin: 0;
		padding: 0;
		border-top: 1px solid ${({ theme }) => theme.color.text};
	}

	.job {
		display: grid;
		grid-template-columns: auto 10rem 1fr auto;
		align-items: center;
		gap: 1rem;
		padding: 1rem 0;
		border-bottom: 1px solid ${({ theme }) => theme.color.border};

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			grid-template-columns: 1fr;
			gap: 0.625rem;
		}
	}

	.job-main {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;

		.job-name {
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		}

		.job-when {
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			color: ${({ theme }) => theme.color.subText};
		}
	}

	.job-run {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		min-width: 0;
	}

	/* 배지 글자(성공 · 건너뜀 · 기록 없음 · 일부 실패…) 길이와 상관없이 설명이 같은 자리에서 시작하게 */
	.job-run .job-badge {
		min-width: 4.75rem;
		text-align: center;
	}

	/* 예약 실행이 꺼진 서버 (보통 로컬) 안내 */
	.auto-off {
		display: flex;
		align-items: flex-start;
		gap: 0.375rem;
		margin: 0.5rem 0 0.75rem;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		line-height: 1.5;
		color: ${({ theme }) => theme.color.subText};

		svg {
			flex-shrink: 0;
			width: 0.875rem;
			height: 0.875rem;
			margin-top: 0.15em;
		}

		code {
			margin-left: 0.375rem;
			padding: 0.0625rem 0.375rem;
			border-radius: ${({ theme }) => theme.radius.chip};
			background: ${({ theme }) => theme.color.surface};
			font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
			font-size: 0.75rem;
			white-space: nowrap;
		}
	}

	.job-message {
		min-width: 0;
		font-size: ${({ theme }) => theme.fontSize.small};
		color: ${({ theme }) => theme.color.subText};
		word-break: keep-all;
	}

	.job-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	/* 켜짐 · 꺼짐 스위치 */
	.switch {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0;
		cursor: pointer;
		color: ${({ theme }) => theme.color.text};
		font-size: ${({ theme }) => theme.fontSize.small};

		.knob {
			position: relative;
			width: 2.25rem;
			height: 1.25rem;
			border-radius: ${({ theme }) => theme.radius.chip};
			background: ${({ theme }) => theme.color.disabled};
			transition: background-color 0.2s ease;

			&::after {
				position: absolute;
				top: 2px;
				left: 2px;
				width: calc(1.25rem - 4px);
				height: calc(1.25rem - 4px);
				border-radius: 50%;
				background: #ffffff;
				transition: transform 0.2s ease;
				content: '';
			}
		}

		&[aria-checked='true'] .knob {
			background: ${({ theme }) => theme.color.primary};

			&::after {
				transform: translateX(1rem);
			}
		}
	}

	.note {
		margin-top: 0.75rem;
	}

	.two {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2.5rem;

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			grid-template-columns: 1fr;
		}

		/* 줄바꿈 없는 제목이 칸을 밀어 화면이 옆으로 넘치지 않게 */
		> section {
			min-width: 0;
		}
	}

	/* 오늘 발행 · 발송 목록 */
	.list {
		margin: 0;
		padding: 0;
		border-top: 1px solid ${({ theme }) => theme.color.text};

		li {
			display: flex;
			align-items: baseline;
			gap: 0.75rem;
			padding: 0.75rem 0;
			border-bottom: 1px solid ${({ theme }) => theme.color.border};
			font-size: ${({ theme }) => theme.fontSize.small};
		}

		.category {
			flex-shrink: 0;
			width: 2.5rem;
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};
			color: ${({ theme }) => theme.color.primary};
		}

		.title {
			flex: 1;
			min-width: 0;
			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;
			color: ${({ theme }) => theme.color.text};
		}

		a.title:hover {
			text-decoration: underline;
		}

		.time {
			flex-shrink: 0;
			font-variant-numeric: tabular-nums;
			color: ${({ theme }) => theme.color.subText};
		}
	}

	/* 날짜별 발송: 줄을 누르면 받은 사람이 펼쳐진다 */
	.list .mail-day {
		display: block;
		padding: 0;
	}

	.day-toggle {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		width: 100%;
		padding: 0.75rem 0;
		font-size: inherit;
		text-align: left;
		cursor: pointer;

		.chevron {
			align-self: center;
			flex-shrink: 0;
			width: 1rem;
			height: 1rem;
			color: ${({ theme }) => theme.color.subText};
			transition: transform 0.2s ease;

			&.open {
				transform: rotate(180deg);
			}
		}

		&:hover .title {
			text-decoration: underline;
		}
	}

	.recipients,
	.recipients-state {
		margin: 0 0 0.75rem;
		padding: 0.5rem 0.75rem;
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.surface};
		font-size: ${({ theme }) => theme.fontSize.small};
		color: ${({ theme }) => theme.color.subText};
	}

	.recipients li {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		padding: 0.375rem 0;
		border-bottom: none;

		& + li {
			border-top: 1px solid ${({ theme }) => theme.color.border};
		}

		.email {
			flex: 1;
			min-width: 0;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			color: ${({ theme }) => theme.color.text};
		}

		.cats {
			flex-shrink: 0;
			color: ${({ theme }) => theme.color.primary};
		}

		.time {
			flex-shrink: 0;
			font-variant-numeric: tabular-nums;
		}
	}

	/* AI 기록 표: 좁은 화면은 표만 옆으로 넘긴다 */
	.table-wrap {
		overflow-x: auto;
	}

	table {
		width: 100%;
		min-width: 50rem;
		border-collapse: collapse;
		font-size: ${({ theme }) => theme.fontSize.small};
	}

	th,
	td {
		padding: 0.625rem 0.75rem 0.625rem 0;
		border-bottom: 1px solid ${({ theme }) => theme.color.border};
		text-align: left;
		vertical-align: top;
	}

	/* 표 머리: 선 · 배경 없이 글자만 본문색으로 굵게 */
	th {
		white-space: nowrap;
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		color: ${({ theme }) => theme.color.text};
	}

	.nowrap {
		white-space: nowrap;
	}

	.num {
		font-variant-numeric: tabular-nums;
	}

	/* 대시보드는 요약이라 내용은 한 줄만 (전체는 AI 기록 상세에서) */
	.content {
		width: 100%;
		max-width: 0;
		min-width: 16rem;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		color: ${({ theme }) => theme.color.subText};
		word-break: keep-all;
	}
`;
