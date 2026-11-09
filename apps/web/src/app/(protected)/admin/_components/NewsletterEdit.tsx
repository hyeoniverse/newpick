'use client';

import { deleteNewsletter, fetchNewsletter, rerunSummary, resetNewsletterViews, updateNewsletter } from '@/api/admin';
import { queryKeys } from '@/api/queryKeys';

import type { Newsletter } from '@newpick/shared';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LuTriangleAlert } from 'react-icons/lu';
import { ApiError } from '@/api/client';
import { CATEGORIES } from '@/constants/categories';
import { useToast } from '@/hooks/useToast';
import { useModal } from '@/hooks/useModal';
import AdminGate from '@/components/common/auth/AdminGate';
import BackBar from '@/components/common/BackBar';
import Title from '@/components/common/Title';
import Button from '@/components/common/Button';
import ModalContents from '@/components/common/modal/ModalContent';
import ArticleContent from '@/app/articles/detail/[slug]/_components/content/ArticleContent';
import InputSelect from '@/components/common/InputSelect';
import HtmlCodeEditor from './HtmlCodeEditor';
import { compactHtml, formatHtml } from './htmlFormat';

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
	const { openModal, closeModal } = useModal();
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
		if (!form.title.trim() || !form.content.trim()) return setError('제목과 요약은 비울 수 없어요.');
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
			showToast('고쳤어요. 상세 페이지와 이후 메일에 반영돼요.', 'success');
			queryClient.invalidateQueries({ queryKey: queryKeys.admin.newsletter(id) });
			queryClient.invalidateQueries({ queryKey: queryKeys.admin.newsletters.all });
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
			await resetNewsletterViews(id);
			showToast('조회수를 0으로 되돌렸어요.', 'success');
			queryClient.invalidateQueries({ queryKey: queryKeys.admin.newsletter(id) });
		});

	// AI로 다시 쓰기: 그날 · 그 관심사 기사로 새로 써서 이 뉴스레터를 바꾼다 (id · 발행일 · 조회수 · 북마크는 그대로)
	const regenerate = () =>
		confirm(
			'AI로 다시 작성하시겠습니까?',
			'이 뉴스레터가 발행된 날 수집된 기사로 내용을 새로 작성합니다. 주소 · 발행일 · 조회수 · 북마크는 유지되며, 직접 수정한 내용은 사라집니다. 스크랩한 문장이 새 본문에 없으면 위치를 찾지 못할 수 있습니다. Claude 비용이 발생하며 1~2분 소요됩니다.',
			'다시 작성',
			async () => {
				await rerunSummary({ newsletterId: id });
				showToast('다시 작성을 시작했습니다. 1~2분 후 새로고침하면 변경된 내용이 표시됩니다.', 'success');
				setTimeout(() => {
					queryClient.invalidateQueries({ queryKey: queryKeys.admin.newsletter(id) });
					queryClient.invalidateQueries({ queryKey: queryKeys.admin.newsletters.all });
				}, 90_000);
			},
		);

	const remove = () =>
		confirm(
			'이 뉴스레터를 지울까요?',
			'상세 페이지 · 목록에서 사라지고 북마크 · 발송 기록도 함께 지워져요. 되돌릴 수 없어요.',
			'지우기',
			async () => {
				await deleteNewsletter(id);
				showToast('지웠어요.', 'success');
				queryClient.invalidateQueries({ queryKey: queryKeys.admin.newsletters.all });
				router.push('/admin/newsletters');
			},
		);

	return (
		<AdminGate>
			<div className="np-protected-page">
				<div className="np-admin-newsletter-edit-edit">
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
								<button type="button" onClick={regenerate}>
									AI로 다시 작성
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
									<small>저장할 때 뉴스레터 템플릿이 쓰는 태그 · class만 남기고 script · 이벤트 속성은 지워요.</small>
								</div>
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
				</div>
			</div>
		</AdminGate>
	);
}
