'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StarToggle from '@/components/common/icons/StarToggle';
import styled from 'styled-components';
import { LuHighlighter } from 'react-icons/lu';
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
import FolderMenu from './folders/FolderMenu';
import ListHead, { SortSelect } from './list/ListHead';
import LoadMore from './list/LoadMore';
import { folderTag, listBox, sourceLine, textTools } from './list/styles';

/** 구역 이름: 브리핑은 '에디터 브리핑', 소식은 뉴스레터 본문처럼 번호(01) + 그 소식의 제목 */
function sectionName(highlight: Highlight) {
	if (highlight.section === 'briefing') return { index: null, name: '에디터 브리핑' };
	const story = highlight.section?.match(/^story-(\d+)$/);
	if (!story) return { index: null, name: null };
	return { index: story[1].padStart(2, '0'), name: highlight.sectionTitle || `소식 ${story[1]}` };
}

/** 문장 위 출처 한 줄: 관심사 · 뉴스레터 제목(누르면 그 뉴스레터) › 소식 번호 · 제목 */
function Source({ highlight, folder }: { highlight: Highlight; folder?: string }) {
	const newsletter = highlight.newsletter;
	const { index, name } = sectionName(highlight);
	return (
		<p className="source">
			{newsletter && <span className="category">{newsletter.category.name}</span>}
			<Link href={`/articles/detail/${highlight.newsletterId}`} className="newsletter">
				{newsletter?.title ?? `뉴스레터 #${highlight.newsletterId}`}
			</Link>
			{name && (
				<span className="section">
					<span className="sep" aria-hidden>
						›
					</span>
					{index && <span className="index">{index}</span>}
					{name}
				</span>
			)}
			{/* '모든 스크랩'에서 볼 때 어느 폴더인지 */}
			{folder && <span className="folder">{folder}</span>}
		</p>
	);
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

/**
 * 마이페이지 스크랩 (#123 1단계): 뉴스레터 본문에서 스크랩한 문장 · 메모를 모아 본다.
 * 묶지 않고 최근에 스크랩한 것부터 한 줄 목록, 문장마다 위에 출처(관심사 · 뉴스레터 · 소식) 한 줄.
 * 폴더로 정리하고(폴더 줄로 거르기), 문장 아래 원문에서 보기(?hl=번호) · 메모 · 폴더 옮기기 · 지우기, 문장 줄 끝에 중요 표시(별).
 * '선택'으로 골라서 한꺼번에 폴더로 옮기기 · 중요 표시 · 중요 해제 · 복사 · 지우기.
 * 중요 표시한 문장은 지우기 전에 한 번 더 묻는다.
 * 서버에서 폴더 · 보기로 걸러 한 쪽(30개)씩 받고, 끝의 '더 보기'로 이어 붙인다
 */
export default function MyHighlights() {
	const [filter, setFilter] = useState('');
	const [folder, setFolder] = useState<FolderFilter>('all');
	// 정렬: 최근 스크랩순(기본) · 오래된순. 날짜별 묶음도 이 순서를 따른다
	const [order, setOrder] = useState<'desc' | 'asc'>('desc');
	const filters = new URLSearchParams({
		...(folder !== 'all' && { folder: String(folder) }),
		...(filter && { filter }),
		...(order === 'asc' && { order }),
	}).toString();
	const { data, isPending, isError, error, refetch, fetchNextPage, isFetchingNextPage } = useHighlightPages(filters);
	const items = data?.pages.flatMap((p) => p.items);
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
			<StyledHighlights>
				<MyTaste />
				<EmptyState
					icon={LuHighlighter}
					title="스크랩한 문장이 없어요"
					description="뉴스레터를 읽다가 중요한 문장을 드래그해 스크랩하거나 메모를 남기면 여기에 모여요."
					action={{ label: '뉴스레터 둘러보기', href: '/articles' }}
				/>
			</StyledHighlights>
		);
	}

	// 서버가 걸러 준 것을 이어 붙인 목록. 중요 · 메모 수는 고른 폴더 안에서 센 것
	const shown = items ?? [];
	const { starred: stars, memo: memos } = first.counts;
	const total = data.pages[data.pages.length - 1].total;
	const folderName = new Map(folders.map((f) => [f.id, f.name]));
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
		<StyledHighlights>
			<MyTaste />
			<FolderBar
				folders={folders}
				countOf={(f) => f.counts.highlights}
				allLabel="모든 스크랩"
				value={folder}
				onChange={(next) => {
					setFolder(next);
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
					onChange={setFilter}
				/>
				<SortSelect
					value={order}
					options={[
						{ value: 'desc', label: '최근 스크랩순' },
						{ value: 'asc', label: '오래된순' },
					]}
					onChange={setOrder}
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
			{/* 최근에 스크랩한 것부터 (목록이 그 순서로 온다), 카드 한 장 안에 구분선으로 */}
			{/* 스크랩한 날짜별로 묶어서 (최근 날짜부터): 날짜 머리 + 그날 문장들 상자 한 장 */}
			{byDay(shown).map(({ day, items }) => (
				<section key={day} className="day" aria-label={dayLabel(day)}>
					<h4 className="day-head">
						{dayLabel(day)} <span className="day-count">{items.length}</span>
					</h4>
					<ul className="list">
						{items.map((highlight) => (
							<li key={highlight.id}>
								<Source
									highlight={highlight}
									folder={folder === 'all' && highlight.folderId ? folderName.get(highlight.folderId) : undefined}
								/>
								<HighlightItem
									highlight={highlight}
									focused={highlight.id === focused}
									selecting={selecting}
									checked={selected.has(highlight.id)}
									onToggle={() => toggle(highlight.id)}
									onRemove={() => confirmRemove([highlight])}
									// 고르는 중에 고른 것 하나를 끌면 고른 것 전부, 아니면 이것 하나
									onDragStart={() =>
										setDragging(selecting && selected.has(highlight.id) ? [...selected] : [highlight.id])
									}
									onDragEnd={() => setDragging(null)}
								/>
							</li>
						))}
					</ul>
				</section>
			))}
			<LoadMore remaining={total - shown.length} loading={isFetchingNextPage} onClick={() => fetchNextPage()} />
			{/* 고르는 중: 아래에 붙어 따라오는 막대 */}
			{selecting && (
				<div className="select-bar" role="region" aria-label="선택한 문장 한꺼번에">
					<InputCheck
						name="highlights-select-all"
						className="select-all"
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
		</StyledHighlights>
	);
}

function HighlightItem({
	highlight,
	focused,
	selecting,
	checked,
	onToggle,
	onRemove,
	onDragStart,
	onDragEnd,
}: {
	highlight: Highlight;
	focused: boolean;
	selecting: boolean;
	checked: boolean;
	onToggle: () => void;
	onRemove: () => void;
	onDragStart: () => void;
	onDragEnd: () => void;
}) {
	const { update, bulk } = useHighlightMutations();
	const [editing, setEditing] = useState(false);
	const [note, setNote] = useState(highlight.note ?? '');

	return (
		<article
			id={`hl-${highlight.id}`}
			className={`item ${focused ? 'focused' : ''} ${selecting ? 'selecting' : ''} ${checked ? 'checked' : ''}`}
			title={`${dateFormatter(highlight.createdAt)} 스크랩`}
			// 고르는 중에는 문장 어디를 눌러도 고르기
			onClick={selecting ? onToggle : undefined}
			// 끌어서 폴더에 넣기 (데스크톱 마우스. 메모를 고치는 중엔 끌지 않음)
			draggable={!editing}
			onDragStart={(event) => {
				event.dataTransfer.effectAllowed = 'move';
				event.dataTransfer.setData('text/plain', highlight.text);
				onDragStart();
			}}
			onDragEnd={onDragEnd}
		>
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
				/* 스크랩한 문장만 따옴표 칸만큼 들여 쓴다 */
				<span className="quote-mark" aria-hidden>
					“
				</span>
			)}
			<p className="quote">
				<span>{highlight.text}</span>
			</p>
			{/* 중요 표시: 문장 줄 오른쪽 끝 별 아이콘 버튼 (켜면 기본색 별) */}
			{!selecting && (
				<StarToggle
					className="star-toggle"
					pressed={highlight.starred}
					onToggle={() => update.mutate({ id: highlight.id, starred: !highlight.starred })}
				/>
			)}
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

const StyledHighlights = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
	/* 위 여백은 탭 줄이 둔다 */
	padding: 0 0 2rem;

	/* '선택' 단추 (목록 머리 오른쪽) */
	.select-toggle {
		display: inline-flex;
		align-items: center;
		height: 2rem;
		padding: 0 0.875rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.chip};
		font: inherit;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.text};
		cursor: pointer;

		&:hover,
		&[aria-pressed='true'] {
			border-color: ${({ theme }) => theme.color.primary};
			color: ${({ theme }) => theme.color.primary};
		}
	}

	.empty {
		padding: 2rem 0;
		text-align: center;
		font-size: ${({ theme }) => theme.fontSize.small};
		color: ${({ theme }) => theme.color.subText};
	}

	/* 스크랩 목록: 카드 한 장 안에 문장마다 구분선 */
	/* 날짜별 묶음: 날짜 머리(작게) 아래 그날 문장 상자 */
	.day {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.day-head {
		margin: 0;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		color: ${({ theme }) => theme.color.text};

		.day-count {
			margin-left: 0.25rem;
			font-weight: ${({ theme }) => theme.fontWeight.regular};
			color: ${({ theme }) => theme.color.subText};
		}
	}

	.list {
		${listBox}
	}

	/* 문장 위 출처 한 줄: 관심사 · 뉴스레터 제목 › 01 소식 제목 */
	.source {
		${sourceLine}
		margin: 0 0 0.5rem;

		.newsletter {
			color: ${({ theme }) => theme.color.text};

			&:hover {
				color: ${({ theme }) => theme.color.primary};
				text-decoration: underline;
			}
		}

		.section {
			display: inline-flex;
			align-items: baseline;
			gap: 0.375rem;
		}

		.sep {
			color: ${({ theme }) => theme.color.disabled};
		}

		/* '모든 스크랩'에서 어느 폴더인지 */
		.folder {
			${folderTag}
			margin-left: 0.25rem;
		}

		/* 뉴스레터 본문의 소식 번호와 같은 모양 */
		.index {
			font-size: 0.75rem;
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			color: ${({ theme }) => theme.color.primary};
			font-variant-numeric: tabular-nums;
		}
	}

	.item {
		display: grid;
		grid-template-columns: 1.5rem minmax(0, 1fr) auto;
		grid-template-areas:
			'mark quote star'
			'note note note'
			'tools tools tools';
		gap: 0.375rem 0.25rem;
		scroll-margin-top: 6rem;

		/* 알림에서 바로 온 문장: 잠깐 배경으로 표시 */
		&.focused .quote span {
			background-color: color-mix(in srgb, ${({ theme }) => theme.color.primary} 14%, transparent);
		}
	}

	/* 문장이 먼저 보이게: 메모 · 동작보다 굵고 진하게 */
	/* 따옴표 칸 */
	/* 고르는 중: 따옴표 자리에 체크칸, 문장 어디를 눌러도 고르기 */
	/* 체크칸: 문장 첫 줄 높이(줄 높이 1.75 × 글자 1rem) 안에서 세로 가운데 */
	.pick {
		grid-area: mark;
		display: flex;
		align-items: center;
		height: 1.75rem;
	}

	.item.selecting {
		cursor: pointer;
		border-radius: ${({ theme }) => theme.radius.control};

		/* 고르는 중에는 문장 아래 동작을 숨긴다 (hidden 속성을 display가 덮어써서 따로) */
		.tools {
			display: none;
		}
	}

	.item.checked .quote {
		color: ${({ theme }) => theme.color.primary};
	}

	/* 중요 표시 별 (공통 StarToggle): 문장 줄 끝, 줄 높이에 맞춰 조금 작게 */
	.star-toggle {
		grid-area: star;
		align-self: start;
		width: 2.25rem;
		height: 2.25rem;
		margin: -0.375rem -0.5rem 0 0;

		svg {
			width: 1.25rem;
			height: 1.25rem;
		}
	}

	/* 선택 막대: 목록 아래에 붙어 따라온다 */
	.select-bar {
		position: sticky;
		bottom: 1rem;
		z-index: 5;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 1rem;
		/* 목록 카드와 같은 안쪽 여백: 체크칸 시작 위치를 문장 체크칸과 맞춘다 */
		padding: 0.75rem 1.5rem;

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			padding: 0.75rem 1rem;
		}
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.background};
		font-size: ${({ theme }) => theme.fontSize.small};

		.select-all .text {
			font-size: ${({ theme }) => theme.fontSize.small};
		}

		.picked {
			margin-right: auto;
			color: ${({ theme }) => theme.color.subText};
		}

		/* 한꺼번에: 폴더로 옮기기 · 중요 표시 · 중요 해제 · 복사 · 취소 · 지우기 */
		.bulk {
			display: flex;
			gap: 0.375rem;

			/* 모바일: 막대가 높아지지 않게 한 줄로 두고 옆으로 밀어 본다 (폴더 메뉴는 위로 펼쳐져 잘리지 않게 visible) */
			@media ${({ theme }) => theme.mediaQuery.mobile} {
				width: 100%;
				overflow-x: auto;
				scrollbar-width: none;

				&::-webkit-scrollbar {
					display: none;
				}

				> button,
				.trigger {
					flex-shrink: 0;
					white-space: nowrap;
				}
			}
		}

		/* 폴더 메뉴 안의 버튼에는 붙지 않게 */
		.bulk > button,
		.bulk .trigger {
			padding: 0.5rem 0.875rem;
			border: 1px solid ${({ theme }) => theme.color.border};
			border-radius: ${({ theme }) => theme.radius.control};
			font: inherit;
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			color: ${({ theme }) => theme.color.text};
			cursor: pointer;

			&.danger {
				/* 'N개 지우기'의 숫자가 바뀌어도 너비가 그대로 */
				min-width: 7.5rem;
				font-variant-numeric: tabular-nums;
				text-align: center;
				border-color: ${({ theme }) => theme.color.error};
				background: ${({ theme }) => theme.color.error};
				color: ${({ theme }) => theme.color.white};
			}

			&:disabled {
				opacity: 0.4;
				cursor: default;
			}
		}
	}

	/* 문장 첫머리에 살짝 걸치는 장식 따옴표: 세리프 글꼴의 가는 곡선 모양, 옅게 글자 뒤에 */
	.quote-mark {
		grid-area: mark;
		z-index: 0;
		/* 위아래로 넘친 만큼 빼서 줄 높이에 영향을 주지 않게 */
		height: 0;
		margin-top: -0.375rem;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: 3.25rem;
		line-height: 1;
		color: ${({ theme }) => theme.color.primary};
		opacity: 0.28;
		/* 칸에서 문장 쪽으로 밀어 첫 글자에 살짝 걸치게 */
		transform: translateX(0.5rem);
		user-select: none;
		pointer-events: none;
	}

	.quote {
		position: relative;
		z-index: 1;
		grid-area: quote;
		margin: 0;
		font-weight: ${({ theme }) => theme.fontWeight.regular};
		line-height: 1.75;
		color: ${({ theme }) => theme.color.text};
		word-break: keep-all;

		span {
			border-radius: 2px;
			transition: background-color 0.4s;
		}
	}

	/* 메모: 상자 없이 '메모' 이름표 + 글 */
	.note {
		grid-area: note;
		margin: 0;
		font-size: ${({ theme }) => theme.fontSize.small};
		line-height: 1.6;
		white-space: pre-wrap;
		color: ${({ theme }) => theme.color.mediumGrey};

		.note-label {
			margin-right: 0.5rem;
			font-size: 0.75rem;
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};
			color: ${({ theme }) => theme.color.primary};
		}
	}

	/* 글자 동작 */
	.tools {
		${textTools}
		grid-area: tools;

		.danger:hover {
			color: ${({ theme }) => theme.color.error};
		}
	}

	.edit {
		grid-area: note;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;

		textarea {
			width: 100%;
			padding: 0.625rem 0.75rem;
			border: 1px solid ${({ theme }) => theme.color.border};
			border-radius: ${({ theme }) => theme.radius.control};
			background: ${({ theme }) => theme.color.background};
			color: ${({ theme }) => theme.color.text};
			font: inherit;
			line-height: 1.6;
			resize: vertical;

			&:focus {
				outline: none;
				border-color: ${({ theme }) => theme.color.primary};
			}
		}

		.actions {
			display: flex;
			justify-content: flex-end;
			gap: 0.375rem;

			button {
				padding: 0.375rem 0.875rem;
				border: 1px solid ${({ theme }) => theme.color.border};
				border-radius: ${({ theme }) => theme.radius.control};
				font: inherit;
				font-size: ${({ theme }) => theme.fontSize.extraSmall};
				color: ${({ theme }) => theme.color.text};
				cursor: pointer;

				&.primary {
					border-color: ${({ theme }) => theme.color.primary};
					background: ${({ theme }) => theme.color.primary};
					color: ${({ theme }) => theme.color.white};
				}
			}
		}
	}
`;
