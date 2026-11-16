'use client';

import { HIGHLIGHTS } from '@/copy';
import { ROUTES } from '@/constants/routes';
import { LuHighlighter } from 'react-icons/lu';
import { useHeader } from '@/hooks/useHeader';
import { useFolders } from '@/hooks/useFolders';
import { useToggleSet } from '@/hooks/useToggleSet';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import Skeleton from '@/components/common/loader/Skeleton';
import { errorStateFor, statusOf } from '@/copy/errors';
import { byDay, byStory } from '../_lib/highlightGroups';
import MyTaste from './MyTaste';
import FolderBar from './folders/FolderBar';
import MonthBar from './list/MonthBar';
import LoadNewer from './list/LoadNewer';
import { byMonth, monthLabel } from '../_lib/months';
import HighlightsHead from './highlights/HighlightsHead';
import SelectBar from './highlights/SelectBar';
import StoryBlock from './highlights/StoryBlock';
import { useHashFocus } from './highlights/useHashFocus';
import { useHighlightList } from './highlights/useHighlightList';
import { useHighlightSelection } from './highlights/useHighlightSelection';

/**
 * 마이페이지 스크랩 (#123 1단계): 뉴스레터 본문에서 스크랩한 문장 · 메모를 모아 본다.
 * 내 뉴스레터와 같은 모양: 위에 붙어 따라오는 달 막대(연도 · 월로 바로 가기, 스크랩한 날짜 바로가기) 아래
 * 뉴스레터 하나가 블록 하나 — 날짜 · 큰 제목, 왼쪽 그림 · 관심사, 오른쪽 연한 상자에 그날 스크랩한 문장들(소식 번호 · 제목 한 줄).
 * 폴더로 정리하고(폴더 줄로 거르기), 문장 아래 원문에서 보기(?hl=번호) · 메모 · 폴더 옮기기 · 지우기, 문장 줄 끝에 중요 표시(별).
 * '선택'으로 골라서 한꺼번에 폴더로 옮기기 · 중요 표시 · 중요 해제 · 복사 · 지우기.
 * 중요 표시한 문장은 지우기 전에 한 번 더 묻는다.
 * 서버에서 폴더 · 보기로 걸러 한 쪽(30개)씩 받고, 아래 끝에 닿으면 이어 붙인다 (달로 건너뛰면 위로 '더 최근 스크랩 보기')
 *
 * 이 파일은 조립만 (#198): 목록 데이터 useHighlightList · 고르기 useHighlightSelection · 알림 강조 useHashFocus,
 * 묶기 계산 _lib/highlightGroups, 구역은 highlights/의 HighlightsHead · StoryBlock · SelectBar
 */
export default function MyHighlights() {
	const list = useHighlightList();
	const { data, isPending, isError, error, refetch } = list.pages;
	// 서버가 걸러 준 것을 이어 붙인 목록
	const shown = list.items ?? [];
	const selection = useHighlightSelection(shown);
	const focused = useHashFocus(
		list.items?.map((h) => h.id),
		data,
	);
	// 작은 화면에서 문장을 모두 펼친 블록 (블록 첫 스크랩 번호)
	const { set: openBlocks, add: openBlock } = useToggleSet<number>();
	// 달 막대가 붙는 높이: 헤더가 보이면 그 아래
	const { headerHeight } = useHeader();
	const { data: folders = [] } = useFolders();

	if (isPending) return <Skeleton />;
	if (isError) return <ErrorState inline {...errorStateFor(statusOf(error))} onRetry={() => refetch()} />;
	const first = data.pages[0];
	if (first.counts.all === 0) {
		// 스크랩이 없어도 북마크로 모인 주제는 보인다
		return (
			<div className="np-mypage-my-highlights-highlights">
				<MyTaste />
				<EmptyState
					icon={LuHighlighter}
					title={HIGHLIGHTS.empty.title}
					description={HIGHLIGHTS.empty.body}
					action={{ label: '뉴스레터 둘러보기', href: ROUTES.articles }}
				/>
			</div>
		);
	}

	// 중요 · 메모 수는 고른 폴더 안에서 센 것
	const { starred: stars, memo: memos } = first.counts;
	const last = data.pages[data.pages.length - 1];
	const folderName = new Map(folders.map((f) => [f.id, f.name]));
	// '모든 스크랩'에서 볼 때만 문장마다 어느 폴더인지
	const folderNameOf = (folderId: number | null) =>
		list.folder === 'all' && folderId ? folderName.get(folderId) : undefined;
	// 달 → 날짜 → (블록은 그리면서) 로 묶음
	const months = byMonth(shown, (h) => h.createdAt).map(({ month, items }) => ({ month, days: byDay(items) }));

	return (
		<div className="np-mypage-my-highlights-highlights">
			<MyTaste />
			<FolderBar
				folders={folders}
				countOf={(f) => f.counts.highlights}
				allLabel="모든 스크랩"
				value={list.folder}
				onChange={(next) => {
					list.setFolder(next);
					selection.clear();
				}}
				total={first.counts.all}
				unfiled={first.counts.unfiled}
				dragging={selection.dragging?.length ?? 0}
				onDropTo={selection.dropTo}
			/>
			<HighlightsHead
				total={last.total}
				stars={stars}
				memos={memos}
				filter={list.filter}
				onFilter={list.setFilter}
				order={list.order}
				onOrder={list.setOrder}
				selecting={selection.selecting}
				onToggleSelecting={() => (selection.selecting ? selection.stop() : selection.start())}
			/>
			{shown.length === 0 && (
				<p className="empty">
					{list.filter === 'starred'
						? HIGHLIGHTS.emptyStarred
						: list.filter === 'memo'
							? HIGHLIGHTS.emptyMemo
							: HIGHLIGHTS.emptyFolder}
				</p>
			)}
			{shown.length > 0 && (
				/* 내 뉴스레터와 같은 짜임: 달 막대 하나가 위에 붙어 따라오고, 그 아래 날짜마다 뉴스레터 블록 */
				<div className="inbox">
					{list.pages.hasPreviousPage && (
						<LoadNewer
							label="더 최근 스크랩 보기"
							loading={list.pages.isFetchingPreviousPage}
							onClick={() => list.pages.fetchPreviousPage()}
						/>
					)}
					<div className="months">
						<MonthBar
							groups={months.map(({ month, days }) => ({
								month,
								items: days.map(({ day, items }) => ({ id: `hl-day-${day}`, at: items[0].createdAt })),
							}))}
							top={headerHeight}
							months={last.months ?? []}
							onJump={list.jumpToMonth}
							noun="스크랩"
						/>
						{months.map(({ month, days }) => (
							<section key={month} id={`month-${month}`} className="month" aria-label={monthLabel(month)}>
								{days.map(({ day, items }) => (
									<div key={day} id={`hl-day-${day}`} className="scrap-day">
										{byStory(items).map((block) => (
											<StoryBlock
												key={block.items[0].id}
												block={block}
												day={day}
												folderNameOf={folderNameOf}
												focused={focused}
												open={openBlocks.has(block.items[0].id)}
												onOpen={() => openBlock(block.items[0].id)}
												selection={selection}
											/>
										))}
									</div>
								))}
							</section>
						))}
					</div>
				</div>
			)}
			{/* 무한 스크롤: 이 표시가 보이면 다음 쪽 */}
			<div ref={list.endRef} className="list-end" aria-hidden />
			{list.pages.isFetchingNextPage && <p className="list-status">스크랩을 더 불러오는 중…</p>}
			{selection.selecting && <SelectBar selection={selection} shownCount={shown.length} />}
		</div>
	);
}
