'use client';

import { useEffect, useState } from 'react';

/**
 * 막대의 달이 바뀔 때 (#198): 연도 · 월 글자가 넘어가는 방향과, 날짜 줄이 잠깐(0.16초) 흐려졌다 새 달로 바뀌는 것.
 * 목록에서 뒤에 있는 달로 가면 아래에서 올라오고(from-below), 앞 달로 가면 위에서 내려온다(from-above). 처음엔 움직이지 않음
 * order: 달 → 목록에서의 순서
 */
export function useMonthTransition(month: string, order: (month: string) => number) {
	const [shown, setShown] = useState(month);
	const [enter, setEnter] = useState('');
	if (shown !== month) {
		setShown(month);
		setEnter(order(month) > order(shown) ? 'from-below' : 'from-above');
	}
	// 날짜 줄의 달은 month를 조금 늦게 따라간다
	const [daysMonth, setDaysMonth] = useState(month);
	const leaving = daysMonth !== month;
	useEffect(() => {
		if (!leaving) return;
		const timer = window.setTimeout(() => setDaysMonth(month), 160);
		return () => window.clearTimeout(timer);
	}, [leaving, month]);
	return { enter, daysMonth, leaving };
}
