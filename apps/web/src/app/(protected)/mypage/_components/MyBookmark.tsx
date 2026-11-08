'use client';

import { useState } from 'react';
import Link from 'next/link';
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
import { setFolderDragGhost } from './folders/dragGhost';
import FolderMenu from './folders/FolderMenu';
import ListHead, { FilterRow, SortSelect } from './list/ListHead';
import LoadMore from './list/LoadMore';
import Thumb from './list/Thumb';
import { cx } from '@/styles/tw';

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
				<ul className="card-grid">
					{shown.map((bookmark) => (
						<li
							key={bookmark.id}
							className={dragging === bookmark.id ? 'dragging' : undefined}
							draggable
							onDragStart={(event) => {
								event.dataTransfer.effectAllowed = 'move';
								setFolderDragGhost(event, bookmark.newsTitle);
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

const MyBookmarkStyled = ({ className, ...props }: React.ComponentProps<'div'>) => (
	<div className={cx('np-mypage-my-bookmark-my-bookmark', className)} {...props} />
);

export default MyBookmark;
