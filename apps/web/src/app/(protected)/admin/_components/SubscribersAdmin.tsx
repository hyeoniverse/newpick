'use client';

import { ADMIN } from '@/copy';
import { fetchSubscribers } from '@/api/admin';
import { queryKeys } from '@/api/queryKeys';

import { CATEGORY_OPTIONS } from '@/constants/categories';
import { mapIdToTitle } from '@/utils/mapInterests';
import FilterChips from '@/components/common/FilterChips';
import StatusBadge from '@/components/common/StatusBadge';
import { AdminListPagination, AdminListState, useAdminList } from './AdminList';
import AdminSubPage, { Cols, tableMinWidth } from './AdminSubPage';
import { useAdminQuery } from './period';
import AdminSearchField from './AdminSearchField';
import { when } from '../_lib/format';
import { AdminActions, SUBSCRIPTION_LABEL, subscriptionTone } from './UsersAdmin';

/** 표 칸 폭 (정하지 않은 칸은 나머지) */
const COLS = [undefined, '8rem', '7rem', '12rem', '9rem', '9rem'];

/**
 * 관리자 CMS (#31): 구독자. 구독 상태(구독 중 · 일시 정지 · 해지) · 관심사 · 이메일로 찾고,
 * 상태 칩에 상태별 전체 수를 함께 보여 준다
 */
export default function SubscribersAdmin() {
	const { set, get, today } = useAdminQuery();
	const status = get('status');
	const categoryId = get('categoryId');
	const q = get('q');

	const list = useAdminList({
		queryKey: queryKeys.admin.subscribers,
		fetch: fetchSubscribers,
		params: { status, categoryId, q },
		period: false,
	});
	const { data } = list;

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
					<AdminSearchField
						param="q"
						label="찾기"
						placeholder="이메일 · 이름 일부"
						ariaLabel="이메일 · 이름으로 찾기"
					/>
				</>
			}
		>
			<AdminActions>
				<AdminListState list={list} empty={ADMIN.empty.subscribers}>
					{(data) => (
						<div className="table-wrap">
							<table style={{ minWidth: tableMinWidth(COLS) }}>
								<Cols widths={COLS} />
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
				</AdminListState>
				<AdminListPagination list={list} />
			</AdminActions>
		</AdminSubPage>
	);
}
