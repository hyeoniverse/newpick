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

/**
 * 화면에 쓰는 날짜 'YYYY-MM-DD' (한국 날짜). 값이 없으면 오늘.
 * 예전에는 실행하는 곳의 시간대로 써서, Vercel 서버(UTC)와 한국 브라우저가 한국 0~9시에 만든 글의 날짜를 다르게 그렸다.
 * 그러면 하이드레이션이 어긋나(React #418) 상세 화면 전체를 브라우저에서 다시 그렸고, 제목이 다시 그려져 LCP가 늦었다 (#292)
 */
export function dateFormatter(date: string | undefined) {
	const moment = date === undefined ? new Date() : new Date(date);
	return Number.isNaN(moment.getTime()) ? 'Invalid Date' : kstDateOf(moment);
}
