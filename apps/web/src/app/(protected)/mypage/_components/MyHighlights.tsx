'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import { LuHighlighter, LuStar } from 'react-icons/lu';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import FilterChips from '@/components/common/FilterChips';
import InputCheck from '@/components/common/InputCheck';
import Skeleton from '@/components/common/loader/Skeleton';
import { errorStateFor, statusOf } from '@/constants/errors';
import { Highlight, useHighlightMutations, useHighlights } from '@/hooks/useHighlights';
import { useConfirmRemoveHighlights } from '@/hooks/useConfirmRemoveHighlights';
import { dateFormatter } from '@/utils/formatter';
import MyTaste from './MyTaste';

/** 구역 이름: 브리핑은 '에디터 브리핑', 소식은 뉴스레터 본문처럼 번호(01) + 그 소식의 제목 */
function sectionName(highlight: Highlight) {
	if (highlight.section === 'briefing') return { index: null, name: '에디터 브리핑' };
	const story = highlight.section?.match(/^story-(\d+)$/);
	if (!story) return { index: null, name: null };
	return { index: story[1].padStart(2, '0'), name: highlight.sectionTitle ?? `소식 ${story[1]}` };
}

/** 문장 위 출처 한 줄: 관심사 · 뉴스레터 제목(누르면 그 뉴스레터) › 소식 번호 · 제목 */
function Source({ highlight }: { highlight: Highlight }) {
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
		</p>
	);
}

const FILTERS: Record<string, (h: Highlight) => boolean> = {
	starred: (h) => h.starred,
	memo: (h) => Boolean(h.note),
};

/**
 * 마이페이지 스크랩 (#123 1단계): 뉴스레터 본문에서 스크랩한 문장 · 메모를 모아 본다.
 * 묶지 않고 최근에 스크랩한 것부터 한 줄 목록, 문장마다 위에 출처(관심사 · 뉴스레터 · 소식) 한 줄.
 * 문장 아래 원문에서 보기(?hl=번호) · 메모 · 지우기, 문장 줄 끝에 중요 표시(별). '선택'으로 골라서 한 번에 지운다.
 * 중요 표시한 문장은 지우기 전에 한 번 더 묻는다
 */
export default function MyHighlights() {
	const { data, isPending, isError, error, refetch } = useHighlights();
	const [filter, setFilter] = useState('');
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
		if (!target || !data?.some((h) => h.id === target)) return;
		document.getElementById(`hl-${target}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
		setFocused(target);
		const timer = window.setTimeout(() => setFocused(null), 2400);
		return () => window.clearTimeout(timer);
	}, [data]);

	if (isPending) return <Skeleton />;
	if (isError) return <ErrorState inline {...errorStateFor(statusOf(error))} onRetry={() => refetch()} />;
	if (data.length === 0) {
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

	const memos = data.filter(FILTERS.memo).length;
	const stars = data.filter(FILTERS.starred).length;
	const shown = FILTERS[filter] ? data.filter(FILTERS[filter]) : data;
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
			<div className="list-head">
				<h3>
					스크랩한 문장 <span className="count">{data.length}</span>
				</h3>
				<div className="list-tools">
					<FilterChips
						label="보기"
						options={[
							{ value: '', label: '전체' },
							{ value: 'starred', label: `중요 ${stars}` },
							{ value: 'memo', label: `메모만 ${memos}` },
						]}
						value={filter}
						onChange={setFilter}
					/>
					<button
						type="button"
						className="select-toggle"
						aria-pressed={selecting}
						onClick={() => (selecting ? stopSelecting() : setSelecting(true))}
					>
						{selecting ? '완료' : '선택'}
					</button>
				</div>
			</div>
			{shown.length === 0 && (
				<p className="empty">
					{filter === 'starred'
						? '중요 표시한 문장이 없어요. 문장 옆 별을 누르면 여기 모여요.'
						: '메모를 남긴 문장이 없어요.'}
				</p>
			)}
			{/* 최근에 스크랩한 것부터 (목록이 그 순서로 온다), 카드 한 장 안에 구분선으로 */}
			{shown.length > 0 && (
				<ul className="list">
					{shown.map((highlight) => (
						<li key={highlight.id}>
							<Source highlight={highlight} />
							<HighlightItem
								highlight={highlight}
								focused={highlight.id === focused}
								selecting={selecting}
								checked={selected.has(highlight.id)}
								onToggle={() => toggle(highlight.id)}
								onRemove={() => confirmRemove([highlight])}
							/>
						</li>
					))}
				</ul>
			)}
			{/* 고르는 중: 아래에 붙어 따라오는 막대 */}
			{selecting && (
				<div className="select-bar" role="region" aria-label="선택한 문장 지우기">
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
					<button type="button" onClick={stopSelecting}>
						취소
					</button>
					<button
						type="button"
						className="danger"
						disabled={selected.size === 0}
						onClick={() =>
							confirmRemove(
								data.filter((h) => selected.has(h.id)),
								{ onDone: stopSelecting },
							)
						}
					>
						{selected.size}개 지우기
					</button>
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
}: {
	highlight: Highlight;
	focused: boolean;
	selecting: boolean;
	checked: boolean;
	onToggle: () => void;
	onRemove: () => void;
}) {
	const { update } = useHighlightMutations();
	const [editing, setEditing] = useState(false);
	const [note, setNote] = useState(highlight.note ?? '');

	return (
		<article
			id={`hl-${highlight.id}`}
			className={`item ${focused ? 'focused' : ''} ${selecting ? 'selecting' : ''} ${checked ? 'checked' : ''}`}
			title={`${dateFormatter(highlight.createdAt)} 스크랩`}
			// 고르는 중에는 문장 어디를 눌러도 고르기
			onClick={selecting ? onToggle : undefined}
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
				<button
					type="button"
					className={`star-toggle ${highlight.starred ? 'on' : ''}`}
					aria-pressed={highlight.starred}
					aria-label={highlight.starred ? '중요 표시 빼기' : '중요 표시'}
					title={highlight.starred ? '중요 표시 빼기' : '중요 표시'}
					onClick={() => update.mutate({ id: highlight.id, starred: !highlight.starred })}
				>
					<LuStar aria-hidden />
				</button>
			)}
			<div className="tools" hidden={selecting}>
				<Link href={`/articles/detail/${highlight.newsletterId}?hl=${highlight.id}`}>원문에서 보기</Link>
				{!editing && (
					<button type="button" onClick={() => setEditing(true)}>
						{highlight.note ? '메모 고치기' : '메모 남기기'}
					</button>
				)}
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
	padding: 2rem 0;

	/* 목록 머리: '스크랩한 문장 N' · 전체 / 메모만 */
	.list-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem 1rem;
		margin-top: 1rem;

		h3 {
			margin: 0;
			font-size: ${({ theme }) => theme.fontSize.medium};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
		}

		.count {
			margin-left: 0.25rem;
			color: ${({ theme }) => theme.color.primary};
		}

		.list-tools {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: 0.5rem 0.75rem;
		}

		.select-toggle {
			padding: 0.375rem 0.75rem;
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

		/* 칩 몇 개뿐이라 '보기' 이름표는 화면에서 빼고 묶음 이름(aria-label)으로만 */
		.chips-label {
			display: none;
		}
	}

	.empty {
		padding: 2rem 0;
		text-align: center;
		font-size: ${({ theme }) => theme.fontSize.small};
		color: ${({ theme }) => theme.color.subText};
	}

	/* 스크랩 목록: 카드 한 장 안에 문장마다 구분선 */
	.list {
		display: flex;
		flex-direction: column;
		margin: 0;
		padding: 0 1.5rem;
		list-style: none;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			padding: 0 1rem;
		}

		> li {
			padding: 1rem 0;
		}

		> li + li {
			border-top: 1px solid ${({ theme }) => theme.color.border};
		}
	}

	/* 문장 위 출처 한 줄: 관심사 · 뉴스레터 제목 › 01 소식 제목 */
	.source {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.125rem 0.375rem;
		margin: 0 0 0.5rem;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.subText};
		word-break: keep-all;

		.category {
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};
			color: ${({ theme }) => theme.color.primary};
		}

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
	.pick {
		grid-area: mark;
		display: inline-flex;
		margin-top: 0.3em;
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

	/* 중요 표시 버튼: 꺼지면 회색 빈 별, 켜지면 기본색(보라) 꽉 찬 별 */
	.star-toggle {
		grid-area: star;
		align-self: start;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		margin: -0.25rem -0.375rem 0 0;
		border-radius: ${({ theme }) => theme.radius.control};
		color: ${({ theme }) => theme.color.disabled};
		cursor: pointer;

		svg {
			width: 1.125rem;
			height: 1.125rem;
		}

		&:hover {
			background: ${({ theme }) => theme.color.surface};
			color: ${({ theme }) => theme.color.primary};
		}

		&.on {
			color: ${({ theme }) => theme.color.primary};

			svg {
				fill: currentColor;
			}
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
		padding: 0.75rem 1rem;
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

		button {
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
		grid-area: tools;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem 1rem;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};

		a,
		button {
			padding: 0;
			font: inherit;
			color: ${({ theme }) => theme.color.subText};
			cursor: pointer;

			&:hover {
				color: ${({ theme }) => theme.color.primary};
				text-decoration: underline;
			}
		}

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
