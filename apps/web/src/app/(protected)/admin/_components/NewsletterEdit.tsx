'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import { LuTriangleAlert } from 'react-icons/lu';
import { apiFetch, ApiError } from '@/api/client';
import API_ENDPOINTS from '@/constants/api';
import { CATEGORIES } from '@/constants/categories';
import { useToast } from '@/hooks/useToast';
import { useModal } from '@/hooks/useModal';
import styles from '@/app/(protected)/protected.module.css';
import AdminGate from '@/components/common/auth/AdminGate';
import BackBar from '@/components/common/BackBar';
import Title from '@/components/common/Title';
import Button from '@/components/common/Button';
import ModalContents from '@/components/common/modal/ModalContent';
import ArticleContent from '@/app/articles/detail/[slug]/_components/content/ArticleContent';
import { fieldControl, fieldLabel } from '@/components/common/field';

interface Newsletter {
	id: string;
	title: string;
	subtitle: string | null;
	content: string;
	contentAsHTML: string | null;
	keywords: string[] | null;
	categoryId: string;
	viewcount: string;
	createdAt: string;
}

type Form = { title: string; subtitle: string; content: string; keywords: string; categoryId: string; html: string };

const toForm = (n: Newsletter): Form => ({
	title: n.title,
	subtitle: n.subtitle ?? '',
	content: n.content,
	keywords: (n.keywords ?? []).join(', '),
	categoryId: String(n.categoryId),
	html: n.contentAsHTML ?? '',
});

/**
 * 관리자 CMS (#31): 뉴스레터 한 편 고치기. AI 요약이 잘못 나왔을 때 지우지 않고 고친다.
 * 본문 HTML은 서버가 허용 목록으로 정리해 저장한다(XSS). 이미 보낸 메일은 그대로, 상세 페이지 · 이후 메일에 반영.
 * 조회수 초기화 · 지우기도 여기서
 */
export default function NewsletterEdit({ id }: { id: number }) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const { openModal, closeModal } = useModal();
	const [form, setForm] = useState<Form | null>(null);
	const [pending, setPending] = useState(false);
	const [error, setError] = useState('');

	const { data, isPending, isError } = useQuery({
		queryKey: ['adminNewsletter', id],
		queryFn: () =>
			apiFetch<{ data: { newsletter: Newsletter } }>(API_ENDPOINTS.ADMIN.NEWSLETTER(id)).then((r) => r.data.newsletter),
	});
	useEffect(() => {
		if (data) setForm(toForm(data));
	}, [data]);

	const change =
		(key: keyof Form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
			setForm((prev) => (prev ? { ...prev, [key]: event.target.value } : prev));

	const save = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!form || !data) return;
		if (!form.title.trim() || !form.content.trim()) return setError('제목과 요약은 비울 수 없어요.');
		setPending(true);
		setError('');
		try {
			await apiFetch(API_ENDPOINTS.ADMIN.NEWSLETTER(id), {
				method: 'PATCH',
				body: {
					title: form.title,
					subtitle: form.subtitle,
					content: form.content,
					keywords: form.keywords
						.split(',')
						.map((k) => k.trim())
						.filter(Boolean),
					categoryId: Number(form.categoryId),
					...(form.html !== (data.contentAsHTML ?? '') && { contentAsHTML: form.html }),
				},
			});
			showToast('고쳤어요. 상세 페이지와 이후 메일에 반영돼요.', 'success');
			queryClient.invalidateQueries({ queryKey: ['adminNewsletter', id] });
			queryClient.invalidateQueries({ queryKey: ['adminNewsletters'] });
		} catch (e) {
			setError(e instanceof ApiError ? e.message : '저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.');
		} finally {
			setPending(false);
		}
	};

	const confirm = (title: string, content: string, label: string, run: () => Promise<void>) =>
		openModal(
			<ModalContents
				icon={<LuTriangleAlert />}
				title={title}
				content={content}
				outlineButton="취소"
				filledButton={label}
				onCancelClick={closeModal}
				onConfirmClick={async () => {
					closeModal();
					try {
						await run();
					} catch (e) {
						showToast(e instanceof ApiError ? e.message : '하지 못했어요.', 'error');
					}
				}}
			/>,
		);

	const resetViews = () =>
		confirm('조회수를 0으로 되돌릴까요?', '인기 순위에서 이 뉴스레터가 아래로 내려가요.', '되돌리기', async () => {
			await apiFetch(API_ENDPOINTS.ADMIN.NEWSLETTER_RESET_VIEWS(id), { method: 'POST' });
			showToast('조회수를 0으로 되돌렸어요.', 'success');
			queryClient.invalidateQueries({ queryKey: ['adminNewsletter', id] });
		});

	const remove = () =>
		confirm(
			'이 뉴스레터를 지울까요?',
			'상세 페이지 · 목록에서 사라지고 북마크 · 발송 기록도 함께 지워져요. 되돌릴 수 없어요.',
			'지우기',
			async () => {
				await apiFetch(API_ENDPOINTS.ADMIN.NEWSLETTER(id), { method: 'DELETE' });
				showToast('지웠어요.', 'success');
				queryClient.invalidateQueries({ queryKey: ['adminNewsletters'] });
				router.push('/admin/newsletters');
			},
		);

	return (
		<AdminGate>
			<div className={styles.page}>
				<StyledEdit>
					<BackBar text="발행한 뉴스레터" onClick={() => router.push('/admin/newsletters')} />
					<div className="head">
						<Title size="extraSmall" weight="bold">
							뉴스레터 고치기 <span className="id">#{id}</span>
						</Title>
						{data && (
							<div className="meta">
								<Link href={`/articles/detail/${id}`} target="_blank">
									사이트에서 보기 ↗
								</Link>
								<span>조회수 {Number(data.viewcount).toLocaleString()}</span>
								<button type="button" onClick={resetViews}>
									조회수 0으로
								</button>
								<button type="button" className="danger" onClick={remove}>
									지우기
								</button>
							</div>
						)}
					</div>

					{isPending || !form ? (
						<p className="state">{isError ? '불러오지 못했어요.' : '불러오는 중…'}</p>
					) : (
						<div className="layout">
							<form onSubmit={save} className="form">
								<label className="field">
									<span>관심사</span>
									<select value={form.categoryId} onChange={change('categoryId')}>
										{CATEGORIES.filter((c) => c.id).map((c) => (
											<option key={c.id} value={c.id}>
												{c.name}
											</option>
										))}
									</select>
								</label>
								<label className="field">
									<span>제목</span>
									<input value={form.title} onChange={change('title')} maxLength={100} />
								</label>
								<label className="field">
									<span>부제</span>
									<input value={form.subtitle} onChange={change('subtitle')} maxLength={200} />
								</label>
								<label className="field">
									<span>요약 (목록 · 카드 설명)</span>
									<textarea value={form.content} onChange={change('content')} rows={4} maxLength={2000} />
								</label>
								<label className="field">
									<span>키워드 (쉼표로 구분, 10개까지)</span>
									<input value={form.keywords} onChange={change('keywords')} />
								</label>
								<label className="field">
									<span>본문 HTML</span>
									<textarea value={form.html} onChange={change('html')} rows={18} className="code" spellCheck={false} />
									<small>저장할 때 뉴스레터 템플릿이 쓰는 태그 · class만 남기고 script · 이벤트 속성은 지워요.</small>
								</label>
								{error && <p className="error">{error}</p>}
								<div className="actions">
									<Button type="button" scheme="outline" size="medium" onClick={() => data && setForm(toForm(data))}>
										되돌리기
									</Button>
									<Button type="submit" scheme="primary" size="medium" disabled={pending}>
										{pending ? '저장하는 중…' : '저장'}
									</Button>
								</div>
							</form>
							<section className="preview" aria-label="미리보기">
								<p className="preview-label">미리보기 (상세 페이지 본문)</p>
								<h2 className="preview-title">{form.title}</h2>
								{form.subtitle && <p className="preview-subtitle">{form.subtitle}</p>}
								<ArticleContent content={form.html} />
							</section>
						</div>
					)}
				</StyledEdit>
			</div>
		</AdminGate>
	);
}

const StyledEdit = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1.5rem;

	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem 1.25rem;

		.id {
			color: ${({ theme }) => theme.color.subText};
			font-weight: ${({ theme }) => theme.fontWeight.regular};
		}
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem;
		font-size: ${({ theme }) => theme.fontSize.small};
		color: ${({ theme }) => theme.color.subText};

		a,
		button {
			color: ${({ theme }) => theme.color.primary};
			font-size: inherit;
			cursor: pointer;

			&:hover {
				text-decoration: underline;
			}
		}

		.danger {
			color: ${({ theme }) => theme.color.error};
		}
	}

	.state {
		padding: 3rem 0;
		text-align: center;
		color: ${({ theme }) => theme.color.subText};
	}

	/* 왼쪽 고치기 · 오른쪽 미리보기 (태블릿 이하는 위아래) */
	.layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: 2rem;
		align-items: start;

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			grid-template-columns: 1fr;
		}
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.field {
		display: flex;
		flex-direction: column;

		> span {
			${fieldLabel}
		}

		input,
		select,
		textarea {
			${fieldControl}
		}

		textarea {
			height: auto;
			padding: 0.625rem 0.75rem;
			line-height: 1.6;
			resize: vertical;
		}

		.code {
			font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
		}

		small {
			margin-top: 0.375rem;
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			color: ${({ theme }) => theme.color.subText};
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
	}

	/* 미리보기는 따라오게 (긴 본문을 고치며 볼 수 있게) */
	.preview {
		position: sticky;
		top: 4rem;
		max-height: calc(100vh - 6rem);
		overflow-y: auto;
		padding: 1rem 1.25rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			position: static;
			max-height: none;
		}
	}

	.preview-label {
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		color: ${({ theme }) => theme.color.subText};
	}

	.preview-title {
		margin: 0.75rem 0 0.25rem;
		font-size: ${({ theme }) => theme.fontSize.large};
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		word-break: keep-all;
	}

	.preview-subtitle {
		color: ${({ theme }) => theme.color.subText};
		word-break: keep-all;
	}
`;
