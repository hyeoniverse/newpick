'use client';

import { fetchMailList } from '@/api/admin';
import { queryKeys } from '@/api/queryKeys';

import { useEffect, useState } from 'react';
import { CATEGORY_OPTIONS } from '@/constants/categories';
import { mapIdToTitle } from '@/utils/mapInterests';
import FilterChips from '@/components/common/FilterChips';
import { AdminListPagination, AdminListState, useAdminList } from './AdminList';
import AdminSubPage, { Cols, tableMinWidth } from './AdminSubPage';
import { HeaderSelect } from '@/components/common/TableHeader';
import { PeriodHeaderFilter } from './HeaderFilter';
import { useAdminQuery } from './period';
import { when } from '../_lib/format';

/** 표 칸 폭 (정하지 않은 칸은 나머지) */
const COLS = ['9rem', '10rem', undefined, '12rem'];

/** 관리자 상세: 발송 기록. 하루에 한 사람 한 줄(받은 관심사), 관심사 · 이메일로 찾기, 쪽 */
export default function MailList() {
	const { set, get, today } = useAdminQuery();
	const email = get('email');
	const categoryId = Number(get('categoryId')) || 0;
	const [input, setInput] = useState(email);
	useEffect(() => setInput(email), [email]);

	const list = useAdminList({
		queryKey: queryKeys.admin.mails,
		fetch: fetchMailList,
		params: { email, categoryId: categoryId || null },
	});
	const { data } = list;

	return (
		<AdminSubPage
			title="발송 기록"
			summary={data && `${data.total.toLocaleString()}건`}
			filters={
				<>
					<FilterChips
						label="관심사"
						ariaLabel="받은 관심사"
						options={CATEGORY_OPTIONS}
						value={categoryId ? String(categoryId) : ''}
						onChange={(v) => set({ categoryId: v || null })}
					/>
					<form
						role="search"
						className="searches"
						onSubmit={(event) => {
							event.preventDefault();
							set({ email: input.trim() || null });
						}}
					>
						<span className="chips-label">이메일</span>
						<input
							type="search"
							className="search"
							value={input}
							onChange={(event) => setInput(event.target.value)}
							placeholder="이메일 일부로 찾기"
							aria-label="받은 사람 이메일로 찾기"
							maxLength={100}
						/>
					</form>
				</>
			}
		>
			<AdminListState
				list={list}
				empty={email ? `‘${email}’이(가) 들어간 받은 사람이 없어요.` : '이 기간에 보낸 메일이 없어요.'}
			>
				{(data) => (
					<div className="table-wrap">
						<table style={{ minWidth: tableMinWidth(COLS) }}>
							<Cols widths={COLS} />
							<thead>
								<tr>
									{/* 위 거르기와 같은 조건을 표 머리에서도 */}
									<th scope="col">
										<PeriodHeaderFilter label="날짜" />
									</th>
									<th scope="col">보낸 시각</th>
									<th scope="col">받은 사람</th>
									<th scope="col">
										<HeaderSelect
											label="받은 관심사"
											value={categoryId ? String(categoryId) : ''}
											options={CATEGORY_OPTIONS}
											onChange={(id) => set({ categoryId: id || null })}
										/>
									</th>
								</tr>
							</thead>
							<tbody>
								{data.items.map((row) => (
									<tr key={`${row.day}-${row.email}`}>
										<td className="nowrap num">{row.day}</td>
										<td className="nowrap num">{when(row.sentAt, today)}</td>
										<td>{row.email}</td>
										<td className="category">{mapIdToTitle(row.categoryIds).join(' · ')}</td>
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
