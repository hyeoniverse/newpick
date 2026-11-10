import type { DragEvent } from 'react';

/**
 * 폴더로 끌 때 손에 붙는 모양 (#123): 내 뉴스레터 · 북마크 · 스크랩이 같은 작은 칩.
 * 브라우저 기본 모양은 끈 곳(그림 · 링크 · 큰 블록)마다 달라서 직접 만든다. 여러 개면 'N개'
 */
export function setFolderDragGhost(event: DragEvent, label: string, count = 1) {
	const ghost = document.createElement('div');
	const text = count > 1 ? `${count}개` : label.length > 28 ? `${label.slice(0, 27)}…` : label;
	ghost.textContent = `📁 ${text}`;
	Object.assign(ghost.style, {
		position: 'fixed',
		top: '-100px',
		left: '-1000px',
		maxWidth: '20rem',
		padding: '0.375rem 0.75rem',
		borderRadius: '999px',
		background: 'var(--np-color-primary)',
		color: 'var(--np-color-white, #fff)',
		font: '600 0.875rem/1.4 Pretendard, sans-serif',
		whiteSpace: 'nowrap',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
	});
	document.body.appendChild(ghost);
	event.dataTransfer.setDragImage(ghost, 16, 16);
	// 브라우저가 모양을 찍어 간 뒤 지운다
	requestAnimationFrame(() => ghost.remove());
}
