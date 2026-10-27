'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import { LuPlay, LuTriangleAlert } from 'react-icons/lu';
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

type JobKey = 'crawling' | 'summary' | 'mail';
type RunStatus = 'success' | 'partial' | 'failed' | 'skipped' | null;

interface JobRun {
	running: boolean;
	startedAt: string | null;
	finishedAt: string | null;
	status: RunStatus;
	message: string | null;
}

interface DashboardData {
	today: string;
	scheduler: {
		enabled: Record<JobKey, boolean>;
		mailSchedule: { hour: number; day: number };
		runs: Record<JobKey, JobRun>;
	};
	crawling: { today: number; latestAt: string | null };
	newsletters: { id: number; title: string; categoryId: number; createdAt: string }[];
	aiCost: { today: number; week: number };
	summaryLogs: {
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
	mail: { activeSubscribers: number; byDay: { day: string; recipients: number }[] };
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** 달러: 1센트 미만은 소수 넷째 자리까지 */
const usd = (value: number | null) =>
	value === null ? '-' : `$${value < 0.01 && value > 0 ? value.toFixed(4) : value.toFixed(2)}`;

const PROCESS_LABEL: Record<string, string> = { summarization: '요약', category: '분류', edition: '편집' };

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

/** 'YYYY-MM-DD'면 오늘은 시각만, 아니면 날짜와 시각 (KST) */
function when(iso: string | null, today: string) {
	if (!iso) return '-';
	const date = new Date(iso);
	const day = date.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
	const time = date.toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit' });
	return day === today ? time : `${day.slice(5)} ${time}`;
}

const schedule = (job: JobKey, mail: { hour: number; day: number }) => {
	if (job === 'crawling') return '매일 08:00';
	if (job === 'summary') return '매일 08:30';
	const at = `${String(mail.hour).padStart(2, '0')}:40`;
	return mail.day === 7 ? `매일 ${at}` : `매주 ${DAYS[mail.day]}요일 ${at}`;
};

/**
 * 관리자 대시보드 (#21): 오늘 아침 작업이 제대로 돌았는지 서버에 접속하지 않고 본다.
 * 진행 중인 작업이 있으면 5초마다, 아니면 1분마다 새로 고친다
 */
export default function Dashboard() {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const { openModal, closeModal } = useModal();

	const { data, isPending, isError, refetch } = useQuery({
		queryKey: ['adminDashboard'],
		queryFn: () => apiFetch<{ data: DashboardData }>(API_ENDPOINTS.ADMIN.DASHBOARD()).then((r) => r.data),
		refetchInterval: (query) =>
			Object.values(query.state.data?.scheduler.runs ?? {}).some((run) => run.running) ? 5000 : 60000,
	});

	const refresh = () => queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });

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

	const { scheduler, crawling, newsletters, summaryLogs, mail, today, aiCost } = data;
	const sentToday = mail.byDay.find((row) => row.day === today)?.recipients ?? 0;

	return (
		<StyledDashboard>
			<section aria-labelledby="dash-today">
				<Title as="h2" size="extraSmall" weight="bold" className="section-title">
					<span id="dash-today">오늘 ({today})</span>
				</Title>
				<dl className="numbers">
					<div>
						<dt>수집한 기사</dt>
						<dd>{crawling.today.toLocaleString()}건</dd>
						<span className="sub">마지막 {when(crawling.latestAt, today)}</span>
					</div>
					<div>
						<dt>발행한 뉴스레터</dt>
						<dd>{newsletters.length}편</dd>
						<span className="sub">관심사 6개 중 {new Set(newsletters.map((n) => n.categoryId)).size}개</span>
					</div>
					<div>
						<dt>AI 비용</dt>
						<dd>{usd(aiCost.today)}</dd>
						<span className="sub">최근 7일 {usd(aiCost.week)}</span>
					</div>
					<div>
						<dt>메일 받은 사람</dt>
						<dd>{sentToday.toLocaleString()}명</dd>
						<span className="sub">구독 중 {mail.activeSubscribers.toLocaleString()}명</span>
					</div>
				</dl>
			</section>

			<section aria-labelledby="dash-jobs">
				<Title as="h2" size="extraSmall" weight="bold" className="section-title">
					<span id="dash-jobs">예약 작업</span>
				</Title>
				<ul className="jobs">
					{(Object.keys(JOBS) as JobKey[]).map((job) => {
						const run = scheduler.runs[job];
						const enabled = scheduler.enabled[job];
						const state = run.running ? 'running' : (run.status ?? 'none');
						return (
							<li key={job} className="job">
								<div className="job-main">
									<span className="job-name">{JOBS[job].label}</span>
									<span className="job-when">{schedule(job, scheduler.mailSchedule)}</span>
								</div>
								<div className="job-run">
									<span className={`badge ${state}`}>
										{run.running ? '진행 중' : run.status ? STATUS_LABEL[run.status] : '기록 없음'}
									</span>
									<span className="job-message">
										{run.running
											? `${when(run.startedAt, today)} 시작`
											: run.finishedAt
												? `${when(run.finishedAt, today)} · ${run.message}`
												: '서버가 시작된 뒤 아직 돌지 않았어요'}
									</span>
								</div>
								<div className="job-actions">
									<button
										type="button"
										role="switch"
										aria-checked={enabled}
										aria-label={`${JOBS[job].label} 예약 실행`}
										className="switch"
										onClick={() => toggle(job, !enabled)}
									>
										<span className="knob" aria-hidden />
										<span className="switch-text">{enabled ? '켜짐' : '꺼짐'}</span>
									</button>
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
					켜기 · 끄기와 실행 기록은 서버 메모리에만 있어, 서버를 다시 시작하면 모두 켜짐 · 기록 없음으로 돌아갑니다.
				</Text>
			</section>

			<div className="two">
				<section aria-labelledby="dash-newsletters">
					<Title as="h2" size="extraSmall" weight="bold" className="section-title">
						<span id="dash-newsletters">오늘 발행</span>
					</Title>
					{newsletters.length === 0 ? (
						<Text size="small" color="subText">
							오늘 발행한 뉴스레터가 아직 없어요.
						</Text>
					) : (
						<ul className="list">
							{newsletters.map((n) => (
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
					<Title as="h2" size="extraSmall" weight="bold" className="section-title">
						<span id="dash-mail">최근 7일 발송</span>
					</Title>
					{mail.byDay.length === 0 ? (
						<Text size="small" color="subText">
							최근 7일 동안 보낸 메일이 없어요.
						</Text>
					) : (
						<ul className="list">
							{mail.byDay.map((row) => (
								<li key={row.day}>
									<span className="title">{row.day}</span>
									<span className="time">{row.recipients.toLocaleString()}명</span>
								</li>
							))}
						</ul>
					)}
				</section>
			</div>

			<section aria-labelledby="dash-logs">
				<Title as="h2" size="extraSmall" weight="bold" className="section-title">
					<span id="dash-logs">최근 AI 기록</span>
				</Title>
				{summaryLogs.length === 0 ? (
					<Text size="small" color="subText">
						아직 기록이 없어요.
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
								{summaryLogs.map((log) => (
									<tr key={log.id}>
										<td className="nowrap">{when(log.createdAt, today)}</td>
										<td className="nowrap" title={log.model ?? undefined}>
											{PROCESS_LABEL[log.processType] ?? log.processType}
										</td>
										<td className="nowrap">
											<span className={`badge ${log.status === 'success' ? 'success' : 'failed'}`}>
												{log.status === 'success' ? '성공' : '실패'}
											</span>
										</td>
										<td className="nowrap num">{log.duration.toFixed(1)}초</td>
										<td className="nowrap num">
											{log.inputTokens || log.outputTokens
												? `${log.inputTokens.toLocaleString()} / ${log.outputTokens.toLocaleString()}`
												: log.token.toLocaleString()}
										</td>
										<td className="nowrap num">{usd(log.costUsd)}</td>
										<td className="content">{log.error ?? log.result}</td>
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
		grid-template-columns: 10rem 1fr auto;
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

	.badge {
		flex-shrink: 0;
		padding: 0.125rem 0.5rem;
		border-radius: ${({ theme }) => theme.radius.chip};
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		white-space: nowrap;
		background: ${({ theme }) => theme.color.neutral};
		color: ${({ theme }) => theme.color.subText};

		&.success {
			background: ${({ theme }) => theme.color.tertiary};
			color: ${({ theme }) => theme.color.primary};
		}

		&.partial,
		&.running {
			background: color-mix(in srgb, ${({ theme }) => theme.color.warning} 20%, transparent);
			color: ${({ theme }) => theme.color.text};
		}

		&.failed {
			background: color-mix(in srgb, ${({ theme }) => theme.color.error} 14%, transparent);
			color: ${({ theme }) => theme.color.error};
		}
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

		.switch-text {
			min-width: 2rem;
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

	/* AI 기록 표: 좁은 화면은 표만 옆으로 넘긴다 */
	.table-wrap {
		overflow-x: auto;
		border-top: 1px solid ${({ theme }) => theme.color.text};
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

	th {
		white-space: nowrap;
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		color: ${({ theme }) => theme.color.subText};
	}

	.nowrap {
		white-space: nowrap;
	}

	.num {
		font-variant-numeric: tabular-nums;
	}

	.content {
		min-width: 22rem;
		color: ${({ theme }) => theme.color.subText};
		word-break: keep-all;
	}
`;
