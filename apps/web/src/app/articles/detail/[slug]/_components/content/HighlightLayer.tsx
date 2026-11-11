'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import { LuHighlighter, LuMessageSquarePlus, LuTrash2 } from 'react-icons/lu';
import { useAuth } from '@/hooks/useAuth';
import { useOpenLogin } from '@/hooks/useOpenLogin';
import { Highlight as Scrap, useHighlightMutations, useHighlights } from '@/hooks/useHighlights';
import { findTextRange } from '@/utils/textRange';
import { useConfirmRemoveHighlights } from '@/hooks/useConfirmRemoveHighlights';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useFloatStore } from '@/stores/useFloatStore';
import { cx } from '@/styles/tw';

interface Props {
	newsletterId: number;
	/** 뉴스레터 본문 (저장된 HTML이 들어 있는 곳) */
	rootRef: React.RefObject<HTMLElement | null>;
}

/** 고른 글의 자리: 문서 기준 좌표 (화면이 아니라). 팝오버가 글에 붙어 함께 스크롤된다 */
type Box = { left: number; top: number; bottom: number; width: number };
type Picked = { text: string; section?: string; rect: Box };
type Popover =
	| { kind: 'toolbar'; picked: Picked }
	| { kind: 'memo'; picked: Picked }
	| { kind: 'saved'; highlight: Scrap; rect: Box };

/** 화면 좌표 → 문서 좌표 (연 순간의 스크롤 위치를 더해 둔다) */
const onPage = (rect: DOMRect): Box => ({
	left: rect.left + window.scrollX,
	top: rect.top + window.scrollY,
	bottom: rect.bottom + window.scrollY,
	width: rect.width,
});

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
	const { create, update } = useHighlightMutations();
	const confirmRemove = useConfirmRemoveHighlights();
	const [popover, setPopover] = useState<Popover | null>(null);
	const [memo, setMemo] = useState('');
	const ranges = useRef(new Map<number, Range>());
	const scrolledTo = useRef<number | null>(null);
	const bandsRef = useRef<HTMLDivElement>(null);
	const [bands, setBands] = useState<Band[]>([]);
	const [focusId, setFocusId] = useState<number | null>(null);
	// 휴대폰: 글 옆 팝오버 대신 아래 시트 (손가락이 닿기 쉽고, 메모를 쓸 때 키보드에 가리지 않는다)
	const { isMobile } = useMediaQuery();
	// 시트가 떠 있는 동안 떠 있는 단추(스크롤 · 북마크 · 링크)를 잠깐 숨긴다
	const setSheetOpen = useFloatStore((s) => s.setSheetOpen);
	const sheetOpen = isMobile && !!popover;
	useEffect(() => {
		setSheetOpen(sheetOpen);
		return () => setSheetOpen(false);
	}, [sheetOpen, setSheetOpen]);

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
			rect: onPage(range.getBoundingClientRect()),
		};
	}, [rootRef]);

	useEffect(() => {
		const onPointerUp = (event: Event) => {
			// 도구 막대 · 메모 칸 안을 누른 것은 무시
			if ((event.target as Element | null)?.closest?.('[data-highlight-popover]')) return;
			window.setTimeout(() => {
				const picked = readSelection();
				if (picked) {
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
							setPopover({ kind: 'saved', highlight, rect: onPage(range.getBoundingClientRect()) });
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
					setPopover({ kind: 'toolbar', picked });
				}
			}
		};
		document.addEventListener('mouseup', onPointerUp);
		document.addEventListener('touchend', onPointerUp);
		document.addEventListener('keyup', onKey);
		return () => {
			document.removeEventListener('mouseup', onPointerUp);
			document.removeEventListener('touchend', onPointerUp);
			document.removeEventListener('keyup', onKey);
		};
	}, [highlights, readSelection, rootRef]);

	const needLogin = () => {
		openLogin('스크랩 · 메모는 로그인하면 쓸 수 있습니다');
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
		<div className="np-articles-highlight-layer-bands" ref={bandsRef} aria-hidden>
			{bands.map((band, i) => (
				<span
					key={`${band.id}-${i}`}
					className={`${band.note ? 'note' : ''} ${band.id === focusId ? 'focus' : ''}`}
					style={{ left: band.left, top: band.top, width: band.width, height: band.height }}
				/>
			))}
		</div>
	);

	if (!popover) return bandLayer;

	const rect = popover.kind === 'saved' ? popover.rect : popover.picked.rect;
	// 데스크톱: 글에 붙인다 (문서 좌표, 스크롤하면 글과 함께 움직인다). 도구 막대는 글 위, 메모 · 내 스크랩은 글 아래.
	// 터치 화면은 도구 막대도 글 아래에 (기기의 기본 복사 메뉴가 위에 뜨므로)
	const below =
		popover.kind !== 'toolbar' || (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches);
	const style: React.CSSProperties | undefined = isMobile
		? undefined
		: {
				left: Math.min(
					Math.max(rect.left + rect.width / 2, window.scrollX + 120),
					window.scrollX + window.innerWidth - 120,
				),
				top: below ? rect.bottom + 10 : rect.top - 10,
				transform: below ? 'translateX(-50%)' : 'translate(-50%, -100%)',
			};
	// 휴대폰에서 메모 · 내 스크랩은 뒤를 어둡게 깔고 그곳을 누르면 닫는다 (도구 막대는 고른 글이 보이게 깔지 않는다)
	const dim = isMobile && popover.kind !== 'toolbar';

	return (
		<>
			{bandLayer}
			{/* 본문 스타일(문단 · 블록 여백)이 붙지 않게 body에 띄운다 */}
			{createPortal(
				<>
					{dim && (
						<div
							className="np-articles-highlight-layer-dim"
							data-highlight-popover
							aria-hidden
							onClick={() => setPopover(null)}
						/>
					)}
					<div
						style={style}
						className={cx('np-articles-highlight-layer-popover', isMobile ? `sheet ${popover.kind}` : undefined)}
						data-highlight-popover
						role="dialog"
						aria-label="스크랩 · 메모"
					>
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
								<div className="saved-head">
									<p className="label">내 스크랩</p>
									{/* 중요 표시 켜고 끄기 */}
									<button
										type="button"
										className={`star-toggle ${popover.highlight.starred ? 'on' : ''}`}
										aria-pressed={popover.highlight.starred}
										onClick={() => {
											update.mutate({ id: popover.highlight.id, starred: !popover.highlight.starred });
											setPopover(null);
										}}
									>
										{popover.highlight.starred ? '★ 중요 해제' : '☆ 중요 표시'}
									</button>
								</div>
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
										// 여기서는 바로 지우되, 중요 표시한 문장이면 한 번 더 묻는다
										onClick={() => {
											confirmRemove([popover.highlight], { askFirst: false });
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
					</div>
				</>,
				document.body,
			)}
		</>
	);
}

/**
 * 형광펜 띠: 본문 글자 뒤(z-index -1, 본문 틀이 isolation으로 따로 쌓임)에 깐다. 누르기는 본문이 받는다.
 * 스크랩은 옅은 주 색, 메모가 있으면 아래에 주 색 줄, 마이페이지에서 온 문장은 잠깐 진하게
 */
