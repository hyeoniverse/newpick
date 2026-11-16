'use client';

import type { MonthIndex } from '@newpick/shared';
import { useEffect, useState } from 'react';

/**
 * 달 · 연도로 건너뛰기: 이미 받아 온 달이면 그 자리로, 아니면 그 달 첫 항목 순번부터 새로 받아 와서 스크롤.
 * 목록은 달마다 id="month-YYYY-MM" 묶음을 둔다
 */
export function useMonthJump() {
	// 목록이 시작하는 순번: 보통 0(맨 위), 건너뛰면 그 달 첫 항목 순번부터 (위로는 '더 최근 … 보기')
	const [startOffset, setStartOffset] = useState(0);
	const [pendingMonth, setPendingMonth] = useState<string | null>(null);
	const jumpToMonth = (target: MonthIndex) => {
		setPendingMonth(target.month);
		if (!document.getElementById(`month-${target.month}`)) setStartOffset(target.firstIndex);
	};
	// 그 달 묶음이 그려지면 (새로 받아 온 뒤 다시 그릴 때마다 찾아본다. 찾으면 pendingMonth를 비워 멈춘다)
	// eslint-disable-next-line react-hooks/exhaustive-deps -- 받아 온 목록은 이 훅 밖(쿼리)에 있어 매번 본다
	useEffect(() => {
		if (!pendingMonth) return;
		const section = document.getElementById(`month-${pendingMonth}`);
		if (!section) return;
		section.scrollIntoView({ behavior: 'smooth', block: 'start' });
		setPendingMonth(null);
	});
	return { startOffset, setStartOffset, jumpToMonth };
}
