'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchDashboard } from '@/api/admin';
import { queryKeys } from '@/api/queryKeys';
import { useAdminQuery } from '../period';

/**
 * 대시보드 요약 (#21, #198): 주소의 기간(?from=&to=)으로 받는다.
 * 진행 중인 작업이 있으면 5초마다, 아니면 1분마다 새로 받는다. refresh: 작업을 바꾼 뒤 모든 기간을 새로
 */
export function useDashboard() {
	const queryClient = useQueryClient();
	const { from, to } = useAdminQuery();
	const query = useQuery({
		queryKey: queryKeys.admin.dashboard.range(from, to),
		queryFn: () => fetchDashboard(from, to),
		placeholderData: (previous) => previous,
		refetchInterval: (q) =>
			Object.values(q.state.data?.scheduler.runs ?? {}).some((run) => run.running) ? 5000 : 60000,
	});
	const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard.all });
	return { ...query, refresh };
}
