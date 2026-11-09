'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import StarToggle from '@/components/common/icons/StarToggle';
import Tags from '@/components/common/Tags';
import { useLiftScrollButtons } from '@/components/common/ScrollButtons';
import { LuHighlighter, LuNewspaper } from 'react-icons/lu';
import Image from '@/components/common/Image';
import { useHeader } from '@/hooks/useHeader';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import FilterChips from '@/components/common/FilterChips';
import InputCheck from '@/components/common/InputCheck';
import Skeleton from '@/components/common/loader/Skeleton';
import { errorStateFor, statusOf } from '@/constants/errors';
import { Highlight, useHighlightMutations, useHighlightPages } from '@/hooks/useHighlights';
import { useFolders } from '@/hooks/useFolders';
import { useToast } from '@/hooks/useToast';
import { useConfirmRemoveHighlights } from '@/hooks/useConfirmRemoveHighlights';
import { dateFormatter } from '@/utils/formatter';
import MyTaste from './MyTaste';
import FolderBar, { FolderFilter } from './folders/FolderBar';
import { setFolderDragGhost } from './folders/dragGhost';
import FolderMenu from './folders/FolderMenu';
import ListHead, { SortSelect } from './list/ListHead';
import MonthBar, { LoadNewer, byMonth, monthLabel, useMonthJump } from './list/MonthBar';

/** 구역 이름: 브리핑은 '에디터 브리핑', 소식은 뉴스레터 본문처럼 번호(01) + 그 소식의 제목 */
function sectionName(highlight: Highlight) {
	if (highlight.section === 'briefing') return { index: null, name: '에디터 브리핑' };
	const story = highlight.section?.match(/^story-(\d+)$/);
	if (!story) return { index: null, name: null };
	return { index: story[1].padStart(2, '0'), name: highlight.sectionTitle || `소식 ${story[1]}` };
}

/** 고른 스크랩을 글로 복사: 문장 · 출처 · 메모 */
function asText(items: Highlight[]) {
	return items
		.map((h) => {
			const { index, name } = sectionName(h);
			const source = [h.newsletter?.category.name, h.newsletter?.title, [index, name].filter(Boolean).join(' ')]
				.filter(Boolean)
				.join(' · ');
			return [`“${h.text}”`, `— ${source}`, h.note && `메모: ${h.note}`].filter(Boolean).join('\n');
		})
		.join('\n\n');
}

/** 스크랩한 날 (한국 시각 'YYYY-MM-DD') */
const dayOf = (iso: string) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date(iso));

/** 날짜 머리: 오늘 · 어제 · 올해는 '10월 27일 (화)', 지난해부터는 '2025년 10월 27일 (월)' */
function dayLabel(day: string) {
	const today = dayOf(new Date().toISOString());
	const yesterday = dayOf(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
	if (day === today) return '오늘';
	if (day === yesterday) return '어제';
	const date = new Date(`${day}T12:00:00+09:00`);
	return new Intl.DateTimeFormat('ko-KR', {
		timeZone: 'Asia/Seoul',
		...(day.slice(0, 4) !== today.slice(0, 4) && { year: 'numeric' }),
		month: 'long',
		day: 'numeric',
		weekday: 'short',
	})
		.format(date)
		.replace(/\s*\((.)\)$/, ' ($1)');
}

/** 받은 순서(최근순 · 오래된순) 그대로 스크랩한 날짜별로 묶는다 */
function byDay(items: Highlight[]) {
	const groups: { day: string; items: Highlight[] }[] = [];
	for (const item of items) {
		const day = dayOf(item.createdAt);
		const last = groups[groups.length - 1];
		if (last?.day === day) last.items.push(item);
		else groups.push({ day, items: [item] });
	}
	return groups;
}

/** 작은 화면에서 블록마다 처음에 보일 문장 수 (나머지는 '문장 N개 더 보기') */
const QUOTES_SMALL = 2;

/** 뉴스레터가 나온 날: '10월 28일' (한국 시각) */
const issuedLabel = (iso: string) =>
	new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', timeZone: 'Asia/Seoul' }).format(new Date(iso));

/** 하루 안에서 이어진 같은 소식(뉴스레터 · 구역)의 스크랩을 한 블록으로: 스크랩은 소식 단위로 하므로 블록도 소식 단위 */
function byStory(items: Highlight[]) {
	const blocks: { newsletterId: number; section: string | null; items: Highlight[] }[] = [];
	for (const item of items) {
		const last = blocks[blocks.length - 1];
		if (last?.newsletterId === item.newsletterId && last.section === item.section) last.items.push(item);
		else blocks.push({ newsletterId: item.newsletterId, section: item.section, items: [item] });
	}
	return blocks;
}

/**
 * 마이페이지 스크랩 (#123 1단계): 뉴스레터 본문에서 스크랩한 문장 · 메모를 모아 본다.
 * 내 뉴스레터와 같은 모양: 위에 붙어 따라오는 달 막대(연도 · 월로 바로 가기, 스크랩한 날짜 바로가기) 아래
 * 뉴스레터 하나가 블록 하나 — 날짜 · 큰 제목, 왼쪽 그림 · 관심사, 오른쪽 연한 상자에 그날 스크랩한 문장들(소식 번호 · 제목 한 줄).
 * 폴더로 정리하고(폴더 줄로 거르기), 문장 아래 원문에서 보기(?hl=번호) · 메모 · 폴더 옮기기 · 지우기, 문장 줄 끝에 중요 표시(별).
 * '선택'으로 골라서 한꺼번에 폴더로 옮기기 · 중요 표시 · 중요 해제 · 복사 · 지우기.
 * 중요 표시한 문장은 지우기 전에 한 번 더 묻는다.
 * 서버에서 폴더 · 보기로 걸러 한 쪽(30개)씩 받고, 아래 끝에 닿으면 이어 붙인다 (달로 건너뛰면 위로 '더 최근 스크랩 보기')
 */
export default function MyHighlights() {
	const [filter, setFilter] = useState('');
	const [folder, setFolder] = useState<FolderFilter>('all');
	// 정렬: 최근 스크랩순(기본) · 오래된순. 날짜별 묶음도 이 순서를 따른다
	const [order, setOrder] = useState<'desc' | 'asc'>('desc');
	// 달 막대에서 고른 달로: 그 달 첫 스크랩 순번부터 받아 와서 그 달 묶음으로 스크롤
	const { startOffset, setStartOffset, jumpToMonth } = useMonthJump();
	// 달 막대가 붙는 높이: 헤더가 보이면 그 아래
	const { headerHeight } = useHeader();
	const filters = new URLSearchParams({
		...(folder !== 'all' && { folder: String(folder) }),
		...(filter && { filter }),
		...(order === 'asc' && { order }),
	}).toString();
	const {
		data,
		isPending,
		isError,
		error,
		refetch,
		fetchNextPage,
		fetchPreviousPage,
		hasNextPage,
		hasPreviousPage,
		isFetchingNextPage,
		isFetchingPreviousPage,
	} = useHighlightPages(filters, startOffset);
	// 앞 쪽이 겹치지 않게 (건너뛴 자리가 한 쪽 수의 배수가 아니면 앞 쪽 끝이 겹칠 수 있다)
	const seen = new Set<number>();
	const items = data?.pages.flatMap((p) => p.items).filter((h) => !seen.has(h.id) && seen.add(h.id));
	// 아래 끝 표시: 화면에 들어오면 다음 쪽
	const endRef = useRef<HTMLDivElement>(null);
	// 고르기 막대가 바닥에 붙어 있는 동안 위·아래 스크롤 버튼을 그 위로
	const liftScrollButtons = useLiftScrollButtons();
	useEffect(() => {
		const el = endRef.current;
		if (!el || !hasNextPage) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && !isFetchingNextPage) fetchNextPage();
			},
			{ rootMargin: '400px 0px' },
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, [hasNextPage, isFetchingNextPage, fetchNextPage, items?.length]);
	// 거르기 · 정렬을 바꾸면 맨 위부터
	const refilter =
		<T,>(set: (value: T) => void) =>
		(value: T) => {
			set(value);
			setStartOffset(0);
		};
	// 끌어서 폴더에 넣기 (데스크톱): 끄는 중인 스크랩 번호들
	const [dragging, setDragging] = useState<number[] | null>(null);
	const { data: folders = [] } = useFolders();
	const { bulk } = useHighlightMutations();
	const { showToast } = useToast();
	// 선택해서 지우기: 고르는 중인지, 고른 번호
	const [selecting, setSelecting] = useState(false);
	const [selected, setSelected] = useState<Set<number>>(new Set());
	const confirmRemove = useConfirmRemoveHighlights();
	const stopSelecting = () => {
		setSelecting(false);
		setSelected(new Set());
	};
	// 작은 화면에서 문장을 모두 펼친 블록 (블록 첫 스크랩 번호)
	const [openBlocks, setOpenBlocks] = useState<Set<number>>(new Set());
	// 스크랩 알림의 '모아 보기'로 오면(#hl-번호) 그 문장으로 스크롤하고 잠깐 강조
	const [focused, setFocused] = useState<number | null>(null);
	useEffect(() => {
		const target = Number(window.location.hash.match(/^#hl-(\d+)$/)?.[1]);
		if (!target || !items?.some((h) => h.id === target)) return;
		document.getElementById(`hl-${target}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
		setFocused(target);
		const timer = window.setTimeout(() => setFocused(null), 2400);
		return () => window.clearTimeout(timer);
		// eslint-disable-next-line react-hooks/exhaustive-deps -- 받은 목록이 바뀔 때만 (items는 매번 새 배열)
	}, [data]);

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
					title="스크랩한 문장이 없어요"
					description="뉴스레터를 읽다가 중요한 문장을 드래그해 스크랩하거나 메모를 남기면 여기에 모여요."
					action={{ label: '뉴스레터 둘러보기', href: '/articles' }}
				/>
			</div>
		);
	}

	// 서버가 걸러 준 것을 이어 붙인 목록. 중요 · 메모 수는 고른 폴더 안에서 센 것
	const shown = items ?? [];
	const { starred: stars, memo: memos } = first.counts;
	const last = data.pages[data.pages.length - 1];
	const total = last.total;
	const folderName = new Map(folders.map((f) => [f.id, f.name]));
	// 달 → 날짜 → (블록은 그리면서) 로 묶음
	const months = byMonth(shown, (h) => h.createdAt).map(({ month, items }) => ({ month, days: byDay(items) }));
	const picked = shown.filter((h) => selected.has(h.id));
	const copy = async () => {
		try {
			await navigator.clipboard.writeText(asText(picked));
			showToast(`${picked.length}개를 복사했어요.`, 'success');
		} catch {
			showToast('복사하지 못했어요.', 'error');
		}
	};
	const allShownSelected = shown.length > 0 && shown.every((h) => selected.has(h.id));
	const toggle = (id: number) =>
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});

	return (
		<div className="np-mypage-my-highlights-highlights">
			<MyTaste />
			<FolderBar
				folders={folders}
				countOf={(f) => f.counts.highlights}
				allLabel="모든 스크랩"
				value={folder}
				onChange={(next) => {
					refilter(setFolder)(next);
					setSelected(new Set());
				}}
				total={first.counts.all}
				unfiled={first.counts.unfiled}
				dragging={dragging?.length ?? 0}
				onDropTo={(folderId) => {
					if (!dragging) return;
					bulk.mutate({ ids: dragging, action: 'move', folderId }, { onSuccess: () => selecting && stopSelecting() });
					setDragging(null);
				}}
			/>
			<ListHead title="스크랩한 문장" count={total}>
				<FilterChips
					label="보기"
					options={[
						{ value: '', label: '전체' },
						{ value: 'starred', label: `중요 ${stars}` },
						{ value: 'memo', label: `메모 ${memos}` },
					]}
					value={filter}
					onChange={refilter(setFilter)}
				/>
				<SortSelect
					value={order}
					options={[
						{ value: 'desc', label: '최근 스크랩순' },
						{ value: 'asc', label: '오래된순' },
					]}
					onChange={refilter(setOrder)}
				/>
				<button
					type="button"
					className="select-toggle"
					aria-pressed={selecting}
					onClick={() => (selecting ? stopSelecting() : setSelecting(true))}
				>
					{selecting ? '완료' : '선택'}
				</button>
			</ListHead>
			{shown.length === 0 && (
				<p className="empty">
					{filter === 'starred'
						? '중요 표시한 문장이 없어요. 문장 옆 별을 누르면 여기 모여요.'
						: filter === 'memo'
							? '메모를 남긴 문장이 없어요.'
							: "이 폴더에 스크랩이 없어요. 문장 아래 '폴더 옮기기'나 '선택'으로 옮겨 보세요."}
				</p>
			)}
			{shown.length > 0 && (
				/* 내 뉴스레터와 같은 짜임: 달 막대 하나가 위에 붙어 따라오고, 그 아래 날짜마다 뉴스레터 블록 */
				<div className="inbox">
					{hasPreviousPage && (
						<LoadNewer
							label="더 최근 스크랩 보기"
							loading={isFetchingPreviousPage}
							onClick={() => fetchPreviousPage()}
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
							onJump={jumpToMonth}
							noun="스크랩"
						/>
						{months.map(({ month, days }) => (
							<section key={month} id={`month-${month}`} className="month" aria-label={monthLabel(month)}>
								{days.map(({ day, items }) => (
									<div key={day} id={`hl-day-${day}`} className="scrap-day">
										{byStory(items).map((block) => {
											const newsletter = block.items[0].newsletter;
											const href = `/articles/detail/${block.newsletterId}`;
											// 블록 제목 · 사진은 그 소식 것 (브리핑 · 구역 모름이면 뉴스레터 것), 어느 뉴스레터인지는 위에 작게
											const { index, name } = sectionName(block.items[0]);
											const title = name ?? newsletter?.title ?? `뉴스레터 #${block.newsletterId}`;
											const image = block.items[0].sectionImage ?? newsletter?.image;
											const tags = block.items[0].sectionTags ?? [];
											return (
												// 폴더는 문장마다 정하므로 끌기도 문장 하나씩 (블록째 끌지 않는다)
												<article key={block.items[0].id} className="news">
													{/* 스크랩한 날 · 어느 뉴스레터의 소식인지 (제목은 소식 제목이라 위에 작게) */}
													<p className="news-date">
														{dayLabel(day)}
														{name && newsletter && (
															<Link href={href} className="news-from">
																{newsletter.title}
															</Link>
														)}
													</p>
													<Link href={href} className="news-title">
														<h3>
															{index && <span className="story-index">{index}</span>}
															{title}
														</h3>
													</Link>
													<div className="news-body">
														<div className="news-media">
															<Link href={href} className="news-image" tabIndex={-1} aria-hidden>
																{image ? (
																	<Image src={image} alt="" ratio="wide" borderRadius="medium" priority={false} />
																) : (
																	<LuNewspaper />
																)}
															</Link>
															{newsletter && (
																<>
																	<ul className="news-cats" aria-label="관심사">
																		<li>{newsletter.category.name}</li>
																	</ul>
																	{/* 이 소식이 실린 뉴스레터가 나온 날 (위 날짜는 스크랩한 날) */}
																	<p className="news-issued">{issuedLabel(newsletter.createdAt)} 뉴스레터</p>
																	{/* 그 소식의 태그 (누르면 그 태그의 뉴스레터 목록) */}
																	{tags.length > 0 && <Tags tags={tags} max={4} className="news-tags" linkable />}
																</>
															)}
														</div>
														{/* 오른쪽 상자: 이 뉴스레터에서 그날 스크랩한 문장들 */}
														<div className="news-summary">
															<ul
																className={`quotes ${
																	openBlocks.has(block.items[0].id) ||
																	block.items.some((h, i) => i >= QUOTES_SMALL && h.id === focused)
																		? 'open'
																		: ''
																}`}
															>
																{block.items.map((highlight, i) => (
																	<li key={highlight.id} className={i >= QUOTES_SMALL ? 'extra' : undefined}>
																		<HighlightItem
																			highlight={highlight}
																			index={i + 1}
																			// '모든 스크랩'에서 볼 때 어느 폴더인지
																			folder={
																				folder === 'all' && highlight.folderId
																					? folderName.get(highlight.folderId)
																					: undefined
																			}
																			focused={highlight.id === focused}
																			dragged={!!dragging?.includes(highlight.id)}
																			selecting={selecting}
																			checked={selected.has(highlight.id)}
																			onToggle={() => toggle(highlight.id)}
																			onRemove={() => confirmRemove([highlight])}
																			// 고르는 중에 고른 것 하나를 끌면 고른 것 전부, 아니면 이것 하나
																			onDragStart={(event) => {
																				const ids =
																					selecting && selected.has(highlight.id) ? [...selected] : [highlight.id];
																				setFolderDragGhost(event, highlight.text, ids.length);
																				setDragging(ids);
																			}}
																			onDragEnd={() => setDragging(null)}
																		/>
																	</li>
																))}
															</ul>
															{/* 작은 화면에서만: 접어 둔 문장 펼치기 (큰 화면에선 다 보여 숨김) */}
															{block.items.length > QUOTES_SMALL && !openBlocks.has(block.items[0].id) && (
																<button
																	type="button"
																	className="more-quotes"
																	onClick={() => setOpenBlocks((prev) => new Set(prev).add(block.items[0].id))}
																>
																	문장 {block.items.length - QUOTES_SMALL}개 더 보기
																</button>
															)}
														</div>
													</div>
												</article>
											);
										})}
									</div>
								))}
							</section>
						))}
					</div>
				</div>
			)}
			{/* 무한 스크롤: 이 표시가 보이면 다음 쪽 */}
			<div ref={endRef} className="list-end" aria-hidden />
			{isFetchingNextPage && <p className="list-status">스크랩을 더 불러오는 중…</p>}
			{/* 고르는 중: 아래에 붙어 따라오는 막대 */}
			{selecting && (
				<div ref={liftScrollButtons} className="select-bar" role="region" aria-label="선택한 문장 한꺼번에">
					<InputCheck
						name="highlights-select-all"
						className="pick-all"
						size="small"
						label={allShownSelected ? '전체 해제' : `전체 선택 (${shown.length})`}
						checked={allShownSelected}
						onCheckedChange={() =>
							setSelected((prev) => {
								const next = new Set(prev);
								for (const h of shown) {
									if (allShownSelected) next.delete(h.id);
									else next.add(h.id);
								}
								return next;
							})
						}
					/>
					<span className="picked">{selected.size}개 선택</span>
					{/* 한꺼번에 할 일 · 취소 · 지우기 (모바일은 한 줄로 옆으로 밀어 본다) */}
					<div className="bulk">
						<FolderMenu
							label="폴더로 옮기기"
							up
							disabled={selected.size === 0}
							onPick={(folderId) =>
								bulk.mutate({ ids: [...selected], action: 'move', folderId }, { onSuccess: stopSelecting })
							}
						/>
						<button
							type="button"
							disabled={selected.size === 0}
							onClick={() => bulk.mutate({ ids: [...selected], action: 'star' }, { onSuccess: stopSelecting })}
						>
							중요 표시
						</button>
						<button
							type="button"
							disabled={selected.size === 0}
							onClick={() => bulk.mutate({ ids: [...selected], action: 'unstar' }, { onSuccess: stopSelecting })}
						>
							중요 해제
						</button>
						<button type="button" disabled={selected.size === 0} onClick={copy}>
							복사
						</button>
						<button type="button" onClick={stopSelecting}>
							취소
						</button>
						<button
							type="button"
							className="danger"
							disabled={selected.size === 0}
							onClick={() => confirmRemove(picked, { onDone: stopSelecting })}
						>
							{selected.size}개 지우기
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

function HighlightItem({
	highlight,
	index,
	folder,
	focused,
	dragged,
	selecting,
	checked,
	onToggle,
	onRemove,
	onDragStart,
	onDragEnd,
}: {
	highlight: Highlight;
	/** 블록 안 몇 번째 문장인지 (1부터) */
	index: number;
	/** 들어 있는 폴더 이름 ('모든 스크랩'에서만) */
	folder?: string;
	focused: boolean;
	/** 끄는 중 (흐리게) */
	dragged: boolean;
	selecting: boolean;
	checked: boolean;
	onToggle: () => void;
	onRemove: () => void;
	onDragStart: (event: React.DragEvent) => void;
	onDragEnd: () => void;
}) {
	const { update, bulk } = useHighlightMutations();
	const [editing, setEditing] = useState(false);
	const [note, setNote] = useState(highlight.note ?? '');

	return (
		<article
			id={`hl-${highlight.id}`}
			className={`item ${focused ? 'focused' : ''} ${selecting ? 'selecting' : ''} ${checked ? 'checked' : ''} ${dragged ? 'dragging' : ''}`}
			title={`${dateFormatter(highlight.createdAt)} 스크랩`}
			// 고르는 중에는 문장 어디를 눌러도 고르기
			onClick={selecting ? onToggle : undefined}
			// 끌어서 폴더에 넣기 (데스크톱 마우스. 메모를 고치는 중엔 끌지 않음)
			draggable={!editing}
			onDragStart={(event) => {
				event.dataTransfer.effectAllowed = 'move';
				event.dataTransfer.setData('text/plain', highlight.text);
				event.stopPropagation();
				onDragStart(event);
			}}
			onDragEnd={onDragEnd}
		>
			{/* 머리 줄: 스크랩한 문장 N | 폴더 ……… 중요 표시 */}
			<div className="item-head">
				<span className="item-label">
					스크랩한 문장 <span className="count">{index}</span>
				</span>
				{folder && <span className="folder">{folder}</span>}
				{!selecting && (
					<StarToggle
						className="star-toggle"
						pressed={highlight.starred}
						onToggle={() => update.mutate({ id: highlight.id, starred: !highlight.starred })}
					/>
				)}
			</div>
			<p className="quote">
				{selecting ? (
					// 상자를 누른 것이 문장 누르기(고르기)로 한 번 더 번지지 않게
					<span className="pick" onClick={(e) => e.stopPropagation()}>
						<InputCheck
							name={`highlight-pick-${highlight.id}`}
							size="small"
							checked={checked}
							onCheckedChange={onToggle}
							aria-label={`${highlight.text.slice(0, 20)} 선택`}
						/>
					</span>
				) : (
					/* 따옴표는 자리를 차지하지 않고 문장 첫 글자 뒤에 겹쳐 그린다 (문장은 다른 줄과 같은 왼쪽 끝) */
					<span className="quote-mark" aria-hidden>
						“
					</span>
				)}
				<span>{highlight.text}</span>
			</p>
			<div className="tools" hidden={selecting}>
				<Link href={`/articles/detail/${highlight.newsletterId}?hl=${highlight.id}`}>원문에서 보기</Link>
				{!editing && (
					<button type="button" onClick={() => setEditing(true)}>
						{highlight.note ? '메모 고치기' : '메모 남기기'}
					</button>
				)}
				<FolderMenu
					label="폴더 옮기기"
					current={highlight.folderId}
					onPick={(folderId) => bulk.mutate({ ids: [highlight.id], action: 'move', folderId })}
				/>
				<button type="button" className="danger" onClick={onRemove}>
					지우기
				</button>
			</div>
			{editing ? (
				<form
					className="edit"
					onSubmit={(event) => {
						event.preventDefault();
						update.mutate({ id: highlight.id, note }, { onSuccess: () => setEditing(false) });
					}}
				>
					<textarea
						value={note}
						onChange={(e) => setNote(e.target.value)}
						rows={3}
						maxLength={2000}
						placeholder="이 문장에 대한 내 생각"
						aria-label="메모"
						autoFocus
					/>
					<div className="actions">
						<button
							type="button"
							onClick={() => {
								setNote(highlight.note ?? '');
								setEditing(false);
							}}
						>
							취소
						</button>
						<button type="submit" className="primary" disabled={update.isPending}>
							저장
						</button>
					</div>
				</form>
			) : (
				highlight.note && (
					<p className="note">
						<span className="note-label">메모</span>
						{highlight.note}
					</p>
				)
			)}
		</article>
	);
}
