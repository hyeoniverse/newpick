'use client';

import { useConfirmAction } from '@/hooks/useConfirmAction';
import { changeUserRole, deleteUser, fetchUsers } from '@/api/admin';
import { queryKeys } from '@/api/queryKeys';

import type { AdminUserRow } from '@newpick/shared';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/hooks/useAuth';
import { mapIdToTitle } from '@/utils/mapInterests';
import FilterChips from '@/components/common/FilterChips';
import StatusBadge from '@/components/common/StatusBadge';
import { AdminListPagination, AdminListState, useAdminList } from './AdminList';
import AdminSubPage, { Cols, tableMinWidth } from './AdminSubPage';
import { useAdminQuery } from './period';
import { when } from '../_lib/format';
import { cx } from '@/styles/tw';

/** 표 칸 폭 (정하지 않은 칸은 나머지) */
const COLS = ['3.5rem', undefined, '6.5rem', '5.5rem', '6.5rem', '7rem', '4.5rem', '9rem', '8.5rem'];

const ROLES = [
	{ value: '', label: '전체' },
	{ value: 'user', label: '사용자' },
	{ value: 'admin', label: '관리자' },
];

/** 구독 상태 이름 · 배지 색 (구독자 화면과 같이 씀) */
export const SUBSCRIPTION_LABEL: Record<string, string> = { active: '구독 중', paused: '일시 정지', cancelled: '해지' };
export const subscriptionTone = (status: string | null) =>
	status === 'active' ? 'success' : status === 'paused' ? 'warning' : 'neutral';

/**
 * 관리자 CMS (#31): 사용자. 이메일 · 이름 · 권한으로 찾고, 권한을 바꾸거나 지운다(회원 탈퇴와 같은 경로).
 * 내 계정은 바꾸거나 지울 수 없다 (서버에서도 막음)
 */
export default function UsersAdmin() {
	const { set, get, today } = useAdminQuery();
	const { user: me } = useAuth();
	const confirm = useConfirmAction();
	const queryClient = useQueryClient();
	const role = get('role');
	const q = get('q');
	const [input, setInput] = useState(q);
	useEffect(() => setInput(q), [q]);

	const list = useAdminList({
		queryKey: queryKeys.admin.users.list,
		fetch: fetchUsers,
		params: { role, q },
		period: false,
	});
	const { data } = list;
	const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.all });

	const changeRole = (row: AdminUserRow) => {
		const next = row.role === 'admin' ? 'user' : 'admin';
		confirm({
			title:
				next === 'admin' ? `${row.email}을 관리자로 바꾸시겠습니까?` : `${row.email}의 관리자 권한을 빼시겠습니까?`,
			content:
				next === 'admin'
					? '관리자는 관리자 화면에서 뉴스레터 · 사용자 · 예약 작업을 모두 바꿀 수 있습니다.'
					: '이 사용자는 관리자 화면에 들어올 수 없게 됩니다.',
			confirmLabel: next === 'admin' ? '관리자로' : '권한 빼기',
			run: () => changeUserRole(row.id, next),
			success: '권한을 바꿨습니다.',
			failure: '바꾸지 못했습니다.',
			onDone: refresh,
		});
	};

	const remove = (row: AdminUserRow) =>
		confirm({
			title: `${row.email} 계정을 지우시겠습니까?`,
			content: '회원 탈퇴와 같습니다. 관심사 · 구독 · 북마크 · 메일 발송 기록이 함께 지워지고 되돌릴 수 없습니다.',
			confirmLabel: '지우기',
			run: () => deleteUser(row.id),
			success: '계정을 지웠습니다.',
			failure: '지우지 못했습니다.',
			onDone: refresh,
		});

	return (
		<AdminSubPage
			title="사용자"
			period={false}
			summary={data && `${data.total.toLocaleString()}명`}
			filters={
				<>
					<FilterChips label="권한" options={ROLES} value={role} onChange={(v) => set({ role: v || null })} />
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
			<AdminActions>
				<AdminListState list={list} empty="이 조건의 사용자가 없습니다.">
					{(data) => (
						<div className="table-wrap">
							<table style={{ minWidth: tableMinWidth(COLS) }}>
								<Cols widths={COLS} />
								<thead>
									<tr>
										<th scope="col">id</th>
										<th scope="col">이메일</th>
										<th scope="col">이름</th>
										<th scope="col">권한</th>
										<th scope="col">구독</th>
										<th scope="col">관심사</th>
										<th scope="col">북마크</th>
										<th scope="col">가입</th>
										<th scope="col">
											<span className="sr-only">동작</span>
										</th>
									</tr>
								</thead>
								<tbody>
									{data.items.map((row) => {
										const self = me?.id === row.id;
										return (
											<tr key={row.id}>
												<td className="num">{row.id}</td>
												<td>
													{row.email}
													{self && <span className="me">나</span>}
												</td>
												<td>{row.username ?? '-'}</td>
												<td>
													<StatusBadge tone={row.role === 'admin' ? 'success' : 'neutral'}>
														{row.role === 'admin' ? '관리자' : '사용자'}
													</StatusBadge>
												</td>
												<td>
													{row.subscription ? (
														<StatusBadge tone={subscriptionTone(row.subscription)}>
															{SUBSCRIPTION_LABEL[row.subscription] ?? row.subscription}
														</StatusBadge>
													) : (
														'-'
													)}
												</td>
												<td className="category">{mapIdToTitle(row.interests).join(' · ') || '-'}</td>
												<td className="num">{row.bookmarks}</td>
												<td className="nowrap num">{when(row.createdAt, today)}</td>
												<td className="row-actions">
													{!self && (
														<>
															<button type="button" onClick={() => changeRole(row)}>
																{row.role === 'admin' ? '권한 빼기' : '관리자로'}
															</button>
															<button type="button" className="danger" onClick={() => remove(row)}>
																지우기
															</button>
														</>
													)}
												</td>
											</tr>
										);
									})}
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

/** 표 안의 줄 동작(권한 · 지우기)과 '나' 표시 — 수집 기사 · 태그 화면과 같은 모양 */
export const AdminActions = ({ className, ...props }: React.ComponentProps<'div'>) => (
	<div className={cx('np-admin-users-admin-actions', className)} {...props} />
);
