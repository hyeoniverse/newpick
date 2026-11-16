'use client';

import { HIGHLIGHTS } from '@/copy';
import { useState } from 'react';
import type { Highlight } from '@newpick/shared';
import { useHighlightMutations } from '@/hooks/useHighlights';
import { useConfirmRemoveHighlights } from '@/hooks/useConfirmRemoveHighlights';
import { useToast } from '@/hooks/useToast';
import { useToggleSet } from '@/hooks/useToggleSet';
import { setFolderDragGhost } from '../../_lib/dragGhost';
import { asText } from '../../_lib/highlightGroups';

/**
 * 스크랩 고르기 · 한꺼번에 하기 · 끌어서 폴더에 넣기 (#198).
 * '선택'으로 고른 것을 폴더로 옮기기 · 중요 표시/해제 · 복사 · 지우기. 고르는 중에 고른 것 하나를 끌면 고른 것 전부를 끈다
 * shown: 지금 화면에 보이는 스크랩 (전체 선택 · 고른 것 찾기의 기준)
 */
export function useHighlightSelection(shown: Highlight[]) {
	const [selecting, setSelecting] = useState(false);
	const { set: selected, toggle, setMany, clear } = useToggleSet<number>();
	// 끌어서 폴더에 넣기 (데스크톱): 끄는 중인 스크랩 번호들
	const [dragging, setDragging] = useState<number[] | null>(null);
	const { bulk } = useHighlightMutations();
	const { showToast } = useToast();
	const confirmRemove = useConfirmRemoveHighlights();

	const stop = () => {
		setSelecting(false);
		clear();
	};
	const picked = shown.filter((h) => selected.has(h.id));
	const allShownSelected = shown.length > 0 && shown.every((h) => selected.has(h.id));
	const bulkThenStop = (action: 'star' | 'unstar') => bulk.mutate({ ids: [...selected], action }, { onSuccess: stop });

	return {
		selecting,
		start: () => setSelecting(true),
		stop,
		selected,
		toggle,
		/** 고른 폴더가 바뀌면 고른 것을 비운다 */
		clear,
		picked,
		allShownSelected,
		toggleAll: () =>
			setMany(
				shown.map((h) => h.id),
				!allShownSelected,
			),
		move: (folderId: number | null) =>
			bulk.mutate({ ids: [...selected], action: 'move', folderId }, { onSuccess: stop }),
		star: () => bulkThenStop('star'),
		unstar: () => bulkThenStop('unstar'),
		copy: async () => {
			try {
				await navigator.clipboard.writeText(asText(picked));
				showToast(HIGHLIGHTS.copied(picked.length), 'success');
			} catch {
				showToast(HIGHLIGHTS.copyFailed, 'error');
			}
		},
		removePicked: () => confirmRemove(picked, { onDone: stop }),
		/** 문장 하나 지우기 (중요 표시면 한 번 더 묻는다) */
		remove: (highlight: Highlight) => confirmRemove([highlight]),

		dragging,
		startDrag: (event: React.DragEvent, highlight: Highlight) => {
			const ids = selecting && selected.has(highlight.id) ? [...selected] : [highlight.id];
			setFolderDragGhost(event, highlight.text, ids.length);
			setDragging(ids);
		},
		endDrag: () => setDragging(null),
		/** 폴더 줄에 놓으면 옮긴다 (고르는 중이었으면 고르기도 끝) */
		dropTo: (folderId: number | null) => {
			if (!dragging) return;
			bulk.mutate({ ids: dragging, action: 'move', folderId }, { onSuccess: () => selecting && stop() });
			setDragging(null);
		},
	};
}

export type HighlightSelection = ReturnType<typeof useHighlightSelection>;
