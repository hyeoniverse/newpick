'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import { LuMailPlus, LuMail, LuNewspaper, LuStar } from 'react-icons/lu';
import { apiFetch } from '@/api/client';
import API_ENDPOINTS from '@/constants/api';
import { useTab } from '@/hooks/useTab';
import { useAuth } from '@/hooks/useAuth';
import useSubscribe from '@/hooks/useSubscribe';
import { useModal } from '@/hooks/useModal';
import MyMailSheet from '@/app/(protected)/mypage/_components/subscribe/MyMailSheet';
import EmptyState from '@/components/common/EmptyState';
import Image from '@/components/common/Image';
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
	/** 메일의 짜임새 (발송 때처럼 고른 분야로 다시 엮은 것). 편집본 · 소식이 없으면 null */
	digest: MailDigest | null;
}

/** 받은 메일은 사이트 뉴스레터를 그대로 붙인 게 아니라, 그날 편집본으로 고른 분야만 다시 엮은 것 */
interface MailDigest {
	/** 오늘 한눈에: 고른 분야 전체에서 중요도 순 */
	top: { category: string; heading: string; line: string }[];
	/** 분야를 넘는 흐름 (고른 분야끼리만) */
	threads: { title: string; text: string; categories: string[] }[];
	/** 분야별 소식 (같은 사건은 한 번만, 다른 분야에도 실렸으면 alsoIn) */
	sections: {
		category: string;
		newsletterId: number;
		title: string;
		stories: { heading: string; alsoIn: string[] }[];
	}[];
	/** 관전 포인트 */
	watch: string[];
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
				/* 받은 메일 한 통 = 카드 한 장: 위 날짜 · 메일로 보기 · 폴더 · 별, 왼쪽 첫 소식 그림,
				   오른쪽 '오늘 한눈에' 앞 3개(메일의 짜임새), 아래 관심사 · 흐름 · 관전 포인트 수. 전체는 '메일로 보기'로 */
				<ul className="mail-cards">
					{data.items.map((mail) => {
						const openMail = () => openModal(<MyMailSheet sentAt={mail.sentAt} />, { size: 'large' });
						const glance = mail.digest?.top.slice(0, 3) ?? [];
						const image = mail.newsletters.find((n) => n.image)?.image;
						return (
							<li
								key={mail.sentAt}
								className="mail-card"
								draggable
								onDragStart={(event) => {
									event.dataTransfer.effectAllowed = 'move';
									event.dataTransfer.setData('text/plain', mail.subject ?? '');
									setDragging(mail.sentAt);
								}}
								onDragEnd={() => setDragging(null)}
							>
								<div className="mail-top">
									<time className="mail-date" dateTime={mail.sentAt} title={sentText(mail.sentAt)}>
										{issueDate(mail.sentAt)}
									</time>
									{folder === 'all' && mail.folderId && (
										<span className="folder-tag">{folderName.get(mail.folderId)}</span>
									)}
									<div className="mail-actions">
										<button type="button" className="text-btn" onClick={openMail}>
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
								<button type="button" className="mail-main" onClick={openMail}>
									<span className="mail-thumb" aria-hidden>
										{image ? (
											<Image src={image} alt="" ratio="wide" borderRadius="medium" priority={false} />
										) : (
											<LuNewspaper />
										)}
									</span>
									<span className="mail-body">
										<span className="mail-subject">{mail.subject ?? mail.newsletters[0]?.title}</span>
										{glance.length > 0 ? (
											<ol className="glance" aria-label="오늘 한눈에">
												{glance.map((t, i) => (
													<li key={t.heading}>
														<span className="glance-no">{String(i + 1).padStart(2, '0')}</span>
														<span className="glance-cat">{t.category}</span>
														<span className="glance-head">{t.heading}</span>
													</li>
												))}
											</ol>
										) : (
											<span className="mail-summary">{mail.newsletters[0]?.summary}</span>
										)}
									</span>
								</button>
								<div className="mail-meta">
									{[...new Set(mail.newsletters.map((n) => n.category.name))].map((c) => (
										<span key={c} className="meta-cat">
											{c}
										</span>
									))}
									{!!mail.digest?.threads.length && <span>분야를 넘는 흐름 {mail.digest.threads.length}</span>}
									{!!mail.digest?.watch.length && <span>관전 포인트 {mail.digest.watch.length}</span>}
								</div>
							</li>
						);
					})}
				</ul>
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

	/* 받은 메일 카드 목록 */
	.mail-cards {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.mail-card {
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.background};
		transition: border-color 0.15s ease;

		&:hover {
			border-color: ${({ theme }) => theme.color.primary};
		}
	}

	/* 카드 위: 날짜 · (폴더 이름표) · 오른쪽 메일로 보기 · 폴더 · 별 */
	.mail-top {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 0.75rem 0 1rem;
	}

	.mail-date {
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		color: ${({ theme }) => theme.color.text};
		font-variant-numeric: tabular-nums;
	}

	.mail-actions {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		margin-left: auto;
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

	/* 카드 가운데: 왼쪽 그림 · 오른쪽 제목 + 오늘 한눈에 앞 3개 */
	.mail-main {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		width: 100%;
		padding: 0.5rem 1rem 0.75rem;
		text-align: left;
		cursor: pointer;

		&:hover .mail-subject {
			color: ${({ theme }) => theme.color.primary};
		}
	}

	.mail-thumb {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 9rem;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.tertiary};
		color: ${({ theme }) => theme.color.primary};

		> div {
			width: 100%;
		}

		> svg {
			width: 1.5rem;
			height: 1.5rem;
		}
	}

	.mail-body {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.mail-subject {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		font-size: ${({ theme }) => theme.fontSize.small};
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		color: ${({ theme }) => theme.color.text};
		transition: color 0.15s ease;
	}

	.mail-summary {
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.mediumGrey};
	}

	/* 오늘 한눈에: 번호 · 관심사 · 제목 한 줄씩 */
	.glance {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin: 0;
		padding: 0;
		list-style: none;

		li {
			display: flex;
			align-items: baseline;
			gap: 0.5rem;
			min-width: 0;
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
		}
	}

	.glance-no {
		flex-shrink: 0;
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		color: ${({ theme }) => theme.color.primary};
		font-variant-numeric: tabular-nums;
	}

	.glance-cat {
		flex-shrink: 0;
		font-size: 0.75rem;
		color: ${({ theme }) => theme.color.subText};
	}

	.glance-head {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		color: ${({ theme }) => theme.color.mediumGrey};
	}

	/* 카드 아래: 관심사 · 흐름 · 관전 포인트 수 */
	.mail-meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem 0.75rem;
		padding: 0.5rem 1rem 0.625rem;
		border-top: 1px solid ${({ theme }) => theme.color.border};
		font-size: 0.75rem;
		color: ${({ theme }) => theme.color.subText};

		.meta-cat {
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};
			color: ${({ theme }) => theme.color.primary};
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

	/* 휴대폰: 그림을 작게 */
	@media ${({ theme }) => theme.mediaQuery.mobile} {
		.mail-thumb {
			width: 5.5rem;
		}

		.mail-main {
			gap: 0.75rem;
		}

		.glance-cat {
			display: none;
		}
	}
`;
