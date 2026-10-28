'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/api/client';
import API_ENDPOINTS from '@/constants/api';
import { CATEGORY_OPTIONS } from '@/constants/categories';
import { mapIdToTitle } from '@/utils/mapInterests';
import FilterChips from '@/components/common/FilterChips';
import Pagination from '@/components/common/Pagination';
import StatusBadge from '@/components/common/StatusBadge';
import AdminSubPage, { Cols } from './AdminSubPage';
import { useAdminQuery } from './period';
import { when } from './format';
import { StyledActions, SUBSCRIPTION_LABEL, subscriptionTone } from './UsersAdmin';

const PAGE_SIZE = 20;

interface Row {
	id: number;
	status: string;
	startedAt: string;
	endAt: string | null;
	userId: number;
	email: string;
	username: string | null;
	interests: number[];
}

/**
 * 관리자 CMS (#31): 구독자. 구독 상태(구독 중 · 일시 정지 · 해지) · 관심사 · 이메일로 찾고,
 * 상태 칩에 상태별 전체 수를 함께 보여 준다
 */
export default function SubscribersAdmin() {
	const { page, set, get, today } = useAdminQuery();
	const status = get('status');
	const categoryId = get('categoryId');
	const q = get('q');
	const [input, setInput] = useState(q);
	useEffect(() => setInput(q), [q]);

	const query = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String((page - 1) * PAGE_SIZE) });
	if (status) query.set('status', status);
	if (categoryId) query.set('categoryId', categoryId);
	if (q) query.set('q', q);

	const { data, isPending, isError } = useQuery({
		queryKey: ['adminSubscribers', query.toString()],
		queryFn: () =>
			apiFetch<{ data: { items: Row[]; total: number; byStatus: Record<string, number> } }>(
				API_ENDPOINTS.ADMIN.SUBSCRIBERS(query.toString()),
			).then((r) => r.data),
		placeholderData: (previous) => previous,
	});

	const count = (key: string) => (data ? ` ${data.byStatus[key] ?? 0}` : '');
	const statuses = [
		{ value: '', label: '전체' },
		...(['active', 'paused', 'cancelled'] as const).map((value) => ({
			value,
			label: `${SUBSCRIPTION_LABEL[value]}${count(value)}`,
		})),
	];

	return (
		<AdminSubPage
			title="구독자"
			period={false}
			summary={data && `${data.total.toLocaleString()}명`}
			filters={
				<>
					<FilterChips label="상태" options={statuses} value={status} onChange={(v) => set({ status: v || null })} />
					<FilterChips
						label="관심사"
						options={CATEGORY_OPTIONS}
						value={categoryId}
						onChange={(v) => set({ categoryId: v || null })}
					/>
					<form
						role="search"
						className="searches"
						onSubmit={(event) => {
							event.preventDefault();
							set({ q: input.trim() || null });
						}}
					>
						<span className="chips-label">찾기</span>
						<input
							type="search"
							className="search"
							value={input}
							onChange={(event) => setInput(event.target.value)}
							placeholder="이메일 · 이름 일부"
							aria-label="이메일 · 이름으로 찾기"
							maxLength={100}
						/>
					</form>
				</>
			}
		>
			<StyledActions>
				{isPending ? (
					<p className="state">불러오는 중…</p>
				) : isError ? (
					<p className="state">불러오지 못했어요.</p>
				) : data.items.length === 0 ? (
					<p className="state">이 조건의 구독자가 없어요.</p>
				) : (
					<div className="table-wrap">
						<table>
							<Cols widths={[undefined, '8rem', '7rem', '12rem', '9rem', '9rem']} />
							<thead>
								<tr>
									<th scope="col">이메일</th>
									<th scope="col">이름</th>
									<th scope="col">상태</th>
									<th scope="col">관심사</th>
									<th scope="col">시작</th>
									<th scope="col">해지</th>
								</tr>
							</thead>
							<tbody>
								{data.items.map((row) => (
									<tr key={row.id}>
										<td>{row.email}</td>
										<td>{row.username ?? '-'}</td>
										<td>
											<StatusBadge tone={subscriptionTone(row.status)}>
												{SUBSCRIPTION_LABEL[row.status] ?? row.status}
											</StatusBadge>
										</td>
										<td className="category">{mapIdToTitle(row.interests).join(' · ') || '-'}</td>
										<td className="nowrap num">{when(row.startedAt, today)}</td>
										<td className="nowrap num">{row.endAt ? when(row.endAt, today) : '-'}</td>
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
			</StyledActions>
		</AdminSubPage>
	);
}
