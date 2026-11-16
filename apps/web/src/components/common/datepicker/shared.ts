import type { FieldSize } from '@/types/ui';
import { registerLocale } from 'react-datepicker';
import { ko } from 'date-fns/locale';
import { format } from 'date-fns';

/* 날짜 고르기 공용 (#198): 값 변환 · 범위 · 공용 타입. 한국어 달력은 여기서 한 번 등록한다 (달력을 쓰는 파일이 모두 이 파일을 거친다) */
registerLocale('ko', ko);

/** 날짜 값은 주소 · API와 같은 'YYYY-MM-DD' 문자열로 주고받는다 */
export type DateString = string;

/** 'YYYY-MM-DD' → 그날 0시 (로컬). 모양이 아니면 null */
export const toDate = (value?: DateString | null) => {
	if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
	const [y, m, d] = value.split('-').map(Number);
	return new Date(y, m - 1, d);
};
/** Date → 'YYYY-MM-DD' (없으면 '') */
export const toValue = (date: Date | null) => (date ? format(date, 'yyyy-MM-dd') : '');

/** min · max 안인지 (없는 쪽은 열려 있음) */
export const inRange = (value: DateString, min?: DateString, max?: DateString) =>
	(!min || value >= min) && (!max || value <= max);

export interface CommonProps {
	label?: string;
	/** 고를 수 있는 가장 이른 · 늦은 날 */
	min?: DateString;
	max?: DateString;
	/** medium: 다른 입력칸과 같은 높이(3rem), small: 필터 줄 같은 좁은 곳(2.25rem) */
	size?: FieldSize;
	className?: string;
}
