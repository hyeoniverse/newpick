'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import { LuMailPlus, LuMail, LuStar } from 'react-icons/lu';
import { apiFetch } from '@/api/client';
import API_ENDPOINTS from '@/constants/api';
import { useTab } from '@/hooks/useTab';
import { useAuth } from '@/hooks/useAuth';
import useSubscribe from '@/hooks/useSubscribe';
import { useModal } from '@/hooks/useModal';
import MyMailSheet from '@/app/(protected)/mypage/_components/subscribe/MyMailSheet';
import EmptyState from '@/components/common/EmptyState';
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

/** 한 쪽에 메일 몇 통 */
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

/** 제호 줄 날짜: '2026년 10월 27일 화요일' (한국 시각) */
const issueDate = (iso: string) =>
	new Intl.DateTimeFormat('ko-KR', {
		timeZone: 'Asia/Seoul',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		weekday: 'long',
	}).format(new Date(iso));

/** 제목 앞 '10월 27일 뉴픽 · '은 제호 줄과 겹쳐 뺀다 */
const headline = (subject: string) => subject.replace(/^\d+월 \d+일 뉴픽 · /, '');

/** 받은 지 하루가 안 된 메일 (NEW) */
const isNew = (iso: string) => Date.now() - new Date(iso).getTime() < 24 * 60 * 60 * 1000;

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
				/* 신문 지면처럼: 메일 한 통이 한 '호'. 제호 줄(뉴픽 · 제 N호 · 날짜) 아래 세리프 큰 제목, 관심사 · 첫 소식 요약.
				   누르면 받은 그대로의 메일을 시트로 */
				<ol className="issues">
					{data.items.map((mail, index) => {
						const first = mail.newsletters[0];
						const fresh = isNew(mail.sentAt);
						// 호수: 받은 메일 중 몇 번째인지 (첫 메일 = 제 1호)
						const issueNo =
							order === 'desc' ? data.total - ((page - 1) * PAGE_SIZE + index) : (page - 1) * PAGE_SIZE + index + 1;
						return (
							<li
								key={mail.sentAt}
								className={fresh ? 'fresh' : undefined}
								draggable
								onDragStart={(event) => {
									event.dataTransfer.effectAllowed = 'move';
									event.dataTransfer.setData('text/plain', mail.subject ?? '');
									setDragging(mail.sentAt);
								}}
								onDragEnd={() => setDragging(null)}
							>
								<div className="masthead">
									<span className="nameplate">뉴픽</span>
									<span className="no">제 {issueNo}호</span>
									{fresh && <span className="today">오늘 자</span>}
									<time dateTime={mail.sentAt}>{issueDate(mail.sentAt)}</time>
									{/* 줄 단추 안에 단추를 넣지 않게 제호 줄에 따로 */}
									<span className="actions">
										{folder === 'all' && mail.folderId && (
											<span className="folder-tag">{folderName.get(mail.folderId)}</span>
										)}
										<FolderMenu
											className="folder-trigger"
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
									</span>
								</div>
								<button
									type="button"
									className="main"
									onClick={() => openModal(<MyMailSheet sentAt={mail.sentAt} />, { size: 'large' })}
								>
									<span className="headline">{headline(mail.subject ?? first?.title ?? '')}</span>
									<span className="deck">
										<span className="section">
											{[...new Set(mail.newsletters.map((n) => n.category.name))].join(' · ')}
											<small>{mail.newsletters.length}편</small>
										</span>
										{first?.summary && <span className="lead">{first.summary}</span>}
									</span>
								</button>
							</li>
						);
					})}
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

	/* 신문 지면 목록: 호마다 위 굵은 줄 + 가는 줄(이중선) 제호, 아래 세리프 큰 제목 */
	.issues {
		display: flex;
		flex-direction: column;
		gap: 2.25rem;
		margin: 0.5rem 0 0;
		padding: 0;
		list-style: none;
	}

	.masthead {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem 0.75rem;
		padding: 0.5rem 0 0.5rem;
		border-top: 3px solid ${({ theme }) => theme.color.text};
		border-bottom: 1px solid ${({ theme }) => theme.color.text};
		font-size: 0.75rem;
		color: ${({ theme }) => theme.color.subText};
		font-variant-numeric: tabular-nums;

		.nameplate {
			font-family: var(--font-serif), serif;
			font-size: 1rem;
			font-weight: 900;
			letter-spacing: -0.02em;
			color: ${({ theme }) => theme.color.text};
		}

		.no {
			padding-left: 0.75rem;
			border-left: 1px solid ${({ theme }) => theme.color.border};
		}

		.today {
			padding: 0.0625rem 0.5rem;
			background: ${({ theme }) => theme.color.primary};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			color: #ffffff;
		}

		.actions {
			display: flex;
			align-items: center;
			gap: 0.25rem;
			margin-left: auto;
		}
	}

	.fresh .masthead {
		border-top-color: ${({ theme }) => theme.color.primary};
	}

	.main {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
		padding: 1rem 0 0;
		text-align: left;
		cursor: pointer;

		&:hover .headline {
			text-decoration: underline;
			text-decoration-thickness: 1px;
			text-underline-offset: 0.2em;
		}
	}

	.headline {
		font-family: var(--font-serif), serif;
		font-size: 1.625rem;
		font-weight: 900;
		line-height: 1.3;
		letter-spacing: -0.02em;
		word-break: keep-all;
		color: ${({ theme }) => theme.color.text};
	}

	/* 제목 아래: 왼쪽 면 이름(관심사), 오른쪽 첫 소식 리드 — 세로 가는 줄로 나눔 */
	.deck {
		display: flex;
		gap: 1rem;
	}

	.section {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		width: 5rem;
		font-size: 0.8125rem;
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		color: ${({ theme }) => theme.color.primary};

		small {
			font-size: 0.75rem;
			font-weight: ${({ theme }) => theme.fontWeight.regular};
			color: ${({ theme }) => theme.color.subText};
		}
	}

	.lead {
		display: -webkit-box;
		overflow: hidden;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		padding-left: 1rem;
		border-left: 1px solid ${({ theme }) => theme.color.border};
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		line-height: 1.7;
		color: ${({ theme }) => theme.color.mediumGrey};
	}

	/* 중요 표시: 꺼지면 회색 빈 별, 켜지면 기본색 꽉 찬 별 (스크랩과 같게) */
	.star-toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		color: ${({ theme }) => theme.color.disabled};
		cursor: pointer;

		svg {
			width: 1rem;
			height: 1rem;
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

	.folder-trigger .trigger {
		padding: 0.25rem;
		font: inherit;
		color: ${({ theme }) => theme.color.subText};
		cursor: pointer;

		&:hover {
			color: ${({ theme }) => theme.color.primary};
			text-decoration: underline;
		}
	}

	.folder-tag {
		padding: 0 0.5rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		font-size: 0.6875rem;
	}

	@media ${({ theme }) => theme.mediaQuery.mobile} {
		.issues {
			gap: 1.75rem;
		}

		.masthead time {
			flex-basis: 100%;
			order: 5;
		}

		.headline {
			font-size: 1.3125rem;
		}

		.deck {
			flex-direction: column;
			gap: 0.5rem;
		}

		.section {
			flex-direction: row;
			gap: 0.5rem;
			width: auto;
		}

		.lead {
			padding-left: 0;
			border-left: none;
		}

		.folder-tag {
			display: none;
		}
	}
`;
