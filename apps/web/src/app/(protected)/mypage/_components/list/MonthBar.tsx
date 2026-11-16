'use client';

import type { MonthIndex } from '@newpick/shared';
import { useRef } from 'react';
import { cx } from '@/styles/tw';
import type { BarItem } from '../../_lib/months';
import DayStrip from './DayStrip';
import MonthPicker from './MonthPicker';
import { useMonthTransition } from './useMonthTransition';
import { useStickyActive } from './useStickyActive';

/**
 * 달 막대 (원래 마이페이지의 날짜 막대처럼): 큰 '2026년 10월 ▾' + 그 달의 날짜 바로가기('27일 · 24일 …').
 * 내 뉴스레터 · 스크랩이 같이 쓴다. 목록 위에 하나만 두고 위에 붙어 따라오며, 지금 보는 항목의 달로 내용만 바뀐다.
 * 붙는 순간 바탕 · 위아래 줄이 화면 양끝까지 천천히 펼쳐진다 (원래 디자인의 full-width).
 * 연도 · 월을 누르면 받은 해 · 달 목록이 펼쳐져 바로 간다
 *
 * 이 파일은 조립만 (#198): 붙음 · 지금 보는 항목 useStickyActive · 달 바뀜 전환 useMonthTransition,
 * 연도 · 월 고르기 MonthPicker · 날짜 줄 DayStrip. 달 계산은 _lib/months, 달로 건너뛰기는 useMonthJump
 */
export default function MonthBar({
	groups,
	top,
	months,
	onJump,
	noun,
}: {
	/** 달마다 날짜 바로가기 (목록 순서대로). 막대 밑에 온 항목으로 지금 달 · 날짜를 정한다 */
	groups: { month: string; items: BarItem[] }[];
	/** 붙는 높이 (헤더가 보이면 그 아래) */
	top: string;
	/** 바로 가기용 달 목록 (서버가 준 것: 달마다 개수 · 첫 순번) */
	months: MonthIndex[];
	onJump: (month: MonthIndex) => void;
	/** 날짜 줄 이름에 쓰는 말: '받은 메일' · '스크랩' */
	noun: string;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const { stuck, active, pageWidth } = useStickyActive(ref, groups, top);
	// 막대에 보이는 달: 지금 보는 항목의 달 (붙기 전에는 목록 첫 달)
	const month = groups.find((g) => g.items.some((item) => item.id === active))?.month ?? groups[0].month;
	const { enter, daysMonth, leaving } = useMonthTransition(month, (m) => groups.findIndex((g) => g.month === m));
	const days = groups.find((g) => g.month === daysMonth)?.items ?? [];

	return (
		<div
			ref={ref}
			className={cx('np-mypage-month-bar-month-bar', 'month-bar', stuck && 'stuck')}
			style={{ top, ['--page-w' as string]: `${pageWidth}px` }}
		>
			{/* 달이 바뀌면 연도 · 월 글자는 숫자판처럼 넘어가고(아래로 보면 위로, 위로 보면 아래로), 날짜 줄은 흐려졌다 바뀐다 */}
			<MonthPicker month={month} months={months} enter={enter} onJump={onJump} barRef={ref} />
			<DayStrip days={days} daysMonth={daysMonth} leaving={leaving} active={active} noun={noun} />
		</div>
	);
}
