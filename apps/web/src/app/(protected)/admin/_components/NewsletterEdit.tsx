'use client';

import { ACTIONS, ADMIN, COMMON } from '@/copy';
import { useConfirmAction } from '@/hooks/useConfirmAction';
import { ROUTES } from '@/constants/routes';
import { deleteNewsletter, fetchNewsletter, rerunSummary, resetNewsletterViews, updateNewsletter } from '@/api/admin';
import { queryKeys } from '@/api/queryKeys';

import type { Newsletter } from '@newpick/shared';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { errorMessage } from '@/api/client';
import { CATEGORIES } from '@/constants/categories';
import { useToast } from '@/hooks/useToast';

import AdminGate from '@/components/common/auth/AdminGate';
import BackBar from '@/components/common/BackBar';
import Title from '@/components/common/Title';
import Button from '@/components/common/Button';
import ArticleContent from '@/app/articles/detail/[slug]/_components/content/ArticleContent';
import InputSelect from '@/components/common/InputSelect';
import HtmlCodeEditor from './HtmlCodeEditor';
import { compactHtml, formatHtml } from '../_lib/htmlFormat';

type Form = { title: string; subtitle: string; content: string; keywords: string; categoryId: string; html: string };

const toForm = (n: Newsletter): Form => ({
	title: n.title,
	subtitle: n.subtitle ?? '',
	content: n.content,
	keywords: (n.keywords ?? []).join(', '),
	categoryId: String(n.categoryId),
	// 저장된 본문은 한 줄로 붙어 있어, 고치기 쉽게 줄 · 들여쓰기로 펼쳐 보여 준다 (저장할 때 다시 붙임)
	html: formatHtml(n.contentAsHTML ?? ''),
});

const CATEGORY_OPTIONS = CATEGORIES.filter((c) => c.id).map((c) => ({ value: String(c.id), label: c.name }));

/**
 * 관리자 CMS (#31): 뉴스레터 한 편 고치기. AI 요약이 잘못 나왔을 때 지우지 않고 고친다.
 * 본문 HTML은 서버가 허용 목록으로 정리해 저장한다(XSS). 이미 보낸 메일은 그대로, 상세 페이지 · 이후 메일에 반영.
 * 조회수 초기화 · 지우기도 여기서
 */
export default function NewsletterEdit({ id }: { id: number }) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const [form, setForm] = useState<Form | null>(null);
	const [pending, setPending] = useState(false);
	const [error, setError] = useState('');

	const { data, isPending, isError } = useQuery({
		queryKey: queryKeys.admin.newsletter(id),
		queryFn: () => fetchNewsletter(id),
	});
	useEffect(() => {
		if (data) setForm(toForm(data));
	}, [data]);

	const set = (key: keyof Form) => (value: string) => setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
	const change =
		(key: keyof Form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
			setForm((prev) => (prev ? { ...prev, [key]: event.target.value } : prev));

	const save = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!form || !data) return;
		if (!form.title.trim() || !form.content.trim()) return setError(ADMIN.edit.required);
		setPending(true);
		setError('');
		try {
			await updateNewsletter(id, {
				title: form.title,
				subtitle: form.subtitle,
				content: form.content,
				keywords: form.keywords
					.split(',')
					.map((k) => k.trim())
					.filter(Boolean),
				categoryId: Number(form.categoryId),
				...(form.html !== toForm(data).html && { contentAsHTML: compactHtml(form.html) }),
			});
			showToast(ADMIN.edit.saved, 'success');
			queryClient.invalidateQueries({ queryKey: queryKeys.admin.newsletter(id) });
			queryClient.invalidateQueries({ queryKey: queryKeys.admin.newsletters.all });
		} catch (e) {
			setError(errorMessage(e, COMMON.saveFailed));
		} finally {
			setPending(false);
		}
	};

	const confirmAction = useConfirmAction();
	/** 묻고 실행 (알림은 run 안에서) */
	const confirm = (title: string, content: string, label: string, run: () => Promise<void>) =>
		confirmAction({ title, content, confirmLabel: label, run, failure: ADMIN.edit.failed });

	const resetViews = () =>
		confirm(ADMIN.edit.resetTitle, ADMIN.edit.resetBody, '되돌리기', async () => {
			await resetNewsletterViews(id);
			showToast(ADMIN.edit.resetDone, 'success');
			queryClient.invalidateQueries({ queryKey: queryKeys.admin.newsletter(id) });
		});

	// AI로 다시 쓰기: 그날 · 그 관심사 기사로 새로 써서 이 뉴스레터를 바꾼다 (id · 발행일 · 조회수 · 북마크는 그대로)
	const regenerate = () =>
		confirm(ADMIN.edit.rewriteTitle, ADMIN.edit.rewriteBody, '다시 작성', async () => {
			await rerunSummary({ newsletterId: id });
			showToast(ADMIN.edit.rewriteStarted, 'success');
			setTimeout(() => {
				queryClient.invalidateQueries({ queryKey: queryKeys.admin.newsletter(id) });
				queryClient.invalidateQueries({ queryKey: queryKeys.admin.newsletters.all });
			}, 90_000);
		});

	const remove = () =>
		confirm(ADMIN.edit.deleteTitle, ADMIN.edit.deleteBody, ACTIONS.remove, async () => {
			await deleteNewsletter(id);
			showToast(COMMON.deleted, 'success');
			queryClient.invalidateQueries({ queryKey: queryKeys.admin.newsletters.all });
			router.push(ROUTES.admin.newsletters);
		});

	return (
		<AdminGate>
			<div className="np-protected-page">
				<div className="np-admin-newsletter-edit-edit">
					<BackBar text="발행한 뉴스레터" onClick={() => router.push(ROUTES.admin.newsletters)} />
					<div className="head">
						<Title size="extraSmall" weight="bold">
							뉴스레터 고치기 <span className="id">#{id}</span>
						</Title>
						{data && (
							<div className="meta">
								<Link href={ROUTES.article(id)} target="_blank">
									사이트에서 보기 ↗
								</Link>
								<span>조회수 {Number(data.viewcount).toLocaleString()}</span>
								<button type="button" onClick={resetViews}>
									조회수 0으로
								</button>
								<button type="button" onClick={regenerate}>
									AI로 다시 작성
								</button>
								<button type="button" className="danger" onClick={remove}>
									{ACTIONS.remove}
								</button>
							</div>
						)}
					</div>

					{isPending || !form ? (
						<p className="state">{isError ? COMMON.loadFailed : COMMON.loading}</p>
					) : (
						<div className="layout">
							<form onSubmit={save} className="form">
								<div className="field">
									<InputSelect
										name="categoryId"
										label="관심사"
										value={form.categoryId}
										options={CATEGORY_OPTIONS}
										onChange={set('categoryId')}
									/>
								</div>
								<label className="field">
									<span className="np-field-label">제목</span>
									<input className="np-field-control" value={form.title} onChange={change('title')} maxLength={100} />
								</label>
								<label className="field">
									<span className="np-field-label">부제</span>
									<input
										className="np-field-control"
										value={form.subtitle}
										onChange={change('subtitle')}
										maxLength={200}
									/>
								</label>
								<label className="field">
									<span className="np-field-label">요약 (목록 · 카드 설명)</span>
									<textarea
										className="np-field-control"
										value={form.content}
										onChange={change('content')}
										rows={4}
										maxLength={2000}
									/>
								</label>
								<label className="field">
									<span className="np-field-label">키워드 (쉼표로 구분, 10개까지)</span>
									<input className="np-field-control" value={form.keywords} onChange={change('keywords')} />
								</label>
								<div className="field">
									<div className="code-head">
										<label htmlFor="newsletter-html" className="np-field-label">
											본문 HTML
										</label>
										<button type="button" onClick={() => set('html')(formatHtml(form.html))}>
											줄 정리
										</button>
									</div>
									<HtmlCodeEditor id="newsletter-html" value={form.html} onChange={set('html')} rows={22} />
									<small>{ADMIN.edit.htmlNote}</small>
								</div>
								{error && <p className="error">{error}</p>}
								<div className="actions">
									<Button type="button" scheme="outline" size="medium" onClick={() => data && setForm(toForm(data))}>
										되돌리기
									</Button>
									<Button type="submit" scheme="primary" size="medium" disabled={pending}>
										{pending ? ACTIONS.saving : ACTIONS.save}
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
				</div>
			</div>
		</AdminGate>
	);
}
