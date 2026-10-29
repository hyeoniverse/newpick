'use client';

import { useState } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import BookmarkIcon from '@/components/common/icons/BookmarkIcon';
import { LuBookmark } from 'react-icons/lu';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import FilterChips from '@/components/common/FilterChips';
import Skeleton from '@/components/common/loader/Skeleton';
import { errorStateFor, statusOf } from '@/constants/errors';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBookmarksList, useMoveBookmarksMutation } from '@/hooks/useBookmark';
import { useFolders } from '@/hooks/useFolders';
import { IBookmarkItem } from '@/models/bookmark.model';
import { dateFormatter } from '@/utils/formatter';
import { getFirstImage } from '@/utils/getFirstImage';
import FolderBar, { FolderFilter } from './folders/FolderBar';
import FolderMenu from './folders/FolderMenu';
import ListHead, { FilterRow, SortSelect } from './list/ListHead';
import { RichList, Thumb } from './list/RichList';

/** 정렬: 북마크한 순 · 발행일순 · 조회수순 */
const SORTS: Record<string, { label: string; compare: (a: IBookmarkItem, b: IBookmarkItem) => number }> = {
	bookmarked: { label: '북마크한 순', compare: (a, b) => b.bookmarkedAt.localeCompare(a.bookmarkedAt) },
	published: { label: '발행일순', compare: (a, b) => b.newsCreatedAt.localeCompare(a.newsCreatedAt) },
	views: { label: '조회수순', compare: (a, b) => b.viewcount - a.viewcount },
};

/**
 * 마이페이지 북마크 (#123): 폴더(스크랩 · 받은 메일과 같은 폴더) · 관심사 거르기 · 정렬.
 * 목록이 길지 않아 한 번에 받아 화면에서 거르고 줄 세운다. 카드마다 '폴더 옮기기'
 */
function MyBookmark() {
	const { user } = useAuthStore();
	const { data: bookmarks, isPending, isError, error, refetch } = useBookmarksList();
	const { data: folders = [] } = useFolders();
	const move = useMoveBookmarksMutation();
	const [folder, setFolder] = useState<FolderFilter>('all');
	const [category, setCategory] = useState('');
	const [sort, setSort] = useState('bookmarked');
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

	if (bookmarks.length === 0) {
		return (
			<EmptyState
				icon={LuBookmark}
				title="북마크한 뉴스레터가 없어요"
				description="마음에 드는 뉴스레터에서 북마크를 누르면 여기에 모여요."
				action={{ label: '뉴스레터 둘러보기', href: '/articles' }}
			/>
		);
	}

	const inFolder =
		folder === 'all'
			? bookmarks
			: bookmarks.filter((b) => (folder === 'none' ? b.folderId === null : b.folderId === folder));
	// 관심사 칩은 북마크에 있는 관심사만
	const categories = [...new Map(bookmarks.map((b) => [b.category.id, b.category.name])).entries()];
	const shown = (category ? inFolder.filter((b) => String(b.category.id) === category) : inFolder)
		.slice()
		.sort(SORTS[sort].compare);
	const folderName = new Map(folders.map((f) => [f.id, f.name]));

	return (
		<MyBookmarkStyled>
			<FolderBar
				folders={folders}
				countOf={(f) => f.counts.bookmarks}
				allLabel="모든 북마크"
				value={folder}
				onChange={setFolder}
				total={bookmarks.length}
				unfiled={bookmarks.filter((b) => b.folderId === null).length}
				dragging={dragging ? 1 : 0}
				onDropTo={(folderId) => {
					if (dragging) move.mutate({ newsletterIds: [dragging], folderId });
					setDragging(null);
				}}
			/>
			<ListHead title="북마크" count={inFolder.length}>
				<SortSelect
					value={sort}
					options={Object.entries(SORTS).map(([value, s]) => ({ value, label: s.label }))}
					onChange={setSort}
				/>
			</ListHead>
			{/* 관심사가 둘 이상일 때만 거르기 줄 */}
			{categories.length > 1 && (
				<FilterRow>
					<FilterChips
						label="관심사"
						options={[
							{ value: '', label: '전체' },
							...categories.map(([id, name]) => ({ value: String(id), label: name })),
						]}
						value={category}
						onChange={setCategory}
					/>
				</FilterRow>
			)}
			{shown.length === 0 ? (
				<p className="empty">이 조건의 북마크가 없어요.</p>
			) : (
				/* 북마크 하나가 카드 한 장 (내 뉴스레터와 같은 모양). 카드를 끌면 폴더로 */
				<RichList>
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
								<Thumb src={getFirstImage(bookmark.newsImg)} alt="" />
								<span className="body">
									<span className="kicker">
										<span className="cat">{bookmark.category.name}</span>
										<span>{dateFormatter(bookmark.newsCreatedAt)} 발행</span>
									</span>
									<span className="title">{bookmark.newsTitle}</span>
									{bookmark.newsSummary && <span className="summary">{bookmark.newsSummary}</span>}
									<span className="foot">
										<span>조회 {bookmark.viewcount.toLocaleString()}</span>
										<span>{dateFormatter(bookmark.bookmarkedAt)} 북마크</span>
										{/* '모든 북마크'에서 어느 폴더인지 */}
										{folder === 'all' && bookmark.folderId && (
											<span className="folder-tag">{folderName.get(bookmark.folderId)}</span>
										)}
									</span>
								</span>
							</Link>
							<div className="actions">
								<BookmarkIcon newsId={bookmark.id} newsletterId={bookmark.id} />
								<FolderMenu
									className="folder-menu-trigger"
									label="폴더"
									current={bookmark.folderId}
									onPick={(folderId) => move.mutate({ newsletterIds: [bookmark.id], folderId })}
								/>
							</div>
						</li>
					))}
				</RichList>
			)}
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
		width: 100%;
		height: fit-content;
	}
`;

export default MyBookmark;
