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

/** 날짜 칸 · 시각에 쓸 조각 (한국 시각): { day: '27', month: '10월', weekday: '화', time: '오전 8:40' } */
const sentParts = (iso: string) => {
	const date = new Date(iso);
	const part = (options: Intl.DateTimeFormatOptions) =>
		new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', ...options }).format(date);
	return {
		day: part({ day: 'numeric' }).replace('일', ''),
		month: part({ month: 'long' }),
		weekday: part({ weekday: 'short' }),
		time: part({ hour: 'numeric', minute: '2-digit' }),
	};
};

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
				/* 받은편지함: 한 줄이 메일 한 통 (왼쪽 날짜 칸 · 보낸 이 · 제목 · 미리보기). 누르면 받은 그대로의 메일을 시트로 */
				<ul className="inbox">
					{data.items.map((mail) => {
						const first = mail.newsletters[0];
						const when = sentParts(mail.sentAt);
						const fresh = isNew(mail.sentAt);
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
								<button
									type="button"
									className="main"
									onClick={() => openModal(<MyMailSheet sentAt={mail.sentAt} />, { size: 'large' })}
								>
									{/* 매일 한 통이라 날짜가 곧 메일의 이름: 달력 한 장처럼 */}
									<span className="date" aria-hidden>
										<span className="day">{when.day}</span>
										<span className="mon">
											{when.month} {when.weekday}
										</span>
									</span>
									<span className="body">
										<span className="from">
											<strong>뉴픽</strong>
											{fresh && <span className="new">NEW</span>}
											<span className="cats">
												{[...new Set(mail.newsletters.map((n) => n.category.name))].join(' · ')}
											</span>
										</span>
										<span className="subject">{mail.subject ?? first?.title}</span>
										{first?.summary && <span className="preview">{first.summary}</span>}
									</span>
								</button>
								{/* 줄 단추 안에 단추를 넣지 않게 옆에 따로 */}
								<div className="side">
									<time dateTime={mail.sentAt} title={sentText(mail.sentAt)}>
										{when.time}
									</time>
									{/* '모든 메일'에서 어느 폴더인지 */}
									{folder === 'all' && mail.folderId && (
										<span className="folder-tag">{folderName.get(mail.folderId)}</span>
									)}
									<span className="actions">
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

	/* 받은편지함: 테두리 상자 한 장, 메일 사이 구분선 (북마크의 그림 카드와 다르게 글 위주) */
	.inbox {
		margin: 0;
		padding: 0;
		list-style: none;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};
		overflow: hidden;

		> li {
			display: flex;
			align-items: stretch;
			transition: background 0.15s ease;

			& + li {
				border-top: 1px solid ${({ theme }) => theme.color.border};
			}

			&:hover {
				background: ${({ theme }) => theme.color.surface};

				.subject {
					color: ${({ theme }) => theme.color.primary};
				}
			}
		}
	}

	.main {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		gap: 1.25rem;
		padding: 1.125rem 0 1.125rem 1.25rem;
		text-align: left;
		cursor: pointer;
	}

	/* 날짜 칸: 달력 한 장. 오늘 온 메일은 보라로 채움 */
	.date {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 3.75rem;
		height: 3.75rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.background};

		.day {
			font-size: 1.375rem;
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			line-height: 1.1;
			color: ${({ theme }) => theme.color.text};
			font-variant-numeric: tabular-nums;
		}

		.mon {
			font-size: 0.6875rem;
			color: ${({ theme }) => theme.color.subText};
		}
	}

	.fresh .date {
		border-color: ${({ theme }) => theme.color.primary};
		background: ${({ theme }) => theme.color.primary};

		.day,
		.mon {
			color: #ffffff;
		}
	}

	.body {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.from {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: ${({ theme }) => theme.color.subText};

		strong {
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			color: ${({ theme }) => theme.color.text};
		}

		.cats {
			color: ${({ theme }) => theme.color.primary};
		}

		.new {
			padding: 0.0625rem 0.375rem;
			border-radius: ${({ theme }) => theme.radius.chip};
			background: ${({ theme }) => theme.color.primary};
			font-size: 0.625rem;
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			color: #ffffff;
		}
	}

	.subject,
	.preview {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.subject {
		font-size: ${({ theme }) => theme.fontSize.small};
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		color: ${({ theme }) => theme.color.text};
		transition: color 0.15s ease;
	}

	.preview {
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.subText};
	}

	/* 오른쪽: 위 받은 시각(· 폴더), 아래 폴더 · 별 */
	.side {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		justify-content: space-between;
		gap: 0.25rem;
		padding: 1rem 1rem 0.75rem 0.75rem;

		time {
			font-size: 0.75rem;
			color: ${({ theme }) => theme.color.subText};
			font-variant-numeric: tabular-nums;
		}
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.folder-trigger .trigger {
		padding: 0.25rem;
		font: inherit;
		font-size: 0.75rem;
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
		border-radius: ${({ theme }) => theme.radius.chip};
		background: ${({ theme }) => theme.color.background};
		font-size: 0.6875rem;
		color: ${({ theme }) => theme.color.subText};
	}

	@media ${({ theme }) => theme.mediaQuery.mobile} {
		.main {
			gap: 0.875rem;
			padding: 0.875rem 0 0.875rem 0.875rem;
		}

		.date {
			width: 3.25rem;
			height: 3.25rem;
		}

		.preview,
		.folder-tag {
			display: none;
		}

		/* 좁은 화면: 제목을 두 줄까지 (미리보기는 뺌) */
		.subject {
			display: -webkit-box;
			white-space: normal;
			-webkit-line-clamp: 2;
			-webkit-box-orient: vertical;
			line-height: 1.4;
		}

		.side {
			padding: 0.875rem 0.625rem 0.5rem 0.25rem;
		}
	}

	/* 중요 표시: 꺼지면 회색 빈 별, 켜지면 기본색 꽉 찬 별 (스크랩과 같게) */
	.star-toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: ${({ theme }) => theme.radius.control};
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
`;
