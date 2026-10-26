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

export function dateFormatter(date: string | undefined) {
	const dateFormat = dayjs(date).format('YYYY-MM-DD');
	return dateFormat;
}

import { STYLE } from '@/constants/numbers';
export const remToPx = (remValue: number | string, rootFontSize: number | string = STYLE.ROOT_FONT_SIZE): number => {
	// 문자열이면 단위를 제거하고 숫자로 변환
	const numericRem = typeof remValue === 'string' ? parseFloat(remValue) : remValue;
	const numericRootFontSize = typeof rootFontSize === 'string' ? parseFloat(rootFontSize) : rootFontSize;
	return numericRem * numericRootFontSize;
};
