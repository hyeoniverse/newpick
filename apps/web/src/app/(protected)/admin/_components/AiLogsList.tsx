'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/api/client';
import API_ENDPOINTS from '@/constants/api';
import Pagination from '@/components/common/Pagination';
import FilterChips from '@/components/common/FilterChips';
import AdminSubPage, { Cols } from './AdminSubPage';
import { HeaderSelect } from '@/components/common/TableHeader';
import { PeriodHeaderFilter, SortHeader, useSortQuery } from './HeaderFilter';
import { useAdminQuery } from './period';
import { PROCESS_LABEL, usd, when } from './format';
import StatusBadge, { toneOf } from '@/components/common/StatusBadge';

const PAGE_SIZE = 20;

interface Row {
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
}

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

/** 관리자 상세: AI 기록 (종류 · 결과로 거르기, 그 조건의 비용 합계, 쪽) */
export default function AiLogsList() {
	const { from, to, page, set, get, today } = useAdminQuery();
	const type = get('type');
	const status = get('status');
	const sortQuery = useSortQuery();
	const query = new URLSearchParams({ from, to, limit: String(PAGE_SIZE), offset: String((page - 1) * PAGE_SIZE) });
	if (type) query.set('type', type);
	if (status) query.set('status', status);
	for (const [key, value] of Object.entries(sortQuery)) query.set(key, value);

	const { data, isPending, isError } = useQuery({
		queryKey: ['adminAiLogs', query.toString()],
		queryFn: () =>
			apiFetch<{ data: { items: Row[]; total: number; cost: { total: number; unknown: number } } }>(
				API_ENDPOINTS.ADMIN.LIST('ai-logs', query.toString()),
			).then((r) => r.data),
		placeholderData: (previous) => previous,
	});

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
			{isPending ? (
				<p className="state">불러오는 중…</p>
			) : isError ? (
				<p className="state">불러오지 못했어요.</p>
			) : data.items.length === 0 ? (
				<p className="state">이 조건의 기록이 없어요.</p>
			) : (
				<div className="table-wrap">
					<table className="wide">
						<Cols widths={['9.5rem', '4rem', '4.5rem', '6rem', '6.5rem', '8rem', '4.5rem', undefined]} />
						<thead>
							<tr>
								{/* 위 거르기와 같은 조건을 표 머리에서도 */}
								<th scope="col">
									<PeriodHeaderFilter label="시각" />
								</th>
								<th scope="col">
									<HeaderSelect label="종류" value={type} options={TYPES} onChange={(v) => set({ type: v || null })} />
								</th>
								<th scope="col">
									<HeaderSelect
										label="결과"
										value={status}
										options={STATUSES}
										onChange={(v) => set({ status: v || null })}
									/>
								</th>
								<th scope="col">모델</th>
								<th scope="col">
									<SortHeader label="걸린 시간" field="duration" />
								</th>
								<th scope="col">
									<SortHeader label="토큰" field="token" />
								</th>
								<th scope="col">
									<SortHeader label="비용" field="costUsd" />
								</th>
								<th scope="col">내용</th>
							</tr>
						</thead>
						<tbody>
							{data.items.map((log) => (
								<tr key={log.id}>
									<td className="nowrap num">{when(log.createdAt, today)}</td>
									<td className="nowrap">{PROCESS_LABEL[log.processType] ?? log.processType}</td>
									<td className="nowrap">
										<StatusBadge tone={toneOf(log.status)}>{log.status === 'success' ? '성공' : '실패'}</StatusBadge>
									</td>
									<td className="nowrap">{log.model?.replace(/claude-/g, '') ?? '-'}</td>
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
			{data && (
				<Pagination
					className="pagination"
					page={page}
					total={data.total}
					pageSize={PAGE_SIZE}
					onChange={(next) => set({ page: next })}
				/>
			)}
		</AdminSubPage>
	);
}
