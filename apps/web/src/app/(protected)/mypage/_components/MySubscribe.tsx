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
import { folderTag, listBox, sourceLine, starToggle, textTools } from './list/styles';

/** 한 쪽에 메일 몇 통 (서버는 20통까지) */
const PAGE_SIZE = 10;

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

/** 오른쪽에 쓸 요일 · 시각 '(화) 오전 8:40' (한국 시각). 제목에 날짜가 있어 날짜는 뺀다 */
const sentTime = (iso: string) => {
	const part = (options: Intl.DateTimeFormatOptions) =>
		new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', ...options }).format(new Date(iso));
	return `(${part({ weekday: 'short' })}) ${part({ hour: 'numeric', minute: '2-digit' })}`;
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
				/* 받은편지함: 스크랩과 같은 상자 · 줄. 썸네일 | 위 작은 줄(관심사 · 편수 · 시각) · 제목 / 아래 글자 단추, 오른쪽 별.
				   제목(썸네일 포함)을 누르면 받은 그대로의 메일을 시트로 */
				<ul className="inbox">
					{data.items.map((mail) => (
						<li
							key={mail.sentAt}
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
								className="mail-row"
								onClick={() => openModal(<MyMailSheet sentAt={mail.sentAt} />, { size: 'large' })}
							>
								{/* 메일마다 다른 썸네일: 그 메일 첫 소식의 그림 */}
								<span className="thumb" aria-hidden>
									{mail.newsletters[0]?.image ? (
										<Image src={mail.newsletters[0].image} alt="" ratio="wide" borderRadius="medium" priority={false} />
									) : (
										<LuNewspaper />
									)}
								</span>
								<span className="body">
									<span className="source">
										<span className="category">
											{[...new Set(mail.newsletters.map((n) => n.category.name))].join(' · ')}
										</span>
										<span>뉴스레터 {mail.newsletters.length}편</span>
										<time dateTime={mail.sentAt}>
											<span className="sr-only">{sentText(mail.sentAt)}</span>
											<span aria-hidden>{sentTime(mail.sentAt)}</span>
										</time>
										{/* '모든 메일'에서 어느 폴더인지 */}
										{folder === 'all' && mail.folderId && (
											<span className="folder-tag">{folderName.get(mail.folderId)}</span>
										)}
									</span>
									<span className="subject">{mail.subject ?? mail.newsletters[0]?.title}</span>
								</span>
							</button>
							{/* 줄 단추 안에 단추를 넣지 않게 따로: 별은 오른쪽 위, 글자 단추는 아래 */}
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
							<div className="tools">
								<button
									type="button"
									onClick={() => openModal(<MyMailSheet sentAt={mail.sentAt} />, { size: 'large' })}
								>
									메일 보기
								</button>
								<FolderMenu
									label="폴더 옮기기"
									current={mail.folderId}
									onPick={(folderId) => mark.mutate({ sentAt: mail.sentAt, folderId })}
								/>
							</div>
						</li>
					))}
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

	/* 받은편지함: 스크랩 목록과 같은 상자 · 구분선 · 위 작은 줄 · 아래 글자 단추 · 오른쪽 위 별 */
	.inbox {
		${listBox}

		> li {
			display: grid;
			grid-template-columns: minmax(0, 1fr) auto;
			grid-template-areas:
				'main star'
				'tools tools';
			column-gap: 0.5rem;
			row-gap: 0.625rem;
		}
	}

	.mail-row {
		grid-area: main;
		display: flex;
		align-items: center;
		gap: 1rem;
		min-width: 0;
		padding: 0;
		text-align: left;
		cursor: pointer;

		&:hover .subject {
			color: ${({ theme }) => theme.color.primary};
		}
	}

	/* 썸네일: 첫 소식 그림 (16:9). 그림이 없으면 연한 보라 바탕에 신문 아이콘 */
	.thumb {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 5rem;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.tertiary};
		color: ${({ theme }) => theme.color.primary};

		> svg {
			width: 1.25rem;
			height: 1.25rem;
		}
	}

	.body {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.source {
		${sourceLine}
	}

	.subject {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		font-size: ${({ theme }) => theme.fontSize.small};
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		color: ${({ theme }) => theme.color.text};
		transition: color 0.15s ease;
	}

	.star-toggle {
		${starToggle}
		grid-area: star;
		align-self: start;
		margin: -0.25rem -0.375rem 0 0;
	}

	/* 글자 단추 줄: 썸네일 옆 제목과 같은 자리에서 시작 */
	.tools {
		${textTools}
		grid-area: tools;
		padding-left: 6rem;
	}

	.folder-tag {
		${folderTag}
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}

	@media ${({ theme }) => theme.mediaQuery.mobile} {
		.thumb {
			width: 4rem;
		}

		.mail-row {
			align-items: flex-start;
			gap: 0.75rem;
		}

		.subject {
			display: -webkit-box;
			white-space: normal;
			-webkit-line-clamp: 2;
			-webkit-box-orient: vertical;
			line-height: 1.4;
			word-break: keep-all;
		}

		.tools {
			padding-left: 4.75rem;
		}
	}
`;
