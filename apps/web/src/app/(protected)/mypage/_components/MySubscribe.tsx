'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import Link from 'next/link';
import { LuChevronRight, LuMailPlus, LuMail, LuNewspaper, LuStar } from 'react-icons/lu';
import { apiFetch } from '@/api/client';
import API_ENDPOINTS from '@/constants/api';
import { useTab } from '@/hooks/useTab';
import { useAuth } from '@/hooks/useAuth';
import useSubscribe from '@/hooks/useSubscribe';
import { useModal } from '@/hooks/useModal';
import MyMailSheet from '@/app/(protected)/mypage/_components/subscribe/MyMailSheet';
import EmptyState from '@/components/common/EmptyState';
import Image from '@/components/common/Image';
import BookmarkIcon from '@/components/common/icons/BookmarkIcon';
import LinkCopyIcon from '@/components/common/icons/LinkCopyIcon';
import ErrorState from '@/components/common/ErrorState';
import Skeleton from '@/components/common/loader/Skeleton';
import Pagination from '@/components/common/Pagination';
import FilterChips from '@/components/common/FilterChips';
import { CATEGORIES } from '@/constants/categories';
import { errorStateFor, statusOf } from '@/constants/errors';
import { useFolders } from '@/hooks/useFolders';
import { useToast } from '@/hooks/useToast';
import FolderBar, { FolderFilter } from './folders/FolderBar';
import FolderMenu from './folders/FolderMenu';
import ListHead, { FilterRow, SortSelect } from './list/ListHead';

/** 한 쪽에 메일 몇 통 (서버는 20통까지) */
const PAGE_SIZE = 5;

interface MailNewsletter {
	id: number;
	title: string;
	subtitle: string | null;
	image: string | null;
	summary: string | null;
	createdAt: string;
	category: { id: number; name: string };
}

interface Mail {
	sentAt: string;
	/** 메일 제목 (발송 때와 같은 방식으로 다시 만든 것) */
	subject: string | null;
	newsletters: MailNewsletter[];
	starred: boolean;
	folderId: number | null;
}

interface MailsPage {
	items: Mail[];
	total: number;
	/** 거르기와 상관없는 개수: 전체 · 중요 · 폴더 없음 */
	counts: { all: number; starred: number; unfiled: number };
}

/** 받은 메일 한 통 표시 (중요 · 폴더). 목록 · 폴더 개수를 다시 받는다 */
const useMarkMail = () => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	return useMutation({
		mutationFn: (body: { sentAt: string; starred?: boolean; folderId?: number | null }) =>
			apiFetch(API_ENDPOINTS.MY.MAIL_MARK(), { method: 'PATCH', body }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['myMails'] });
			queryClient.invalidateQueries({ queryKey: ['folders'] });
		},
		onError: () => showToast('바꾸지 못했어요. 잠시 뒤 다시 해 주세요.', 'error'),
	});
};

/** '10월 27일 (월) 오전 8:40' (한국 시각) */
const sentText = (iso: string) =>
	new Intl.DateTimeFormat('ko-KR', {
		timeZone: 'Asia/Seoul',
		month: 'long',
		day: 'numeric',
		weekday: 'short',
		hour: 'numeric',
		minute: '2-digit',
	}).format(new Date(iso));

/** 날짜 막대: '2026년 10월 27일 (화)' (한국 시각) */
const issueDate = (iso: string) => {
	const part = (options: Intl.DateTimeFormatOptions) =>
		new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', ...options }).format(new Date(iso));
	return `${part({ year: 'numeric', month: 'long', day: 'numeric' })} (${part({ weekday: 'short' })})`;
};

/**
 * 내 뉴스레터: 내가 실제로 받은 메일함 (보낸 시각별 한 통씩, 최신부터). 누르면 받은 그대로의 메일.
 * 예전엔 오늘 내 관심사 뉴스레터를 보여 줘, 관심사를 바꾼 뒤엔 받은 적 없는 것이 섞였다
 */
export default function MySubscribe() {
	const { user } = useAuth();
	const { setActiveTab } = useTab();
	const { status: isSubscribed = user?.isSubscribed } = useSubscribe();
	const { openModal } = useModal();
	const [page, setPage] = useState(1);
	const [folder, setFolder] = useState<FolderFilter>('all');
	const [starred, setStarred] = useState(false);
	const [categoryId, setCategoryId] = useState('');
	const [order, setOrder] = useState<'desc' | 'asc'>('desc');
	const { data: folders = [] } = useFolders();
	const mark = useMarkMail();
	// 끄는 중인 메일 (보낸 시각). 끄는 동안 폴더 줄 · 화면 위 폴더 칸에 놓으면 옮긴다
	const [dragging, setDragging] = useState<string | null>(null);

	const filters = new URLSearchParams({
		...(starred && { starred: 'true' }),
		...(folder !== 'all' && { folder: String(folder) }),
		...(categoryId && { categoryId }),
		...(order === 'asc' && { order }),
	}).toString();
	const { data, isPending, isError, error, refetch } = useQuery({
		queryKey: ['myMails', user?.id, page, filters],
		queryFn: () => apiFetch<MailsPage>(API_ENDPOINTS.MY.MAILS((page - 1) * PAGE_SIZE, PAGE_SIZE, filters)),
		enabled: !!user,
		placeholderData: (previous) => previous,
	});
	// 거르기를 바꾸면 첫 쪽부터
	const refilter =
		<T,>(set: (value: T) => void) =>
		(value: T) => {
			set(value);
			setPage(1);
		};

	if (!user || isPending) {
		return (
			<MySubscribeStyled aria-busy>
				<div className="cards">
					<Skeleton />
				</div>
			</MySubscribeStyled>
		);
	}

	if (isError) return <ErrorState inline {...errorStateFor(statusOf(error))} onRetry={() => refetch()} />;

	if (data.counts.all === 0) {
		// 받은 메일이 없으면: 구독 중이면 기다리라고, 아니면 구독하라고
		return isSubscribed === null ? (
			<EmptyState
				icon={LuMailPlus}
				title="아직 구독하지 않았어요"
				description={'관심사를 고르면 매일 아침 8시 40분에\n그 관심사만 엮은 뉴스레터를 보내 드려요.'}
				action={{ label: '구독 시작하기', onClick: () => setActiveTab('settings') }}
			/>
		) : (
			<EmptyState
				icon={LuMail}
				title="아직 받은 메일이 없어요"
				description={'매일 아침 8시 40분에 첫 메일이 가요.\n보낸 메일은 여기에 날짜별로 모여요.'}
				action={{ label: '뉴스레터 둘러보기', href: '/articles' }}
			/>
		);
	}

	const folderName = new Map(folders.map((f) => [f.id, f.name]));

	return (
		<MySubscribeStyled>
			<FolderBar
				folders={folders}
				countOf={(f) => f.counts.mails}
				allLabel="모든 메일"
				value={folder}
				onChange={refilter(setFolder)}
				total={data.counts.all}
				unfiled={data.counts.unfiled}
				dragging={dragging ? 1 : 0}
				onDropTo={(folderId) => {
					if (dragging) mark.mutate({ sentAt: dragging, folderId });
					setDragging(null);
				}}
			/>
			<ListHead title="받은 메일" count={data.total}>
				<FilterChips
					label="보기"
					options={[
						{ value: '', label: '전체' },
						{ value: 'starred', label: `중요 ${data.counts.starred}` },
					]}
					value={starred ? 'starred' : ''}
					onChange={refilter((value: string) => setStarred(value === 'starred'))}
				/>
				<SortSelect
					value={order}
					options={[
						{ value: 'desc', label: '최신순' },
						{ value: 'asc', label: '오래된순' },
					]}
					onChange={refilter(setOrder)}
				/>
			</ListHead>
			<FilterRow>
				<FilterChips
					label="관심사"
					options={[
						{ value: '', label: '전체' },
						...CATEGORIES.filter((c) => c.id !== 0).map((c) => ({ value: String(c.id), label: c.name })),
					]}
					value={categoryId}
					onChange={refilter(setCategoryId)}
				/>
			</FilterRow>
			{data.total === 0 ? (
				<p className="empty">이 조건의 메일이 없어요.</p>
			) : (
				/* 받은편지함: 한 줄이 메일 한 통. 누르면 받은 그대로의 메일을 시트로 */
				/* 원래 마이페이지(/legacy/mypage)의 '오늘의 뉴스레터' 모양: 받은 메일마다 날짜 막대(날짜 · 관심사 바로가기)와
				   그 메일의 뉴스레터들(관심사 › · 제목 · 그림 + AI 요약 상자). 중요 · 폴더 · 메일 보기는 날짜 막대 오른쪽 */
				<ol className="issues">
					{data.items.map((mail) => (
						<li key={mail.sentAt} className="issue">
							<div
								className="issue-head"
								draggable
								onDragStart={(event) => {
									event.dataTransfer.effectAllowed = 'move';
									event.dataTransfer.setData('text/plain', mail.subject ?? '');
									setDragging(mail.sentAt);
								}}
								onDragEnd={() => setDragging(null)}
							>
								<time className="issue-date" dateTime={mail.sentAt} title={sentText(mail.sentAt)}>
									{issueDate(mail.sentAt)}
								</time>
								{/* 이 메일에 든 뉴스레터로 바로 가기 */}
								<ul className="issue-nav" aria-label="이 메일의 뉴스레터">
									{mail.newsletters.map((n) => (
										<li key={n.id}>
											<button
												type="button"
												onClick={() =>
													document
														.getElementById(`mail-${mail.sentAt}-${n.id}`)
														?.scrollIntoView({ behavior: 'smooth', block: 'start' })
												}
											>
												{n.category.name}
											</button>
										</li>
									))}
								</ul>
								<div className="issue-actions">
									{folder === 'all' && mail.folderId && (
										<span className="folder-tag">{folderName.get(mail.folderId)}</span>
									)}
									<button
										type="button"
										className="text-btn"
										onClick={() => openModal(<MyMailSheet sentAt={mail.sentAt} />, { size: 'large' })}
									>
										메일로 보기
									</button>
									<FolderMenu
										className="mail-folder"
										label="폴더"
										current={mail.folderId}
										onPick={(folderId) => mark.mutate({ sentAt: mail.sentAt, folderId })}
									/>
									<button
										type="button"
										className={`star-toggle ${mail.starred ? 'on' : ''}`}
										aria-pressed={mail.starred}
										aria-label={mail.starred ? '중요 해제' : '중요 표시'}
										title={mail.starred ? '중요 해제' : '중요 표시'}
										onClick={() => mark.mutate({ sentAt: mail.sentAt, starred: !mail.starred })}
									>
										<LuStar aria-hidden />
									</button>
								</div>
							</div>
							{mail.newsletters.map((n) => (
								<article key={n.id} className="news" id={`mail-${mail.sentAt}-${n.id}`}>
									<Link href={`/articles?categoryId=${n.category.id}`} className="news-category">
										{n.category.name}
										<LuChevronRight aria-hidden />
									</Link>
									<Link href={`/articles/detail/${n.id}`} className="news-title">
										<h3>{n.title}</h3>
									</Link>
									<div className="news-body">
										<div className="news-media">
											<Link href={`/articles/detail/${n.id}`} className="news-image" tabIndex={-1} aria-hidden>
												{n.image ? (
													<Image src={n.image} alt="" ratio="wide" borderRadius="medium" priority={false} />
												) : (
													<LuNewspaper />
												)}
											</Link>
											<div className="news-icons">
												<BookmarkIcon newsId={n.id} newsletterId={n.id} />
												<LinkCopyIcon id={n.id} />
											</div>
										</div>
										<div className="news-summary">
											<strong>AI 요약</strong>
											<p>{n.summary ?? n.subtitle ?? ''}</p>
										</div>
									</div>
								</article>
							))}
						</li>
					))}
				</ol>
			)}
			<Pagination
				className="pagination"
				page={page}
				total={data.total}
				pageSize={PAGE_SIZE}
				onChange={(next) => {
					setPage(next);
					window.scrollTo({ top: 0, behavior: 'smooth' });
				}}
			/>
		</MySubscribeStyled>
	);
}

const MySubscribeStyled = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
	/* 위 여백은 탭 줄이 둔다 */
	padding: 0 0 2rem;

	.empty {
		padding: 2rem 0;
		text-align: center;
		font-size: ${({ theme }) => theme.fontSize.small};
		color: ${({ theme }) => theme.color.subText};
	}

	.pagination {
		margin-top: 0.75rem;
	}

	/* 받은 메일 한 통 = 원래 마이페이지의 '오늘의 뉴스레터' 한 묶음 */
	.issues {
		display: flex;
		flex-direction: column;
		gap: 3rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	/* 날짜 막대: 연한 바탕 · 위아래 줄, 가운데 날짜 · 관심사 바로가기, 오른쪽 위 메일로 보기 · 폴더 · 별 */
	.issue-head {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.625rem;
		padding: 1.25rem 1rem 1rem;
		border-top: 1px solid ${({ theme }) => theme.color.border};
		border-bottom: 1px solid ${({ theme }) => theme.color.border};
		background: ${({ theme }) => theme.color.surface};
	}

	.issue-date {
		font-size: ${({ theme }) => theme.fontSize.medium};
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		color: ${({ theme }) => theme.color.text};
	}

	.issue-nav {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.25rem 1.25rem;
		margin: 0;
		padding: 0;
		list-style: none;

		button {
			padding: 0.125rem 0;
			font: inherit;
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			color: ${({ theme }) => theme.color.mediumGrey};
			cursor: pointer;

			&:hover {
				color: ${({ theme }) => theme.color.primary};
			}
		}
	}

	.issue-actions {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.text-btn,
	.mail-folder .trigger {
		padding: 0.25rem;
		font: inherit;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.subText};
		cursor: pointer;

		&:hover {
			color: ${({ theme }) => theme.color.primary};
			text-decoration: underline;
		}
	}

	/* 뉴스레터 하나: 관심사 › · 큰 제목 · 그림(+ 북마크 · 링크 복사) | AI 요약 상자, 사이는 가는 줄 */
	.news {
		padding: 2.5rem 0;
		scroll-margin-top: 6rem;

		& + .news {
			border-top: 1px solid ${({ theme }) => theme.color.border};
		}
	}

	.news-category {
		display: inline-flex;
		align-items: center;
		gap: 0.125rem;
		margin-bottom: 0.75rem;
		font-size: ${({ theme }) => theme.fontSize.medium};
		font-weight: ${({ theme }) => theme.fontWeight.medium};
		color: ${({ theme }) => theme.color.primary};

		svg {
			width: 1rem;
			height: 1rem;
			transition: transform 0.2s ease;
		}

		&:hover svg {
			transform: translateX(0.25rem);
		}
	}

	.news-title {
		display: block;
		margin-bottom: 1.5rem;
		color: inherit;

		h3 {
			margin: 0;
			font-size: ${({ theme }) => theme.fontSize.large};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			line-height: 1.4;
			word-break: keep-all;
		}

		&:hover h3 {
			color: ${({ theme }) => theme.color.primary};
		}
	}

	.news-body {
		display: flex;
		gap: 1.25rem;
	}

	.news-media {
		flex: 1;
		min-width: 0;
	}

	.news-image {
		display: flex;
		align-items: center;
		justify-content: center;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.tertiary};
		color: ${({ theme }) => theme.color.primary};

		> div {
			width: 100%;
		}

		> svg {
			width: 1.75rem;
			height: 1.75rem;
		}
	}

	.news-icons {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin-top: 0.75rem;
	}

	.news-summary {
		flex: 3;
		min-width: 0;
		padding: 1.25rem 1.5rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.surface};

		strong {
			display: block;
			margin-bottom: 0.625rem;
			font-size: ${({ theme }) => theme.fontSize.small};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
		}

		p {
			margin: 0;
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			line-height: 1.75;
			color: ${({ theme }) => theme.color.mediumGrey};
			word-break: keep-all;
		}
	}

	/* 중요 표시: 꺼지면 회색 빈 별, 켜지면 기본색 꽉 찬 별 (스크랩과 같게) */
	.star-toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		color: ${({ theme }) => theme.color.disabled};
		cursor: pointer;

		svg {
			width: 1.125rem;
			height: 1.125rem;
		}

		&:hover {
			color: ${({ theme }) => theme.color.primary};
		}

		&.on {
			color: ${({ theme }) => theme.color.primary};

			svg {
				fill: currentColor;
			}
		}
	}

	.folder-tag {
		padding: 0 0.5rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.chip};
		background: ${({ theme }) => theme.color.background};
		font-size: 0.75rem;
		color: ${({ theme }) => theme.color.subText};
	}

	/* 좁은 화면: 날짜 막대의 단추들은 날짜 아래로, 그림 위 · 요약 아래로 */
	@media ${({ theme }) => theme.mediaQuery.tablet} {
		.issue-actions {
			position: static;
		}

		.news-body {
			flex-direction: column;
		}

		.news-title h3 {
			font-size: ${({ theme }) => theme.fontSize.medium};
		}
	}
`;
