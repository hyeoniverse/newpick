'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import { LuTriangleAlert } from 'react-icons/lu';
import { apiFetch, ApiError } from '@/api/client';
import API_ENDPOINTS from '@/constants/api';
import { useToast } from '@/hooks/useToast';
import { useModal } from '@/hooks/useModal';
import { useAuth } from '@/hooks/useAuth';
import { mapIdToTitle } from '@/utils/mapInterests';
import FilterChips from '@/components/common/FilterChips';
import Pagination from '@/components/common/Pagination';
import StatusBadge from '@/components/common/StatusBadge';
import ModalContents from '@/components/common/modal/ModalContent';
import AdminSubPage, { Cols } from './AdminSubPage';
import { useAdminQuery } from './period';
import { when } from './format';

const PAGE_SIZE = 20;

const ROLES = [
	{ value: '', label: '전체' },
	{ value: 'user', label: '사용자' },
	{ value: 'admin', label: '관리자' },
];

/** 구독 상태 이름 · 배지 색 (구독자 화면과 같이 씀) */
export const SUBSCRIPTION_LABEL: Record<string, string> = { active: '구독 중', paused: '일시 정지', cancelled: '해지' };
export const subscriptionTone = (status: string | null) =>
	status === 'active' ? 'success' : status === 'paused' ? 'warning' : 'neutral';

interface Row {
	id: number;
	email: string;
	username: string | null;
	role: 'user' | 'admin';
	createdAt: string;
	interests: number[];
	subscription: string | null;
	bookmarks: number;
}

/**
 * 관리자 CMS (#31): 사용자. 이메일 · 이름 · 권한으로 찾고, 권한을 바꾸거나 지운다(회원 탈퇴와 같은 경로).
 * 내 계정은 바꾸거나 지울 수 없다 (서버에서도 막음)
 */
export default function UsersAdmin() {
	const { page, set, get, today } = useAdminQuery();
	const { user: me } = useAuth();
	const { showToast } = useToast();
	const { openModal, closeModal } = useModal();
	const queryClient = useQueryClient();
	const role = get('role');
	const q = get('q');
	const [input, setInput] = useState(q);
	useEffect(() => setInput(q), [q]);

	const query = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String((page - 1) * PAGE_SIZE) });
	if (role) query.set('role', role);
	if (q) query.set('q', q);

	const { data, isPending, isError } = useQuery({
		queryKey: ['adminUsers', query.toString()],
		queryFn: () =>
			apiFetch<{ data: { items: Row[]; total: number } }>(API_ENDPOINTS.ADMIN.USERS(query.toString())).then(
				(r) => r.data,
			),
		placeholderData: (previous) => previous,
	});
	const refresh = () => queryClient.invalidateQueries({ queryKey: ['adminUsers'] });

	const changeRole = (row: Row) => {
		const next = row.role === 'admin' ? 'user' : 'admin';
		openModal(
			<ModalContents
				icon={<LuTriangleAlert />}
				title={next === 'admin' ? `${row.email}을 관리자로 바꿀까요?` : `${row.email}의 관리자 권한을 뺄까요?`}
				content={
					next === 'admin'
						? '관리자는 관리자 화면에서 뉴스레터 · 사용자 · 예약 작업을 모두 바꿀 수 있어요.'
						: '이 사용자는 관리자 화면에 들어올 수 없게 돼요.'
				}
				outlineButton="취소"
				filledButton={next === 'admin' ? '관리자로' : '권한 빼기'}
				onCancelClick={closeModal}
				onConfirmClick={async () => {
					closeModal();
					try {
						await apiFetch(API_ENDPOINTS.ADMIN.USER(row.id), { method: 'PATCH', body: { role: next } });
						showToast('권한을 바꿨어요.', 'success');
						refresh();
					} catch (error) {
						showToast(error instanceof ApiError ? error.message : '바꾸지 못했어요.', 'error');
					}
				}}
			/>,
		);
	};

	const remove = (row: Row) =>
		openModal(
			<ModalContents
				icon={<LuTriangleAlert />}
				title={`${row.email} 계정을 지울까요?`}
				content="회원 탈퇴와 같아요. 관심사 · 구독 · 북마크 · 메일 발송 기록이 함께 지워지고 되돌릴 수 없어요."
				outlineButton="취소"
				filledButton="지우기"
				onCancelClick={closeModal}
				onConfirmClick={async () => {
					closeModal();
					try {
						await apiFetch(API_ENDPOINTS.ADMIN.USER(row.id), { method: 'DELETE' });
						showToast('계정을 지웠어요.', 'success');
						refresh();
					} catch (error) {
						showToast(error instanceof ApiError ? error.message : '지우지 못했어요.', 'error');
					}
				}}
			/>,
		);

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
			<StyledActions>
				{isPending ? (
					<p className="state">불러오는 중…</p>
				) : isError ? (
					<p className="state">불러오지 못했어요.</p>
				) : data.items.length === 0 ? (
					<p className="state">이 조건의 사용자가 없어요.</p>
				) : (
					<div className="table-wrap">
						<table>
							<Cols widths={['3.5rem', undefined, '6.5rem', '5.5rem', '6.5rem', '7rem', '4.5rem', '9rem', '8.5rem']} />
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

/** 표 안의 줄 동작(권한 · 지우기)과 '나' 표시 — 수집 기사 · 태그 화면과 같은 모양 */
export const StyledActions = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}

	.me {
		margin-left: 0.375rem;
		padding: 0.0625rem 0.375rem;
		border-radius: ${({ theme }) => theme.radius.chip};
		background: ${({ theme }) => theme.color.tertiary};
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.primary};
	}

	.row-actions {
		white-space: nowrap;
		text-align: right;

		button,
		a {
			padding: 0.25rem 0.5rem;
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			color: ${({ theme }) => theme.color.primary};
			cursor: pointer;

			&:hover {
				text-decoration: underline;
			}

			&.danger {
				color: ${({ theme }) => theme.color.error};
			}
		}
	}
`;
