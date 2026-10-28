'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/api/client';
import API_ENDPOINTS from '@/constants/api';
import { CATEGORY_OPTIONS } from '@/constants/categories';
import { mapIdToTitle } from '@/utils/mapInterests';
import Pagination from '@/components/common/Pagination';
import FilterChips from '@/components/common/FilterChips';
import AdminSubPage, { Cols } from './AdminSubPage';
import { HeaderSelect } from '@/components/common/TableHeader';
import { PeriodHeaderFilter, SortHeader, useSortQuery } from './HeaderFilter';
import { useAdminQuery } from './period';
import { when } from './format';

const PAGE_SIZE = 20;

interface Row {
	id: number;
	title: string;
	categoryId: number;
	viewcount: number;
	createdAt: string;
}

/** 관리자 상세: 기간 안에 발행한 뉴스레터 (관심사로 거르기, 쪽) */
export default function NewslettersList() {
	const { from, to, page, set, get, today } = useAdminQuery();
	const categoryId = Number(get('categoryId')) || 0;
	const sortQuery = useSortQuery();
	const query = new URLSearchParams({ from, to, limit: String(PAGE_SIZE), offset: String((page - 1) * PAGE_SIZE) });
	if (categoryId) query.set('categoryId', String(categoryId));
	for (const [key, value] of Object.entries(sortQuery)) query.set(key, value);

	const { data, isPending, isError } = useQuery({
		queryKey: ['adminNewsletters', query.toString()],
		queryFn: () =>
			apiFetch<{ data: { items: Row[]; total: number } }>(
				API_ENDPOINTS.ADMIN.LIST('newsletters', query.toString()),
			).then((r) => r.data),
		placeholderData: (previous) => previous,
	});

	return (
		<AdminSubPage
			title="발행한 뉴스레터"
			summary={data && `${data.total.toLocaleString()}편`}
			filters={
				<FilterChips
					label="관심사"
					options={CATEGORY_OPTIONS}
					value={categoryId ? String(categoryId) : ''}
					onChange={(v) => set({ categoryId: v || null })}
				/>
			}
		>
			{isPending ? (
				<p className="state">불러오는 중…</p>
			) : isError ? (
				<p className="state">불러오지 못했어요.</p>
			) : data.items.length === 0 ? (
				<p className="state">이 기간에 발행한 뉴스레터가 없어요.</p>
			) : (
				<div className="table-wrap">
					<table>
						<Cols widths={['10rem', '7rem', undefined, '6rem', '5rem']} />
						<thead>
							<tr>
								{/* 위 거르기와 같은 조건을 표 머리에서도 */}
								<th scope="col">
									<PeriodHeaderFilter label="만든 시각" />
								</th>
								<th scope="col">
									<HeaderSelect
										label="관심사"
										value={categoryId ? String(categoryId) : ''}
										options={CATEGORY_OPTIONS}
										onChange={(id) => set({ categoryId: id || null })}
									/>
								</th>
								<th scope="col">
									<SortHeader label="제목" field="title" first="asc" />
								</th>
								<th scope="col">
									<SortHeader label="조회수" field="viewcount" />
								</th>
								<th scope="col">
									<SortHeader label="id" field="id" />
								</th>
							</tr>
						</thead>
						<tbody>
							{data.items.map((n) => (
								<tr key={n.id}>
									<td className="nowrap num">{when(n.createdAt, today)}</td>
									<td className="nowrap category">{mapIdToTitle([n.categoryId])[0]}</td>
									<td>
										<Link href={`/articles/detail/${n.id}`}>{n.title}</Link>
									</td>
									<td className="nowrap num">{n.viewcount.toLocaleString()}</td>
									<td className="nowrap num">{n.id}</td>
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
