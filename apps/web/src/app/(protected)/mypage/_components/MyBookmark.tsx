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
							<Link href={`/articles/detail/${bookmark.id}`} className="main" draggable={false}>
								<Thumb src={getFirstImage(bookmark.newsImg)} className="thumb" />
								<span className="body">
									<span className="kicker">
										<span className="cat">{bookmark.category.name}</span>
										<span>{dateFormatter(bookmark.newsCreatedAt)}</span>
									</span>
									<span className="title">{bookmark.newsTitle}</span>
								</span>
							</Link>
							<div className="foot">
								<span className="meta">
									<LuEye aria-hidden /> {bookmark.viewcount.toLocaleString()}
									{/* '모든 북마크'에서 어느 폴더인지 */}
									{folder === 'all' && bookmark.folderId && (
										<span className="folder-tag">{folderName.get(bookmark.folderId)}</span>
									)}
								</span>
								<span className="actions">
									<FolderMenu
										className="folder-trigger"
										label="폴더"
										current={bookmark.folderId}
										onPick={(folderId) => move.mutate({ newsletterIds: [bookmark.id], folderId })}
									/>
									<BookmarkIcon newsId={bookmark.id} newsletterId={bookmark.id} />
								</span>
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

	/* 북마크 카드 격자: 데스크톱 한 줄에 4장, 중간 폭 3장, 휴대폰 2장 */
	.grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 1rem;
		margin: 0;
		padding: 0;
		list-style: none;

		> li {
			display: flex;
			flex-direction: column;
			overflow: hidden;
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

	.main {
		flex: 1;
		display: flex;
		flex-direction: column;
		color: inherit;
		text-decoration: none;
	}

	.thumb {
		border-bottom: 1px solid ${({ theme }) => theme.color.border};
	}

	.body {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 0.875rem 1rem 0.5rem;
	}

	.kicker {
		display: flex;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: ${({ theme }) => theme.color.subText};
		font-variant-numeric: tabular-nums;

		.cat {
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};
			color: ${({ theme }) => theme.color.primary};
		}
	}

	.title {
		display: -webkit-box;
		overflow: hidden;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		font-size: ${({ theme }) => theme.fontSize.small};
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		line-height: 1.45;
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
		padding: 0.25rem 0.75rem 0.75rem 1rem;
	}

	.meta {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		min-width: 0;
		font-size: 0.75rem;
		color: ${({ theme }) => theme.color.subText};
		font-variant-numeric: tabular-nums;

		svg {
			width: 0.875rem;
			height: 0.875rem;
		}
	}

	.folder-tag {
		margin-left: 0.375rem;
		padding: 0 0.5rem;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.chip};
		font-size: 0.6875rem;
	}

	.actions {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
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

	@media (max-width: 1024px) {
		.grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}

	@media ${({ theme }) => theme.mediaQuery.mobile} {
		.grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0.625rem;
		}

		.body {
			padding: 0.625rem 0.75rem 0.375rem;
		}

		.foot {
			padding: 0.125rem 0.5rem 0.5rem 0.75rem;
		}

		.folder-tag {
			display: none;
		}
	}
`;

export default MyBookmark;
