/** 관리자 화면 공통 표시 (#21) */

/** 달러: 1센트 미만은 소수 넷째 자리까지, 모르면 - */
export const usd = (value: number | null) =>
	value === null ? '-' : `$${value < 0.01 && value > 0 ? value.toFixed(4) : value.toFixed(2)}`;

export const PROCESS_LABEL: Record<string, string> = { summarization: '요약', category: '분류', edition: '편집' };

/** 오늘(KST)이면 시각만, 아니면 'MM-DD 시각' */
export function when(iso: string | null, today: string) {
	if (!iso) return '-';
	const date = new Date(iso);
	const day = date.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
	const time = date.toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit' });
	return day === today ? time : `${day.slice(5)} ${time}`;
}
