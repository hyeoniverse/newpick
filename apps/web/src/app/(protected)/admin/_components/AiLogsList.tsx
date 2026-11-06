'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
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
	/** 요약한 분야 (이전 기록은 없음) */
	category: string | null;
	/** 같은 분야 시도 묶음 (12시간 안에 이어진 다시 시도): n번째 시도 / 모두 total번, 묶음이 어떻게 끝났는지, 묶음 열쇠 */
	attempt: { n: number; total: number; outcome: string; chain: number } | null;
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

	// 기본 정렬(최신순)일 때 같은 묶음의 시도를 붙여 놓는다 (묶음 자리는 가장 최근 시도 자리)
	const rows = useMemo(
		() => (data ? (Object.keys(sortQuery).length ? data.items : groupAttempts(data.items)) : []),
		[data, sortQuery],
	);

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
				<Chains className="table-wrap">
					<table className="wide">
						<Cols widths={['8.5rem', '3.5rem', '3.5rem', '6.5rem', '6.5rem', '5rem', '7.5rem', '4rem', undefined]} />
						<thead>
							<tr>
								{/* 위 거르기와 같은 조건을 표 머리에서도 */}
								<th scope="col">
									<PeriodHeaderFilter label="시각" />
								</th>
								<th scope="col">분야</th>
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
							{rows.map((log, i) => {
								const chained = !!log.attempt && log.attempt.total > 1;
								const continues = chained && rows[i + 1]?.attempt?.chain === log.attempt!.chain;
								return (
									<tr key={log.id} className={chained ? (continues ? 'chain' : 'chain chain-end') : undefined}>
										<td className="nowrap num">{when(log.createdAt, today)}</td>
										<td className="nowrap">{log.category ?? '-'}</td>
										<td className="nowrap">{PROCESS_LABEL[log.processType] ?? log.processType}</td>
										<td>
											<Result log={log} />
										</td>
										<td className="model">{log.model?.replace(/claude-/g, '').replace(/,\s*/g, ', ') ?? '-'}</td>
										<td className="nowrap num">{log.duration.toFixed(1)}초</td>
										<td className="nowrap num">
											{log.inputTokens || log.outputTokens
												? `${log.inputTokens.toLocaleString()} / ${log.outputTokens.toLocaleString()}`
												: log.token.toLocaleString()}
										</td>
										<td className="nowrap num">{usd(log.costUsd)}</td>
										<td className="content">{log.error ?? log.result}</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</Chains>
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

/** 같은 묶음(다시 시도)의 기록을 붙여 놓는다. 묶음 자리는 가장 최근 시도가 있던 자리, 묶음 안은 최신순 그대로 */
function groupAttempts(items: Row[]) {
	const placed = new Set<number>();
	const out: Row[] = [];
	for (const item of items) {
		const chain = item.attempt && item.attempt.total > 1 ? item.attempt.chain : null;
		if (chain === null) {
			out.push(item);
			continue;
		}
		if (placed.has(chain)) continue;
		placed.add(chain);
		out.push(...items.filter((other) => other.attempt?.chain === chain));
	}
	return out;
}

/** 결과 칸: 다시 시도가 있으면 'N차 실패 · 성공', 앞선 시도에는 묶음이 어떻게 끝났는지 */
function Result({ log }: { log: Row }) {
	const label = log.status === 'success' ? '성공' : '실패';
	const attempt = log.attempt;
	if (!attempt || attempt.total === 1) return <StatusBadge tone={toneOf(log.status)}>{label}</StatusBadge>;
	return (
		<Badges>
			<StatusBadge tone={toneOf(log.status)}>
				{attempt.n}차 {label}
			</StatusBadge>
			{attempt.n < attempt.total && (
				<span className="then">
					→ {attempt.total}차 {attempt.outcome === 'success' ? '성공' : '실패'}
				</span>
			)}
		</Badges>
	);
}

const Badges = styled.span`
	display: inline-flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 0.25rem;

	.then {
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.subText};
		white-space: nowrap;
	}
`;

/** 같은 묶음의 줄: 첫 칸 왼쪽에 실선으로 잇고, 줄 사이 구분선은 묶음 마지막 줄 아래에만 */
const Chains = styled.div`
	/* 고정 칸이 많아 내용 칸이 좁아지지 않게: 본문 폭(64rem)보다 좁은 화면에서는 표 안에서 가로 스크롤 */
	table.wide {
		min-width: 64rem;
	}

	td.model {
		overflow-wrap: anywhere;
	}

	tr.chain > td:first-child {
		box-shadow: inset 3px 0 0 ${({ theme }) => theme.color.primary};
		padding-left: 0.75rem;
	}

	tr.chain:not(.chain-end) > td {
		border-bottom-color: transparent;
	}
`;
