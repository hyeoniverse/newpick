import dayjs from 'dayjs';

const KST_DATE = new Intl.DateTimeFormat('en-CA', {
	timeZone: 'Asia/Seoul',
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
});

/**
 * 서비스 기준 시간대(KST)의 날짜 'YYYY-MM-DD'. 브라우저의 시간대·로캘과 관계없이 같은 값입니다.
 * 로캘 문자열(예: '2026. 10. 20.')을 다시 파싱하면 Safari에서 Invalid Date가 되므로 문자열을 거치지 않습니다.
 */
export function kstDate(daysAgo = 0, now: Date = new Date()): string {
	const parts = KST_DATE.formatToParts(new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000));
	const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value;
	return `${part('year')}-${part('month')}-${part('day')}`;
}

/** 그 순간의 한국 날짜 'YYYY-MM-DD' (ISO 문자열 · Date) */
export const kstDateOf = (moment: string | Date): string => kstDate(0, new Date(moment));

const MONTH_DAY = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', timeZone: 'Asia/Seoul' });
/** '10월 31일' (한국 시각) */
export const monthDay = (moment: string | Date): string => MONTH_DAY.format(new Date(moment));

/** 두 자리로: 7 → '07' (시각 · 순번) */
export const pad2 = (n: number): string => String(n).padStart(2, '0');

export function dateFormatter(date: string | undefined) {
	const dateFormat = dayjs(date).format('YYYY-MM-DD');
	return dateFormat;
}
