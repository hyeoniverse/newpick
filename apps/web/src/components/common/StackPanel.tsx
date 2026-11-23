'use client';

import { useRef } from 'react';
import { cx } from '@/styles/tw';
import { useStackPanel } from '@/hooks/useStackPanel';

/**
 * 멈춰 있다가 바로 다음 판에 덮이는 패널 (useStackPanel 'bottom'): 아래 끝까지 본 뒤 제자리에 멈추고,
 * 다음 판이 아래에서 올라와 덮는 동안 작아지고 흐려진다. 다음 판은 바탕을 깔고 위에 놓여야 한다 (relative · z-1)
 */
export default function StackPanel({ className, children }: { className?: string; children: React.ReactNode }) {
	const ref = useRef<HTMLDivElement>(null);
	useStackPanel(ref, 'bottom');
	return (
		<div ref={ref} className={cx('sticky z-0', className)}>
			{children}
		</div>
	);
}
