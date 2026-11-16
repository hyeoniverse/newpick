import { kstDateOf } from '@/utils/formatter';

/* 달 계산 (#198): 받은 메일 · 스크랩의 달 막대와 달별 묶음이 같이 쓴다 */

/** 달 막대의 날짜 바로가기 하나: 누르면 갈 요소의 id와 그 날짜 */
export interface BarItem {
	id: string;
	at: string;
}

/** 달 막대 바로가기: '27일' (한국 시각) */
export const dayLabel = (iso: string) =>
	new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', day: 'numeric' }).format(new Date(iso));

/** 한국 시각 달 'YYYY-MM' */
export const monthOf = (iso: string) => kstDateOf(iso).slice(0, 7);

/** '2026년 10월' */
export const monthLabel = (month: string) => `${month.slice(0, 4)}년 ${Number(month.slice(5))}월`;

/** 목록 순서 그대로 달별로 묶는다 */
export function byMonth<T>(items: T[], at: (item: T) => string) {
	const groups: { month: string; items: T[] }[] = [];
	for (const item of items) {
		const month = monthOf(at(item));
		const last = groups[groups.length - 1];
		if (last?.month === month) last.items.push(item);
		else groups.push({ month, items: [item] });
	}
	return groups;
}
