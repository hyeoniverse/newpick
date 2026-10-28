'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import styled from 'styled-components';
import { LuHighlighter, LuMessageSquarePlus, LuTrash2 } from 'react-icons/lu';
import { useAuth } from '@/hooks/useAuth';
import { useOpenLogin } from '@/hooks/useOpenLogin';
import { Highlight as Scrap, useHighlightMutations, useHighlights } from '@/hooks/useHighlights';
import { findTextRange } from '@/utils/textRange';

interface Props {
	newsletterId: number;
	/** 뉴스레터 본문 (저장된 HTML이 들어 있는 곳) */
	rootRef: React.RefObject<HTMLElement | null>;
}

type Picked = { text: string; section?: string; rect: DOMRect };
type Popover =
	| { kind: 'toolbar'; picked: Picked }
	| { kind: 'memo'; picked: Picked }
	| { kind: 'saved'; highlight: Scrap; rect: DOMRect };

const MAX_TEXT = 500;

/** 스크랩이 없을 때(비로그인 · 불러오는 중) 쓰는 빈 목록. 렌더마다 새 []를 만들면 칠하기 효과가 끝없이 돈다 */
const NO_HIGHLIGHTS: Scrap[] = [];

/** 칠할 띠 하나 (본문 기준 위치) */
type Band = { id: number; note: boolean; left: number; top: number; width: number; height: number };
/** 줄 상자(글꼴 높이의 약 1.2배)에서 글자가 실제로 차지하는 부분: 위 12%를 비우고 78%만 */
const BAND_TOP = 0.12;
const BAND_HEIGHT = 0.78;

const sameBands = (a: Band[], b: Band[]) =>
	a.length === b.length &&
	a.every(
		(x, i) =>
			x.id === b[i].id &&
			x.note === b[i].note &&
			Math.abs(x.left - b[i].left) < 0.5 &&
			Math.abs(x.top - b[i].top) < 0.5 &&
			Math.abs(x.width - b[i].width) < 0.5 &&
			Math.abs(x.height - b[i].height) < 0.5,
	);

/** 본문 안 위치의 구역: 브리핑 · 소식 N (방문 통계 구역 이름과 같게) */
function sectionOf(root: HTMLElement, node: Node | null) {
	const el = node instanceof Element ? node : node?.parentElement;
	const briefing = el?.closest('.briefing');
	if (briefing && root.contains(briefing)) return 'briefing';
	const story = el?.closest('.story');
	if (!story || !root.contains(story)) return undefined;
	return `story-${Array.from(root.querySelectorAll('.story')).indexOf(story) + 1}`;
}

/** 저장한 문장이 지금 본문의 어디에 있는지: 그 구역 안에서 먼저 찾고, 없으면 본문 전체에서 */
function rangeOf(root: HTMLElement, highlight: Scrap) {
	if (highlight.section) {
		const story = highlight.section.match(/^story-(\d+)$/);
		const scope =
			highlight.section === 'briefing'
				? root.querySelector('.briefing')
				: story
					? root.querySelectorAll('.story')[Number(story[1]) - 1]
					: null;
		const found = scope && findTextRange(scope, highlight.text);
		if (found) return found;
	}
	return findTextRange(root, highlight.text);
}

/** 누른 곳의 글자 위치 (크롬 · 사파리 / 파이어폭스) */
function caretAt(x: number, y: number): { node: Node; offset: number } | null {
	const doc = document as Document & {
		caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
	};
	const position = doc.caretPositionFromPoint?.(x, y);
	if (position) return { node: position.offsetNode, offset: position.offset };
	const range = document.caretRangeFromPoint?.(x, y);
	return range ? { node: range.startContainer, offset: range.startOffset } : null;
}

/**
 * 스크랩 · 메모 (#123 1단계): 본문에서 문장을 고르면 작은 도구 막대(스크랩 · 메모),
 * 저장한 문장은 형광펜(메모가 있으면 밑줄도)으로 다시 칠하고, 누르면 메모 보기 · 고치기 · 지우기.
 * 형광펜은 본문 뒤에 띠를 따로 그려 본문 HTML(React가 그린 것)을 건드리지 않는다.
 * 마이페이지에서 '원문에서 보기'로 오면(?hl=번호) 그 문장으로 스크롤한다
 */
export default function HighlightLayer({ newsletterId, rootRef }: Props) {
	const { user } = useAuth();
	const openLogin = useOpenLogin();
	const searchParams = useSearchParams();
	const { data: highlights = NO_HIGHLIGHTS } = useHighlights(newsletterId);
	const { create, update, remove } = useHighlightMutations();
	const [popover, setPopover] = useState<Popover | null>(null);
	const [memo, setMemo] = useState('');
	const ranges = useRef(new Map<number, Range>());
	const scrolledTo = useRef<number | null>(null);
	const openedAt = useRef(0);
	const bandsRef = useRef<HTMLDivElement>(null);
	const [bands, setBands] = useState<Band[]>([]);
	const [focusId, setFocusId] = useState<number | null>(null);

	// 형광펜 칠하기 (#123): 문장의 줄마다 띠를 본문 뒤에 그린다.
	// 브라우저 기본 칠하기(::highlight · 배경)는 글꼴의 줄 상자 높이를 따라가서, 글꼴 · 크기 · 굵기가 다른 곳(제목 · 굵은 글 · 강조)마다
	// 띠가 글자보다 위아래로 남거나 잘린다. 줄 상자에서 글자가 실제로 차지하는 가운데 부분만 칠해 어디서나 같은 모양으로 맞춘다
	useEffect(() => {
		const root = rootRef.current;
		const layer = bandsRef.current;
		if (!root || !layer) return;
		const paint = () => {
			ranges.current.clear();
			const base = layer.getBoundingClientRect();
			const next: Band[] = [];
			for (const highlight of highlights) {
				const range = rangeOf(root, highlight);
				if (!range) continue;
				ranges.current.set(highlight.id, range);
				for (const rect of Array.from(range.getClientRects())) {
					if (rect.width < 1 || rect.height < 1) continue;
					next.push({
						id: highlight.id,
						note: Boolean(highlight.note),
						left: rect.left - base.left,
						top: rect.top - base.top + rect.height * BAND_TOP,
						width: rect.width,
						height: rect.height * BAND_HEIGHT,
					});
				}
			}
			// 띠가 그대로면 상태를 바꾸지 않는다 (크기 · 글꼴 감지로 자주 불려도 다시 그리지 않게)
			setBands((prev) => (sameBands(prev, next) ? prev : next));

			// 마이페이지에서 고른 문장으로
			const target = Number(searchParams.get('hl'));
			const range = target ? ranges.current.get(target) : undefined;
			if (range && scrolledTo.current !== target) {
				scrolledTo.current = target;
				const rect = range.getBoundingClientRect();
				window.scrollTo({ top: window.scrollY + rect.top - window.innerHeight / 3, behavior: 'smooth' });
				setFocusId(target);
				window.setTimeout(() => setFocusId(null), 2400);
			}
		};
		paint();
		// 본문 HTML이 늦게 들어오거나 바뀌면, 사진이 늦게 떠 줄 위치가 바뀌면, 글꼴을 받으면 다시
		const mutations = new MutationObserver(paint);
		mutations.observe(root, { childList: true, subtree: true, characterData: true });
		const resize = new ResizeObserver(paint);
		resize.observe(root);
		document.fonts?.ready.then(paint).catch(() => {});
		return () => {
			mutations.disconnect();
			resize.disconnect();
		};
	}, [highlights, rootRef, searchParams]);

	// 문장 고르기 → 도구 막대
	const readSelection = useCallback(() => {
		const root = rootRef.current;
		const selection = window.getSelection();
		if (!root || !selection || selection.isCollapsed || selection.rangeCount === 0) return null;
		const range = selection.getRangeAt(0);
		if (!root.contains(range.commonAncestorContainer)) return null;
		const text = selection.toString().replace(/\s+/g, ' ').trim();
		if (text.length < 2) return null;
		return {
			text: text.slice(0, MAX_TEXT),
			section: sectionOf(root, range.startContainer),
			rect: range.getBoundingClientRect(),
		};
	}, [rootRef]);

	useEffect(() => {
		const onPointerUp = (event: Event) => {
			// 도구 막대 · 메모 칸 안을 누른 것은 무시
			if ((event.target as Element | null)?.closest?.('[data-highlight-popover]')) return;
			window.setTimeout(() => {
				const picked = readSelection();
				if (picked) {
					openedAt.current = window.scrollY;
					setPopover({ kind: 'toolbar', picked });
					return;
				}
				// 고른 글 없이 형광펜을 누르면 그 스크랩
				const root = rootRef.current;
				const point = event as MouseEvent;
				if (!root || !('clientX' in point)) return setPopover((p) => (p?.kind === 'memo' ? p : null));
				const caret = caretAt(point.clientX, point.clientY);
				if (caret && root.contains(caret.node)) {
					for (const highlight of highlights) {
						const range = ranges.current.get(highlight.id);
						if (range?.isPointInRange(caret.node, caret.offset)) {
							setMemo(highlight.note ?? '');
							setPopover({ kind: 'saved', highlight, rect: range.getBoundingClientRect() });
							return;
						}
					}
				}
				setPopover((p) => (p?.kind === 'memo' ? p : null));
			}, 0);
		};
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setPopover(null);
			else if (event.shiftKey) {
				const picked = readSelection();
				if (picked) {
					openedAt.current = window.scrollY;
					setPopover({ kind: 'toolbar', picked });
				}
			}
		};
		// 도구 막대는 글을 따라 움직이지 않으므로, 스크롤하면 닫는다 (부드러운 스크롤 끝자락 같은 작은 움직임은 무시)
		const close = () => {
			if (Math.abs(window.scrollY - openedAt.current) > 40) setPopover((p) => (p?.kind === 'toolbar' ? null : p));
		};
		document.addEventListener('mouseup', onPointerUp);
		document.addEventListener('touchend', onPointerUp);
		document.addEventListener('keyup', onKey);
		window.addEventListener('scroll', close, { passive: true });
		return () => {
			document.removeEventListener('mouseup', onPointerUp);
			document.removeEventListener('touchend', onPointerUp);
			document.removeEventListener('keyup', onKey);
			window.removeEventListener('scroll', close);
		};
	}, [highlights, readSelection, rootRef]);

	const needLogin = () => {
		openLogin('스크랩 · 메모는 로그인하면 쓸 수 있어요.');
		setPopover(null);
	};

	const save = (picked: Picked, note?: string) => {
		if (!user) return needLogin();
		create.mutate(
			{ newsletterId, section: picked.section, text: picked.text, ...(note?.trim() && { note: note.trim() }) },
			{ onSuccess: () => window.getSelection()?.removeAllRanges() },
		);
		setPopover(null);
		setMemo('');
	};

	const bandLayer = (
		<StyledBands ref={bandsRef} aria-hidden>
			{bands.map((band, i) => (
				<span
					key={`${band.id}-${i}`}
					className={`${band.note ? 'note' : ''} ${band.id === focusId ? 'focus' : ''}`}
					style={{ left: band.left, top: band.top, width: band.width, height: band.height }}
				/>
			))}
		</StyledBands>
	);

	if (!popover) return bandLayer;

	const rect = popover.kind === 'saved' ? popover.rect : popover.picked.rect;
	// 터치 화면은 글 아래에 (휴대폰의 기본 복사 메뉴가 위에 뜨므로)
	const below =
		popover.kind !== 'toolbar' || (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches);
	const style: React.CSSProperties = {
		left: Math.min(Math.max(rect.left + rect.width / 2, 120), window.innerWidth - 120),
		top: below ? rect.bottom + 10 : rect.top - 10,
		transform: below ? 'translateX(-50%)' : 'translate(-50%, -100%)',
	};

	return (
		<>
			{bandLayer}
			{/* 본문 스타일(문단 · 블록 여백)이 붙지 않게 body에 띄운다 */}
			{createPortal(
				<StyledPopover style={style} data-highlight-popover role="dialog" aria-label="스크랩 · 메모">
					{popover.kind === 'toolbar' && (
						<div className="toolbar">
							<button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => save(popover.picked)}>
								<LuHighlighter aria-hidden /> 스크랩
							</button>
							<span className="divider" aria-hidden />
							<button
								type="button"
								onMouseDown={(e) => e.preventDefault()}
								onClick={() => (user ? setPopover({ kind: 'memo', picked: popover.picked }) : needLogin())}
							>
								<LuMessageSquarePlus aria-hidden /> 메모
							</button>
						</div>
					)}
					{popover.kind === 'memo' && (
						<form
							className="memo"
							onSubmit={(event) => {
								event.preventDefault();
								save(popover.picked, memo);
							}}
						>
							<blockquote>{popover.picked.text}</blockquote>
							<textarea
								value={memo}
								onChange={(e) => setMemo(e.target.value)}
								placeholder="이 문장에 대한 내 생각"
								rows={3}
								maxLength={2000}
								autoFocus
							/>
							<div className="actions">
								<button type="button" onClick={() => setPopover(null)}>
									취소
								</button>
								<button type="submit" className="primary" disabled={!memo.trim()}>
									메모 저장
								</button>
							</div>
						</form>
					)}
					{popover.kind === 'saved' && (
						<form
							className="memo"
							onSubmit={(event) => {
								event.preventDefault();
								update.mutate({ id: popover.highlight.id, note: memo });
								setPopover(null);
							}}
						>
							<p className="label">내 스크랩</p>
							<textarea
								value={memo}
								onChange={(e) => setMemo(e.target.value)}
								placeholder="메모 남기기 (선택)"
								rows={3}
								maxLength={2000}
							/>
							<div className="actions">
								<button
									type="button"
									className="danger"
									onClick={() => {
										remove.mutate(popover.highlight.id);
										setPopover(null);
									}}
								>
									<LuTrash2 aria-hidden /> 스크랩 지우기
								</button>
								<button type="submit" className="primary" disabled={memo === (popover.highlight.note ?? '')}>
									메모 저장
								</button>
							</div>
						</form>
					)}
				</StyledPopover>,
				document.body,
			)}
		</>
	);
}

/**
 * 형광펜 띠: 본문 글자 뒤(z-index -1, 본문 틀이 isolation으로 따로 쌓임)에 깐다. 누르기는 본문이 받는다.
 * 스크랩은 옅은 주 색, 메모가 있으면 아래에 주 색 줄, 마이페이지에서 온 문장은 잠깐 진하게
 */
const StyledBands = styled.div`
	position: absolute;
	inset: 0;
	z-index: -1;
	pointer-events: none;

	span {
		position: absolute;
		border-radius: 2px;
		background: color-mix(in srgb, ${({ theme }) => theme.color.primary} 18%, transparent);
		transition: background-color 0.3s;

		&.note {
			box-shadow: inset 0 -2px 0 ${({ theme }) => theme.color.primary};
		}

		&.focus {
			background: color-mix(in srgb, ${({ theme }) => theme.color.primary} 40%, transparent);
		}
	}
`;

const StyledPopover = styled.div`
	position: fixed;
	z-index: 1000;
	display: flex;
	flex-direction: column;
	max-width: min(22rem, calc(100vw - 2rem));
	line-height: 1.5;
	border: 1px solid ${({ theme }) => theme.color.border};
	border-radius: ${({ theme }) => theme.radius.surface};
	background: ${({ theme }) => theme.color.background};
	font-size: ${({ theme }) => theme.fontSize.extraSmall};

	/* 단추는 브라우저 기본 글꼴(13.3px)을 쓰므로 글꼴을 물려받게 */
	button,
	textarea {
		font: inherit;
	}

	button {
		line-height: 1;
	}

	/* 도구 막대: 32px 단추 둘 + 가는 세로줄, 막대 높이는 단추에 맞춘다 */
	.toolbar {
		display: flex;
		align-items: center;
		gap: 0.125rem;
		padding: 0.25rem;

		button {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			gap: 0.375rem;
			height: 2rem;
			padding: 0 0.75rem;
			border-radius: ${({ theme }) => theme.radius.control};
			color: ${({ theme }) => theme.color.text};
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};
			white-space: nowrap;
			cursor: pointer;

			svg {
				flex-shrink: 0;
				width: 1rem;
				height: 1rem;
				color: ${({ theme }) => theme.color.primary};
			}

			&:hover {
				background: ${({ theme }) => theme.color.tertiary};
				color: ${({ theme }) => theme.color.primary};
			}
		}

		.divider {
			width: 1px;
			height: 1rem;
			background: ${({ theme }) => theme.color.border};
		}
	}

	.memo {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		width: 20rem;
		max-width: 100%;
		padding: 0.875rem;
	}

	blockquote {
		margin: 0;
		max-height: 4.5rem;
		overflow: hidden;
		padding-left: 0.625rem;
		border-left: 2px solid ${({ theme }) => theme.color.primary};
		color: ${({ theme }) => theme.color.subText};
		line-height: 1.5;
	}

	.label {
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		color: ${({ theme }) => theme.color.primary};
	}

	textarea {
		width: 100%;
		padding: 0.5rem 0.625rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.control};
		background: ${({ theme }) => theme.color.background};
		color: ${({ theme }) => theme.color.text};
		font: inherit;
		line-height: 1.5;
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
			display: inline-flex;
			align-items: center;
			gap: 0.25rem;
			padding: 0.375rem 0.75rem;
			border: 1px solid ${({ theme }) => theme.color.border};
			border-radius: ${({ theme }) => theme.radius.control};
			color: ${({ theme }) => theme.color.text};
			cursor: pointer;

			&.primary {
				border-color: ${({ theme }) => theme.color.primary};
				background: ${({ theme }) => theme.color.primary};
				color: ${({ theme }) => theme.color.white};
			}

			&.danger {
				margin-right: auto;
				border-color: transparent;
				color: ${({ theme }) => theme.color.error};
			}

			&:disabled {
				opacity: 0.5;
				cursor: default;
			}
		}
	}
`;
