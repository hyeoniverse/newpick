'use client';

import { ACTIONS, ADMIN } from '@/copy';
import Text from '@/components/common/Text';
import { SkeletonBlock } from '@/components/common/loader/Skeleton';
import AiLogSummary from './dashboard/AiLogSummary';
import JobsTable from './dashboard/JobsTable';
import MailSummary from './dashboard/MailSummary';
import NewsletterSummary from './dashboard/NewsletterSummary';
import TodaySummary from './dashboard/TodaySummary';
import { useDashboard } from './dashboard/useDashboard';
import { useJobActions } from './dashboard/useJobActions';

/**
 * 관리자 대시보드 (#21): 오늘 아침 작업이 제대로 돌았는지 서버에 접속하지 않고 본다.
 * 진행 중인 작업이 있으면 5초마다, 아니면 1분마다 새로 고친다
 *
 * 이 파일은 조립만 (#198): 데이터 useDashboard · 작업 조작 useJobActions, 구역은 dashboard/의
 * TodaySummary · JobsTable · NewsletterSummary · MailSummary · AiLogSummary
 */
export default function Dashboard() {
	const { data, isPending, isError, refetch, refresh } = useDashboard();
	const actions = useJobActions(data?.scheduler.schedule, refresh);

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
					{ADMIN.dashboardLoadFailed}{' '}
					<button type="button" className="retry" onClick={() => refetch()}>
						{ACTIONS.retry}
					</button>
				</Text>
			</div>
		);
	}

	return (
		<div className="np-admin-dashboard-dashboard">
			<TodaySummary data={data} />
			<JobsTable scheduler={data.scheduler} actions={actions} />
			<div className="two">
				<NewsletterSummary newsletters={data.newsletters} />
				<MailSummary mail={data.mail} />
			</div>
			<AiLogSummary summaryLogs={data.summaryLogs} />
		</div>
	);
}
