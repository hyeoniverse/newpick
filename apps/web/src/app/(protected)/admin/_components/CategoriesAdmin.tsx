'use client';

import { ADMIN, COMMON } from '@/copy';
import { ROUTES } from '@/constants/routes';
import { fetchCategories } from '@/api/admin';
import { queryKeys } from '@/api/queryKeys';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import AdminSubPage, { Cols, tableMinWidth } from './AdminSubPage';
import { useAdminQuery } from './period';
import { when } from '../_lib/format';
import { AdminActions } from './UsersAdmin';

/** 표 칸 폭 (정하지 않은 칸은 나머지) */
const COLS = ['7rem', '8rem', '10rem', '8rem', '8rem', undefined];

/**
 * 관리자 CMS (#31): 관심사 현황. 관심사 이름은 수집(네이버 섹션) · 화면 상수 · 메일과 묶여 있어 여기서는 보기만 하고,
 * 관심사마다 뉴스레터 · 고른 사람 · 구독 중 · 최근 30일 수집 기사를 한눈에 본다. 숫자를 누르면 해당 상세 목록으로
 */
export default function CategoriesAdmin() {
	const { today } = useAdminQuery();
	const { data, isPending, isError } = useQuery({
		queryKey: queryKeys.admin.categories,
		queryFn: () => fetchCategories(),
	});

	return (
		<AdminSubPage title="관심사" period={false} summary={ADMIN.categoriesLead}>
			<AdminActions>
				{isPending ? (
					<p className="state">{COMMON.loading}</p>
				) : isError ? (
					<p className="state">{COMMON.loadFailed}</p>
				) : (
					<div className="table-wrap">
						<table style={{ minWidth: tableMinWidth(COLS) }}>
							<Cols widths={COLS} />
							<thead>
								<tr>
									<th scope="col">관심사</th>
									<th scope="col">뉴스레터</th>
									<th scope="col">마지막 발행</th>
									<th scope="col">고른 사람</th>
									<th scope="col">구독 중</th>
									<th scope="col">최근 30일 수집 기사</th>
								</tr>
							</thead>
							<tbody>
								{data.map((row) => (
									<tr key={row.id}>
										<td className="category">{row.name}</td>
										<td className="num">
											<Link
												href={`${ROUTES.admin.newsletters}?categoryId=${row.id}&from=${daysAgo(today, 29)}&to=${today}`}
											>
												{row.newsletters.toLocaleString()}편
											</Link>
										</td>
										<td className="nowrap num">{when(row.lastNewsletterAt, today)}</td>
										<td className="num">{row.interestedUsers.toLocaleString()}명</td>
										<td className="num">
											<Link href={`${ROUTES.admin.subscribers}?status=active&categoryId=${row.id}`}>
												{row.activeSubscribers.toLocaleString()}명
											</Link>
										</td>
										<td className="num">
											<Link
												href={`${ROUTES.admin.articles}?categoryId=${row.id}&from=${daysAgo(today, 29)}&to=${today}`}
											>
												{row.articles30d.toLocaleString()}건
											</Link>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</AdminActions>
		</AdminSubPage>
	);
}

/** 'YYYY-MM-DD'에서 n일 전 */
const daysAgo = (day: string, n: number) => {
	const d = new Date(`${day}T00:00:00Z`);
	d.setUTCDate(d.getUTCDate() - n);
	return d.toISOString().slice(0, 10);
};
