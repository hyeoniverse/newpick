'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * 달력은 body 바로 아래 맨 위층에 띄운다. 필터 줄 · 카드 · 붙는 머리 같은 부모의 쌓임 순서에 가려지지 않게
 * (예전에는 입력칸 옆에 z-index 30으로 떠서 아래 내용 · 헤더 뒤로 숨었다)
 */
export default function CalendarLayer({ children }: { children?: React.ReactNode }) {
	// 서버 화면과 맞추려고 브라우저에 붙은 뒤에만 띄운다 (달력은 누른 뒤에야 열리므로 늦어도 괜찮다)
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	if (!mounted || !children) return null;
	return createPortal(<div className="np-calendar-layer">{children}</div>, document.body);
}
