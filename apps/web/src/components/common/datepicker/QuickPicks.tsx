'use client';

import { DATE_PRESETS, DAY_PRESETS, presetRange } from '@/constants/periods';
import type { DateString } from './shared';

/** 빠른 선택 버튼 하나: 누르면 그 날(또는 기간)로 */
export interface QuickPick<T> {
	label: string;
	value: () => T;
}

/** 날짜 하나 빠른 선택 (오늘 · 어제) */
export const DAY_PICKS: QuickPick<DateString>[] = DAY_PRESETS.map((preset) => ({
	label: preset.label,
	value: () => presetRange(preset).from,
}));

/** 기간 빠른 선택 (constants/periods의 미리 정한 기간) */
export const RANGE_PICKS: QuickPick<{ start: DateString; end: DateString }>[] = DATE_PRESETS.map((preset) => ({
	label: preset.label,
	value: () => {
		const { from, to } = presetRange(preset);
		return { start: from, end: to };
	},
}));

/** 달력 아래 빠른 선택 줄. 고를 수 없는 범위(min · max 밖)는 흐리게 */
export default function QuickPicks({
	picks,
	onPick,
}: {
	picks: { label: string; disabled: boolean; pick: () => void }[];
	onPick?: () => void;
}) {
	if (!picks.length) return null;
	return (
		<div className="np-quick" role="group" aria-label="빠른 선택">
			{picks.map((p) => (
				<button
					key={p.label}
					type="button"
					disabled={p.disabled}
					onClick={() => {
						p.pick();
						onPick?.();
					}}
				>
					{p.label}
				</button>
			))}
		</div>
	);
}
