'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import { LuTriangleAlert } from 'react-icons/lu';
import { apiFetch, ApiError } from '@/api/client';
import { fetchAllKeywords } from '@/api/article';
import API_ENDPOINTS from '@/constants/api';
import { CATEGORY_OPTIONS } from '@/constants/categories';
import { useToast } from '@/hooks/useToast';
import { useModal } from '@/hooks/useModal';
import { mapIdToTitle } from '@/utils/mapInterests';
import FilterChips from '@/components/common/FilterChips';
import Pagination from '@/components/common/Pagination';
import Button from '@/components/common/Button';
import ModalContents from '@/components/common/modal/ModalContent';
import { fieldControl, fieldLabel } from '@/components/common/field';
import AdminSubPage, { Cols } from './AdminSubPage';
import { when } from './format';
import { kstDate } from '@/utils/formatter';

const PAGE_SIZE = 30;

interface Rule {
	id: number;
	keyword: string;
	action: 'alias' | 'block';
	target: string | null;
	createdAt: string;
}

/** 합치기 · 이름 바꾸기 창: 고른 태그들을 새 이름 하나로 (기본은 가장 많이 쓴 태그 이름) */
function MergeSheet({
	tags,
	onDone,
	onCancel,
}: {
	tags: { keyword: string; count: number }[];
	onDone: (changed: number, to: string) => void;
	onCancel: () => void;
}) {
	const [to, setTo] = useState(tags[0]?.keyword ?? '');
	const [error, setError] = useState('');
	const [pending, setPending] = useState(false);
	const rename = tags.length === 1;

	const submit = async (event: React.FormEvent) => {
		event.preventDefault();
		const name = to.trim();
		if (!name) return setError('새 이름을 적어 주세요.');
		setPending(true);
		setError('');
		try {
			const { data } = await apiFetch<{ data: { changed: number } }>(API_ENDPOINTS.ADMIN.TAG_MERGE(), {
				method: 'POST',
				body: { from: tags.map((t) => t.keyword), to: name },
			});
			onDone(data.changed, name);
		} catch (e) {
			setError(e instanceof ApiError ? e.message : '바꾸지 못했어요. 잠시 뒤 다시 시도해 주세요.');
		} finally {
			setPending(false);
		}
	};

	return (
		<StyledSheet onSubmit={submit}>
			<h2 className="title">{rename ? '태그 이름 바꾸기' : `태그 ${tags.length}개 합치기`}</h2>
			<p className="desc">
				{tags.map((t) => `#${t.keyword}`).join(' · ')}
				{rename ? '의 이름을 바꿔요.' : '을(를) 한 이름으로 합쳐요.'} 이미 발행한 뉴스레터의 태그도 바뀌고, 앞으로 새
				뉴스레터에 같은 태그가 나와도 새 이름으로 바꿔 저장해요.
			</p>
			<label className="field">
				<span>새 이름</span>
				<input value={to} onChange={(event) => setTo(event.target.value)} maxLength={30} autoFocus />
			</label>
			{error && <p className="error">{error}</p>}
			<div className="actions">
				<Button type="button" scheme="outline" size="medium" onClick={onCancel}>
					취소
				</Button>
				<Button type="submit" scheme="primary" size="medium" disabled={pending}>
					{pending ? '바꾸는 중…' : rename ? '이름 바꾸기' : '합치기'}
				</Button>
			</div>
		</StyledSheet>
	);
}

/**
 * 관리자: 태그 정돈 (#20). 매일 태그가 늘어 같은 대상이 여러 표기로 갈라지므로
 * 골라서 합치기(이름 바꾸기 포함) · 지우기를 하고, 그 규칙은 앞으로 새 뉴스레터에도 적용된다
 */
export default function TagsAdmin() {
	const { showToast } = useToast();
	const { openModal, closeModal } = useModal();
	const queryClient = useQueryClient();
	const [category, setCategory] = useState('');
	const [q, setQ] = useState('');
	const [page, setPage] = useState(1);
	const [selected, setSelected] = useState<string[]>([]);
	const categoryId = Number(category) || 0;

	const tags = useQuery({
		queryKey: ['allKeywords', categoryId],
		queryFn: () => fetchAllKeywords(categoryId || undefined),
		placeholderData: (previous) => previous,
	});
	const rules = useQuery({
		queryKey: ['tagRules'],
		queryFn: () => apiFetch<{ data: Rule[] }>(API_ENDPOINTS.ADMIN.TAG_RULES()).then((r) => r.data),
	});

	const list = useMemo(() => {
		const needle = q.trim().toLowerCase();
		return (tags.data ?? []).filter((t) => !needle || t.keyword.toLowerCase().includes(needle));
	}, [tags.data, q]);
	const pageItems = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
	const picked = (tags.data ?? []).filter((t) => selected.includes(t.keyword));

	const refresh = () => {
		setSelected([]);
		queryClient.invalidateQueries({ queryKey: ['allKeywords'] });
		queryClient.invalidateQueries({ queryKey: ['tagRules'] });
		queryClient.invalidateQueries({ queryKey: ['popularKeywords'] });
	};

	const toggle = (keyword: string) =>
		setSelected((prev) => (prev.includes(keyword) ? prev.filter((k) => k !== keyword) : [...prev, keyword]));

	const merge = (targets: { keyword: string; count: number }[]) =>
		openModal(
			<MergeSheet
				tags={[...targets].sort((a, b) => b.count - a.count)}
				onCancel={closeModal}
				onDone={(changed, to) => {
					closeModal();
					showToast(`#${to}(으)로 바꿨어요. 뉴스레터 ${changed}편의 태그를 고쳤어요.`, 'success');
					refresh();
				}}
			/>,
		);

	const remove = (keyword: string) =>
		openModal(
			<ModalContents
				icon={<LuTriangleAlert />}
				title={`#${keyword} 태그를 지울까요?`}
				content="이미 발행한 뉴스레터에서 이 태그를 빼고, 앞으로 새 뉴스레터에도 붙이지 않아요. 규칙을 지우면 앞으로는 다시 붙을 수 있어요."
				outlineButton="취소"
				filledButton="지우기"
				onCancelClick={closeModal}
				onConfirmClick={async () => {
					closeModal();
					try {
						const { data } = await apiFetch<{ data: { changed: number } }>(API_ENDPOINTS.ADMIN.TAG_REMOVE(), {
							method: 'POST',
							body: { tag: keyword },
						});
						showToast(`#${keyword}을(를) 지웠어요. 뉴스레터 ${data.changed}편의 태그를 고쳤어요.`, 'success');
						refresh();
					} catch (error) {
						showToast(error instanceof ApiError ? error.message : '지우지 못했어요.', 'error');
					}
				}}
			/>,
		);

	const deleteRule = async (rule: Rule) => {
		try {
			await apiFetch(API_ENDPOINTS.ADMIN.TAG_RULE(rule.id), { method: 'DELETE' });
			showToast('규칙을 지웠어요. 앞으로의 새 뉴스레터부터 적용돼요.', 'info');
			refresh();
		} catch (error) {
			showToast(error instanceof ApiError ? error.message : '지우지 못했어요.', 'error');
		}
	};

	const since = kstDate(29);

	return (
		<AdminSubPage
			title="태그"
			period={false}
			summary={
				tags.data &&
				`태그 ${tags.data.length.toLocaleString()}개 · 두 번 이상 ${tags.data.filter((t) => t.count >= 2).length}개 · 한 번만 ${tags.data.filter((t) => t.count < 2).length}개`
			}
			filters={
				<>
					<FilterChips
						label="관심사"
						options={CATEGORY_OPTIONS}
						value={category}
						onChange={(v) => {
							setCategory(v);
							setPage(1);
						}}
					/>
					<div className="searches">
						<span className="chips-label">찾기</span>
						<input
							type="search"
							className="search"
							value={q}
							onChange={(event) => {
								setQ(event.target.value);
								setPage(1);
							}}
							placeholder="태그 이름 일부"
							aria-label="태그 이름으로 찾기"
							maxLength={30}
						/>
					</div>
				</>
			}
		>
			<StyledTags>
				<div className="bulk" aria-live="polite">
					<span>{selected.length ? `${selected.length}개 고름` : '합칠 태그를 골라 주세요'}</span>
					<Button
						type="button"
						scheme="primary"
						size="small"
						disabled={selected.length < 2}
						onClick={() => merge(picked)}
					>
						고른 태그 합치기
					</Button>
					{selected.length > 0 && (
						<button type="button" className="clear" onClick={() => setSelected([])}>
							고른 것 풀기
						</button>
					)}
				</div>

				{tags.isPending ? (
					<p className="state">불러오는 중…</p>
				) : tags.isError ? (
					<p className="state">불러오지 못했어요.</p>
				) : list.length === 0 ? (
					<p className="state">이 조건의 태그가 없어요.</p>
				) : (
					<div className="table-wrap">
						<table>
							<Cols widths={['3rem', undefined, '5rem', '9rem', '9rem', '11rem']} />
							<thead>
								<tr>
									<th scope="col">
										<span className="sr-only">고르기</span>
									</th>
									<th scope="col">태그</th>
									<th scope="col">쓰인 횟수</th>
									<th scope="col">마지막</th>
									<th scope="col">관심사</th>
									<th scope="col">
										<span className="sr-only">동작</span>
									</th>
								</tr>
							</thead>
							<tbody>
								{pageItems.map((t) => (
									<tr key={t.keyword} className={selected.includes(t.keyword) ? 'picked' : undefined}>
										<td>
											<input
												type="checkbox"
												checked={selected.includes(t.keyword)}
												onChange={() => toggle(t.keyword)}
												aria-label={`#${t.keyword} 고르기`}
											/>
										</td>
										<td>
											<Link href={`/articles?keyword=${encodeURIComponent(t.keyword)}`} className="tag">
												<span className="hash">#</span>
												{t.keyword}
											</Link>
											{t.count < 2 && t.lastUsedAt.slice(0, 10) < since && <span className="old">오래됨</span>}
										</td>
										<td className="num">{t.count}</td>
										<td className="nowrap num">{when(t.lastUsedAt, kstDate(0))}</td>
										<td className="nowrap">{mapIdToTitle(t.categoryIds).join(' · ')}</td>
										<td className="row-actions">
											<button type="button" onClick={() => merge([t])}>
												이름 바꾸기
											</button>
											<button type="button" className="danger" onClick={() => remove(t.keyword)}>
												지우기
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
				<Pagination className="pagination" page={page} total={list.length} pageSize={PAGE_SIZE} onChange={setPage} />

				<section className="rules" aria-labelledby="tag-rules">
					<h2 id="tag-rules">규칙</h2>
					<p className="rules-desc">새 뉴스레터를 저장할 때 태그에 적용돼요. 지워도 이미 바꾼 태그는 그대로예요.</p>
					{rules.data?.length ? (
						<ul>
							{rules.data.map((rule) => (
								<li key={rule.id}>
									<span className="rule">
										{rule.action === 'alias' ? (
											<>
												#{rule.keyword} → <strong>#{rule.target}</strong>
											</>
										) : (
											<>
												#{rule.keyword} <span className="blocked">붙이지 않음</span>
											</>
										)}
									</span>
									<span className="rule-date">{rule.createdAt.slice(0, 10)}</span>
									<button type="button" onClick={() => deleteRule(rule)}>
										규칙 지우기
									</button>
								</li>
							))}
						</ul>
					) : (
						<p className="state">아직 규칙이 없어요. 태그를 합치거나 지우면 생겨요.</p>
					)}
				</section>
			</StyledTags>
		</AdminSubPage>
	);
}

const StyledTags = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}

	.bulk {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem;
		font-size: ${({ theme }) => theme.fontSize.small};
		color: ${({ theme }) => theme.color.subText};

		.clear {
			padding: 0;
			font-size: ${({ theme }) => theme.fontSize.small};
			color: ${({ theme }) => theme.color.subText};
			text-decoration: underline;
			cursor: pointer;
		}
	}

	tr.picked td {
		background: color-mix(in srgb, ${({ theme }) => theme.color.primary} 6%, transparent);
	}

	input[type='checkbox'] {
		width: 1.125rem;
		height: 1.125rem;
		accent-color: ${({ theme }) => theme.color.primary};
		cursor: pointer;
	}

	.tag {
		color: ${({ theme }) => theme.color.text};
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};

		.hash {
			color: ${({ theme }) => theme.color.primary};
		}
	}

	.old {
		margin-left: 0.5rem;
		padding: 0.0625rem 0.375rem;
		border-radius: ${({ theme }) => theme.radius.chip};
		background: ${({ theme }) => theme.color.neutral};
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.subText};
	}

	.row-actions {
		white-space: nowrap;
		text-align: right;

		button {
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

	.rules {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 1.5rem;

		h2 {
			margin: 0;
			padding-bottom: 0.5rem;
			border-bottom: 1px solid ${({ theme }) => theme.color.border};
			font-size: ${({ theme }) => theme.fontSize.medium};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
		}

		.rules-desc {
			font-size: ${({ theme }) => theme.fontSize.small};
			color: ${({ theme }) => theme.color.subText};
		}

		ul {
			margin: 0;
			padding: 0;
			list-style: none;
		}

		li {
			display: flex;
			align-items: center;
			gap: 1rem;
			padding: 0.625rem 0;
			border-bottom: 1px solid ${({ theme }) => theme.color.border};
			font-size: ${({ theme }) => theme.fontSize.small};

			.rule {
				flex: 1;
				min-width: 0;
			}

			.blocked {
				margin-left: 0.25rem;
				color: ${({ theme }) => theme.color.error};
			}

			.rule-date {
				color: ${({ theme }) => theme.color.subText};
				font-variant-numeric: tabular-nums;
			}

			button {
				font-size: ${({ theme }) => theme.fontSize.extraSmall};
				color: ${({ theme }) => theme.color.subText};
				text-decoration: underline;
				cursor: pointer;
			}
		}
	}
`;

const StyledSheet = styled.form`
	display: flex;
	flex-direction: column;
	gap: 0.875rem;

	.title {
		font-size: ${({ theme }) => theme.heading.extraSmall.fontSize};
		font-weight: ${({ theme }) => theme.fontWeight.bold};
	}

	.desc {
		font-size: ${({ theme }) => theme.fontSize.small};
		line-height: 1.6;
		color: ${({ theme }) => theme.color.subText};
		word-break: keep-all;
	}

	.field {
		display: flex;
		flex-direction: column;

		span {
			${fieldLabel}
		}

		input {
			${fieldControl}
		}
	}

	.error {
		font-size: ${({ theme }) => theme.fontSize.small};
		color: ${({ theme }) => theme.color.error};
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}
`;
