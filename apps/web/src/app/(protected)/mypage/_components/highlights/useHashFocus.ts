'use client';

import { useEffect, useState } from 'react';

/**
 * 스크랩 알림의 '모아 보기'로 오면(주소 #hl-번호) 그 문장으로 스크롤하고 잠깐(2.4초) 강조한다 (#198).
 * ids: 지금 받은 스크랩 번호들. loadedKey가 바뀔 때(새로 받았을 때)만 다시 살핀다
 */
export function useHashFocus(ids: number[] | undefined, loadedKey: unknown) {
	const [focused, setFocused] = useState<number | null>(null);
	useEffect(() => {
		const target = Number(window.location.hash.match(/^#hl-(\d+)$/)?.[1]);
		if (!target || !ids?.includes(target)) return;
		document.getElementById(`hl-${target}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
		setFocused(target);
		const timer = window.setTimeout(() => setFocused(null), 2400);
		return () => window.clearTimeout(timer);
		// eslint-disable-next-line react-hooks/exhaustive-deps -- 받은 목록이 바뀔 때만 (ids는 매번 새 배열)
	}, [loadedKey]);
	return focused;
}
