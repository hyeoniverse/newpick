'use client';

import { ADMIN } from '@/copy';
import { fetchAiLogs } from '@/api/admin';
import { queryKeys } from '@/api/queryKeys';
import { useMemo } from 'react';
import FilterChips from '@/components/common/FilterChips';
import { useToggleSet } from '@/hooks/useToggleSet';
import { AdminListPagination, AdminListState, useAdminList } from './AdminList';
import AdminSubPage from './AdminSubPage';
import { useSortQuery } from './HeaderFilter';
import { useAdminQuery } from './period';
import { usd } from '../_lib/format';
import { chainGroups, groupAttempts } from '../_lib/aiLogs';
import AiLogCards from './aiLogs/AiLogCards';
import AiLogsTable from './aiLogs/AiLogsTable';
import { useRerun } from './aiLogs/useRerun';

const TYPES = [
	{ value: '', label: '전체' },
	{ value: 'summarization', label: '요약' },
	{ value: 'category', label: '분류' },
	{ value: 'edition', label: '편집' },
];
const STATUSES = [
	{ value: '', label: '전체' },
	{ value: 'success', label: '성공' },
	{ value: 'error', label: '실패' },
];

/**
 * 관리자 상세: AI 기록 (종류 · 결과로 거르기, 그 조건의 비용 합계, 쪽).
 * 이 파일은 조립만 (#198): 묶음 계산 _lib/aiLogs, 다시 생성 useRerun, 표 AiLogsTable(데스크톱) · 카드 AiLogCards(휴대폰)
 */
export default function AiLogsList() {
	const { set, get, today } = useAdminQuery();
	const rerun = useRerun();
	const type = get('type');
	const status = get('status');
	const sortQuery = useSortQuery();
	const list = useAdminList({
		queryKey: queryKeys.admin.aiLogs.list,
		fetch: fetchAiLogs,
		params: { type, status },
		sort: true,
	});
	const { data } = list;

	// 기본 정렬(최신순)일 때 같은 묶음의 시도를 붙여 놓는다 (묶음 자리는 가장 최근 시도 자리)
	const rows = useMemo(
		() => (data ? (Object.keys(sortQuery).length ? data.items : groupAttempts(data.items)) : []),
		[data, sortQuery],
	);
	const groups = useMemo(() => chainGroups(rows), [rows]);
	// 내용은 두 줄까지만, 누르면 펼친다 (펼친 기록 id)
	const { set: open, toggle } = useToggleSet<number>();
	const isOpen = (id: number) => open.has(id);

	return (
		<AdminSubPage
			title="AI 기록"
			summary={
				data &&
				`${data.total.toLocaleString()}건 · 비용 ${usd(data.cost.total)}${data.cost.unknown ? ` (비용 모르는 이전 기록 ${data.cost.unknown}건 제외)` : ''}`
			}
			filters={
				<>
					<FilterChips label="종류" options={TYPES} value={type} onChange={(v) => set({ type: v })} />
					<FilterChips label="결과" options={STATUSES} value={status} onChange={(v) => set({ status: v })} />
				</>
			}
		>
			<AdminListState list={list} empty={ADMIN.empty.logs}>
				{() => (
					<AiLogsTable
						rows={rows}
						today={today}
						type={type}
						status={status}
						types={TYPES}
						statuses={STATUSES}
						onFilter={set}
						isOpen={isOpen}
						onToggle={toggle}
						onRerun={rerun}
					/>
				)}
			</AdminListState>
			{data && data.items.length > 0 && (
				<AiLogCards groups={groups} today={today} isOpen={isOpen} onToggle={toggle} onRerun={rerun} />
			)}
			<AdminListPagination list={list} />
		</AdminSubPage>
	);
}
