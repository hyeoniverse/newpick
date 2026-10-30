'use client';

import { useState } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import BookmarkIcon from '@/components/common/icons/BookmarkIcon';
import { LuBookmark, LuEye } from 'react-icons/lu';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import FilterChips from '@/components/common/FilterChips';
import Skeleton from '@/components/common/loader/Skeleton';
import { errorStateFor, statusOf } from '@/constants/errors';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBookmarkPages, useMoveBookmarksMutation } from '@/hooks/useBookmark';
import { useFolders } from '@/hooks/useFolders';
import { dateFormatter } from '@/utils/formatter';
import { getFirstImage } from '@/utils/getFirstImage';
import FolderBar, { FolderFilter } from './folders/FolderBar';
import FolderMenu from './folders/FolderMenu';
import ListHead, { FilterRow, SortSelect } from './list/ListHead';
import LoadMore from './list/LoadMore';
import Thumb from './list/Thumb';
import { sourceLine, textTools } from './list/styles';

/** 정렬: 북마크한 순 · 발행일순 · 조회수순 (서버에서 줄 세움) */
const SORTS = [
	{ value: 'bookmarked', label: '북마크한 순' },
	{ value: 'published', label: '발행일순' },
	{ value: 'views', label: '조회수순' },
];

/**
 * 마이페이지 북마크 (#123): 폴더(스크랩 · 받은 메일과 같은 폴더) · 관심사 거르기 · 정렬.
 * 서버에서 거르고 줄 세워 한 쪽(24개)씩 받고, 끝의 '더 보기'로 이어 붙인다. 카드마다 '폴더 옮기기'
 */
function MyBookmark() {
	const { user } = useAuthStore();
	const [folder, setFolder] = useState<FolderFilter>('all');
	const [category, setCategory] = useState('');
	const [sort, setSort] = useState('bookmarked');
	const filters = new URLSearchParams({
		...(folder !== 'all' && { folder: String(folder) }),
		...(category && { categoryId: category }),
		...(sort !== 'bookmarked' && { sort }),
	}).toString();
	const { data, isPending, isError, error, refetch, fetchNextPage, isFetchingNextPage } = useBookmarkPages(filters);
	const { data: folders = [] } = useFolders();
	const move = useMoveBookmarksMutation();
	// 끄는 중인 북마크. 끄는 동안 폴더 줄 · 화면 위 폴더 칸에 놓으면 옮긴다
	const [dragging, setDragging] = useState<number | null>(null);

	// 마이페이지는 로그인해야 들어오므로(가드) 사용자 정보를 받는 중이거나 목록을 받는 중이면 자리만 채운다 (#17)
	if (!user || isPending) {
		return (
			<MyBookmarkStyled aria-busy>
				<div className="trend-cards">
					<Skeleton />
				</div>
			</MyBookmarkStyled>
		);
	}

	if (isError) {
		return <ErrorState inline {...errorStateFor(statusOf(error))} onRetry={() => refetch()} />;
	}

	const first = data.pages[0];
	if (first.counts.all === 0) {
		return (
			<EmptyState
				icon={LuBookmark}
				title="북마크한 뉴스레터가 없어요"
				description="마음에 드는 뉴스레터에서 북마크를 누르면 여기에 모여요."
				action={{ label: '뉴스레터 둘러보기', href: '/articles' }}
			/>
		);
	}

	const shown = data.pages.flatMap((p) => p.items);
	const total = data.pages[data.pages.length - 1].total;
	const folderName = new Map(folders.map((f) => [f.id, f.name]));

	return (
		<MyBookmarkStyled>
			<FolderBar
				folders={folders}
				countOf={(f) => f.counts.bookmarks}
				allLabel="모든 북마크"
				value={folder}
				onChange={setFolder}
				total={first.counts.all}
				unfiled={first.counts.unfiled}
				dragging={dragging ? 1 : 0}
				onDropTo={(folderId) => {
					if (dragging) move.mutate({ newsletterIds: [dragging], folderId });
					setDragging(null);
				}}
			/>
			<ListHead title="북마크" count={total}>
				<SortSelect value={sort} options={SORTS} onChange={setSort} />
			</ListHead>
			{/* 관심사가 둘 이상일 때만 거르기 줄 */}
			{first.categories.length > 1 && (
				<FilterRow>
					<FilterChips
						label="관심사"
						options={[
							{ value: '', label: '전체' },
							...first.categories.map(({ id, name }) => ({ value: String(id), label: name })),
						]}
						value={category}
						onChange={setCategory}
					/>
				</FilterRow>
			)}
			{shown.length === 0 ? (
				<p className="empty">이 조건의 북마크가 없어요.</p>
			) : (
				/* 북마크: 그림이 위에 오는 작은 카드 격자 (줄 목록인 내 뉴스레터와 다르게 모아 둔 기사 모음처럼, 한 줄에 4장 · 휴대폰 2장). 카드를 끌면 폴더로 */
				<ul className="grid">
					{shown.map((bookmark) => (
						<li
							key={bookmark.id}
							draggable
							onDragStart={(event) => {
								event.dataTransfer.effectAllowed = 'move';
								setDragging(bookmark.id);
							}}
							onDragEnd={() => setDragging(null)}
						>
							{/* 썸네일: 카드 왼쪽 위아래를 다 채운다. 같은 글로 가는 링크라 키보드 · 화면 읽기에서는 뺀다 */}
							<Link
								href={`/articles/detail/${bookmark.id}`}
								className="thumb-link"
								tabIndex={-1}
								aria-hidden
								draggable={false}
							>
								<Thumb src={getFirstImage(bookmark.newsImg)} className="thumb" />
							</Link>
							<div className="content">
								<Link href={`/articles/detail/${bookmark.id}`} className="main" draggable={false}>
									<span className="body">
										<span className="kicker">
											{/* 관심사: 메일 · 스크랩 블록의 관심사 칩과 같은 모양 */}
											<span className="cat">{bookmark.category.name}</span>
											<span>{dateFormatter(bookmark.newsCreatedAt)}</span>
										</span>
										<span className="title">{bookmark.newsTitle}</span>
									</span>
								</Link>
								<div className="foot">
									<span className="meta">
										<LuEye aria-hidden /> {bookmark.viewcount.toLocaleString()}
									</span>
									<span className="actions">
										{/* 내 뉴스레터와 같은 글: '모든 북마크'에서는 어느 폴더인지도 */}
										<FolderMenu
											label={
												folder === 'all' && bookmark.folderId ? `폴더 · ${folderName.get(bookmark.folderId)}` : '폴더'
											}
											current={bookmark.folderId}
											onPick={(folderId) => move.mutate({ newsletterIds: [bookmark.id], folderId })}
										/>
										<BookmarkIcon newsId={bookmark.id} newsletterId={bookmark.id} />
									</span>
								</div>
							</div>
						</li>
					))}
				</ul>
			)}
			<LoadMore remaining={total - shown.length} loading={isFetchingNextPage} onClick={() => fetchNextPage()} />
		</MyBookmarkStyled>
	);
}

const MyBookmarkStyled = styled.div`
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

	.trend-cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 2rem;
	}

	/* 북마크 카드 격자: 칸 수는 화면이 아니라 '목록이 실제로 차지하는 너비'로 정한다 (컨테이너 쿼리, 아래) */
	container-type: inline-size;

	.grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 0.75rem;
		margin: 0;
		padding: 0;
		list-style: none;

		/* 카드 비율 고정(4:1, 납작하고 작게): 화면 너비가 바뀌어도 옆으로만 늘어나지 않고 같은 모양으로 커지고 작아진다 */
		> li {
			display: flex;
			aspect-ratio: 4 / 1;
			/* overflow를 두지 않아야 글이 넘칠 때(글자 크기를 키운 경우 등) 잘리지 않고 카드가 늘어난다. 둥근 모서리는 썸네일 쪽에서 */
			border: 1px solid ${({ theme }) => theme.color.border};
			border-radius: ${({ theme }) => theme.radius.surface};
			background: ${({ theme }) => theme.color.background};
			transition: border-color 0.15s ease;

			&:hover {
				border-color: ${({ theme }) => theme.color.primary};

				.title {
					color: ${({ theme }) => theme.color.primary};
				}
			}
		}
	}

	/* 컴팩트 가로형 카드: 왼쪽 썸네일이 카드 위아래를 다 채우고, 오른쪽에 관심사 · 날짜 · 제목 / 아래 줄(조회수 · 폴더 옮기기 · 북마크) */
	.thumb-link {
		flex-shrink: 0;
		display: block;
		/* 카드 4:1에서 폭의 1/4이면 썸네일이 정사각형 */
		width: 25%;
		overflow: hidden;
		border-radius: ${({ theme }) => theme.radius.surface} 0 0 ${({ theme }) => theme.radius.surface};
		border-right: 1px solid ${({ theme }) => theme.color.border};
	}

	.thumb {
		height: 100%;

		/* 공통 그림 칸(16:9 고정)을 카드 높이에 맞춰 채운다 */
		> div,
		.thumb-empty {
			height: 100%;
			aspect-ratio: auto;
		}

		img {
			height: 100%;
			object-fit: cover;
		}
	}

	.content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.main {
		flex: 1;
		display: block;
		padding: 0.5rem 0.75rem 0;
		color: inherit;
		text-decoration: none;
	}

	.body {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	/* 제목 위 작은 줄: 메일 · 스크랩과 같은 모양 (관심사 보라 · 굵게, 날짜 회색) */
	.kicker {
		${sourceLine}
		/* 납작한 카드라 머리줄은 조금 작게 */
		font-size: 0.75rem;
		line-height: 1.4;
		.cat {
			padding: 0 0.5rem;
			border-radius: ${({ theme }) => theme.radius.chip};
			background: ${({ theme }) => theme.color.tertiary};
			font-weight: ${({ theme }) => theme.fontWeight.medium};
			color: ${({ theme }) => theme.color.primary};
			white-space: nowrap;
		}
	}

	.title {
		display: -webkit-box;
		overflow: hidden;
		/* 납작한 카드라 제목은 한 줄 (넘치면 …) */
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		line-height: 1.35;
		/* 한글 낱말 중간에서 줄이 넘어가지 않게 */
		word-break: keep-all;
		color: ${({ theme }) => theme.color.text};
		transition: color 0.15s ease;
	}

	/* 카드 아래: 조회수 · 폴더 이름표 / 폴더 · 북마크 */
	.foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.125rem 0.625rem 0.375rem 0.75rem;
	}

	.meta {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		min-width: 0;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.subText};
		font-variant-numeric: tabular-nums;

		svg {
			width: 0.875rem;
			height: 0.875rem;
		}
	}

	/* 카드 아래 글자 단추: 메일 · 스크랩의 글자 단추 줄과 같은 모양 */
	.actions {
		${textTools}
		flex-wrap: nowrap;
		gap: 0.75rem;
		/* 북마크 단추(누르는 칸 40px)가 줄 높이를 키우지 않게: 줄은 1.5rem, 단추는 위아래로 넘쳐 누르는 칸은 그대로 */
		height: 1.25rem;
		min-width: 0;

		/* '폴더 · 이름'이 길면 카드 폭 안에서 … */
		.trigger {
			display: block;
			max-width: 9rem;
			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;
		}
	}

	/* 한 줄 칸 수 (목록 너비 기준): 1000px 이상 3장 · 680px 이상 2장 · 그 아래 1장 */
	@container (min-width: 680px) {
		.grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@container (min-width: 1000px) {
		.grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
`;

export default MyBookmark;
