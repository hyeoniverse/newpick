'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Highlight } from '@newpick/shared';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useFloatStore } from '@/stores/useFloatStore';
import { caretAt, onPage, sectionOf, type Box } from '../../../_lib/highlightDom';

const MAX_TEXT = 500;

export type Picked = { text: string; section?: string; rect: Box };
/** 지금 떠 있는 창: 고른 글의 도구 막대 · 새 메모 · 저장한 스크랩 */
export type Popover =
	| { kind: 'toolbar'; picked: Picked }
	| { kind: 'memo'; picked: Picked }
	| { kind: 'saved'; highlight: Highlight; rect: Box };

/**
 * 본문 고르기 · 누르기 → 창 (#123, #198): 글을 고르면 도구 막대, 고른 글 없이 형광펜을 누르면 그 스크랩 창,
 * Esc로 닫고 Shift로 키보드로 고른 글도 잡는다. 도구 막대 · 메모 칸 안([data-highlight-popover])을 누른 것은 무시.
 * 휴대폰에서 창이 떠 있는 동안은 떠 있는 단추(스크롤 · 북마크 · 링크)를 숨긴다
 * ranges: 스크랩 번호 → 지금 본문의 범위 (useHighlightBands)
 */
export function useHighlightPopover(
	rootRef: React.RefObject<HTMLElement | null>,
	highlights: Highlight[],
	ranges: React.RefObject<Map<number, Range>>,
) {
	const [popover, setPopover] = useState<Popover | null>(null);
	const [memo, setMemo] = useState('');
	// 휴대폰: 글 옆 팝오버 대신 아래 시트. 시트가 떠 있는 동안 떠 있는 단추를 잠깐 숨긴다
	const { isMobile } = useMediaQuery();
	const setSheetOpen = useFloatStore((s) => s.setSheetOpen);
	const sheetOpen = isMobile && !!popover;
	useEffect(() => {
		setSheetOpen(sheetOpen);
		return () => setSheetOpen(false);
	}, [sheetOpen, setSheetOpen]);

	const readSelection = useCallback((): Picked | null => {
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
			if ((event.target as Element | null)?.closest?.('[data-highlight-popover]')) return;
			window.setTimeout(() => {
				const picked = readSelection();
				if (picked) {
					setPopover({ kind: 'toolbar', picked });
					return;
				}
				// 고른 글 없이 형광펜을 누르면 그 스크랩 (메모를 쓰는 중이면 그대로)
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
				if (picked) setPopover({ kind: 'toolbar', picked });
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
	}, [highlights, readSelection, rootRef, ranges]);

	return { popover, setPopover, memo, setMemo, isMobile };
}
