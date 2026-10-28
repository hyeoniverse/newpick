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
import { when } from './format';
import StatusBadge, { toneOf } from '@/components/common/StatusBadge';

const PAGE_SIZE = 20;

interface Row {
	id: number;
	job: 'crawling' | 'summary' | 'mail';
	trigger: 'schedule' | 'manual';
	status: 'running' | 'success' | 'partial' | 'failed' | 'skipped';
	message: string | null;
	startedAt: string;
	finishedAt: string | null;
	durationMs: number | null;
}

const JOB_LABEL: Record<Row['job'], string> = { crawling: '기사 수집', summary: 'AI 요약', mail: '구독 메일' };
const STATUS_LABEL: Record<Row['status'], string> = {
	running: '진행 중',
	success: '성공',
	partial: '일부 실패',
	failed: '실패',
	skipped: '건너뜀',
};

const JOBS = [{ value: '', label: '전체' }, ...Object.entries(JOB_LABEL).map(([value, label]) => ({ value, label }))];
const STATUSES = [
	{ value: '', label: '전체' },
	...(['success', 'partial', 'failed', 'skipped', 'running'] as const).map((value) => ({
		value,
		label: STATUS_LABEL[value],
	})),
];

/** 걸린 시간: 1분 넘으면 '2분 13초' */
const duration = (ms: number | null) => {
	if (ms === null) return '-';
	const seconds = Math.round(ms / 1000);
	return seconds >= 60 ? `${Math.floor(seconds / 60)}분 ${seconds % 60}초` : `${(ms / 1000).toFixed(1)}초`;
};

/** 관리자 상세: 예약 작업 실행 기록 (작업 · 결과로 거르기, 쪽) */
export default function JobRunsList() {
	const { from, to, page, set, get, today } = useAdminQuery();
	const job = get('job');
	const status = get('status');
	const sortQuery = useSortQuery();
	const query = new URLSearchParams({ from, to, limit: String(PAGE_SIZE), offset: String((page - 1) * PAGE_SIZE) });
	if (job) query.set('job', job);
	if (status) query.set('status', status);
	for (const [key, value] of Object.entries(sortQuery)) query.set(key, value);

	const { data, isPending, isError } = useQuery({
		queryKey: ['adminJobRuns', query.toString()],
		queryFn: () =>
			apiFetch<{ data: { items: Row[]; total: number } }>(API_ENDPOINTS.ADMIN.LIST('job-runs', query.toString())).then(
				(r) => r.data,
			),
		placeholderData: (previous) => previous,
	});

	return (
		<AdminSubPage
			title="예약 작업 실행 기록"
			summary={data && `${data.total.toLocaleString()}건`}
			filters={
				<>
					<FilterChips label="작업" options={JOBS} value={job} onChange={(v) => set({ job: v })} />
					<FilterChips label="결과" options={STATUSES} value={status} onChange={(v) => set({ status: v })} />
				</>
			}
		>
			{isPending ? (
				<p className="state">불러오는 중…</p>
			) : isError ? (
				<p className="state">불러오지 못했어요.</p>
			) : data.items.length === 0 ? (
				<p className="state">이 조건의 실행 기록이 없어요.</p>
			) : (
				<div className="table-wrap">
					<table>
						<Cols widths={['10rem', '6.5rem', '5rem', '6rem', '6.5rem', undefined]} />
						<thead>
							<tr>
								{/* 위 거르기와 같은 조건을 표 머리에서도 */}
								<th scope="col">
									<PeriodHeaderFilter label="시작" />
								</th>
								<th scope="col">
									<HeaderSelect label="작업" value={job} options={JOBS} onChange={(v) => set({ job: v || null })} />
								</th>
								<th scope="col">실행</th>
								<th scope="col">
									<HeaderSelect
										label="결과"
										value={status}
										options={STATUSES}
										onChange={(v) => set({ status: v || null })}
									/>
								</th>
								<th scope="col">
									<SortHeader label="걸린 시간" field="durationMs" />
								</th>
								<th scope="col">내용</th>
							</tr>
						</thead>
						<tbody>
							{data.items.map((run) => (
								<tr key={run.id}>
									<td className="nowrap num">{when(run.startedAt, today)}</td>
									<td className="nowrap">{JOB_LABEL[run.job] ?? run.job}</td>
									<td className="nowrap">{run.trigger === 'manual' ? '지금 실행' : '예약'}</td>
									<td className="nowrap">
										<StatusBadge tone={toneOf(run.status)}>{STATUS_LABEL[run.status] ?? run.status}</StatusBadge>
									</td>
									<td className="nowrap num">{duration(run.durationMs)}</td>
									<td className="content">{run.message ?? '-'}</td>
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
