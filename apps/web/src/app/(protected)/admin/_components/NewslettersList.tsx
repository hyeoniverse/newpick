'use client';

import { ROUTES } from '@/constants/routes';
import { fetchNewsletterList } from '@/api/admin';
import { queryKeys } from '@/api/queryKeys';

import Link from 'next/link';
import { CATEGORY_OPTIONS } from '@/constants/categories';
import { mapIdToTitle } from '@/utils/mapInterests';
import FilterChips from '@/components/common/FilterChips';
import { AdminListPagination, AdminListState, useAdminList } from './AdminList';
import AdminSubPage, { Cols, tableMinWidth } from './AdminSubPage';
import { HeaderSelect } from '@/components/common/TableHeader';
import { PeriodHeaderFilter, SortHeader } from './HeaderFilter';
import { useAdminQuery } from './period';
import { when } from '../_lib/format';

/** 표 칸 폭 (정하지 않은 칸은 나머지) */
const COLS = ['10rem', '7rem', undefined, '6rem', '5rem'];

/** 발행 목록 한 줄 (@newpick/shared) */

/** 관리자 상세: 기간 안에 발행한 뉴스레터 (관심사로 거르기, 쪽) */
export default function NewslettersList() {
	const { set, get, today } = useAdminQuery();
	const categoryId = Number(get('categoryId')) || 0;
	const list = useAdminList({
		queryKey: queryKeys.admin.newsletters.list,
		fetch: fetchNewsletterList,
		params: { categoryId: categoryId || null },
		sort: true,
	});
	const { data } = list;

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
			<AdminListState list={list} empty="이 기간에 발행한 뉴스레터가 없어요.">
				{(data) => (
					<div className="table-wrap">
						<table style={{ minWidth: tableMinWidth(COLS) }}>
							<Cols widths={COLS} />
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
											{/* 누르면 고치기 (#31). 사이트에서 보기는 고치기 화면에서 */}
											<Link href={ROUTES.admin.newsletter(n.id)}>{n.title}</Link>
										</td>
										<td className="nowrap num">{n.viewcount.toLocaleString()}</td>
										<td className="nowrap num">{n.id}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</AdminListState>
			<AdminListPagination list={list} />
		</AdminSubPage>
	);
}
