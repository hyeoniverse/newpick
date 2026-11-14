import { kstDate } from '@/utils/formatter';

/**
 * 미리 정한 기간 (#230): 관리자 기간 고르기 · 달력 아래 빠른 선택이 같이 쓴다.
 * daysAgo: [시작, 끝]이 오늘로부터 며칠 전인지 (한국 날짜). 끝은 늘 오늘이고 어제만 하루
 */
export const DATE_PRESETS = [
	{ key: 'today', label: '오늘', daysAgo: [0, 0] },
	{ key: 'yesterday', label: '어제', daysAgo: [1, 1] },
	{ key: '7d', label: '최근 7일', daysAgo: [6, 0] },
	{ key: '30d', label: '최근 30일', daysAgo: [29, 0] },
] as const;

export type DatePreset = (typeof DATE_PRESETS)[number];

/** 미리 정한 기간의 실제 날짜 (YYYY-MM-DD, 부를 때마다 오늘 기준) */
export const presetRange = (preset: DatePreset) => ({
	from: kstDate(preset.daysAgo[0]),
	to: kstDate(preset.daysAgo[1]),
});

/** 하루짜리(오늘 · 어제)만: 날짜 하나 고르기의 빠른 선택 */
export const DAY_PRESETS = DATE_PRESETS.filter((p) => p.daysAgo[0] === p.daysAgo[1]);
