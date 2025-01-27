import dayjs from 'dayjs';
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
