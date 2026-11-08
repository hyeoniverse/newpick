'use client';

interface Row {
	key: string;
	label: string;
	value: number;
	/** 값 옆 작은 글 (예: '3편') */
	note?: string;
}

interface Props {
	rows: Row[];
	format?: (value: number) => string;
	/** 목록 이름 (화면 읽기 프로그램용) */
	label: string;
}

/**
 * 나눔을 가로 막대로 (관리자 통계 #122): 이름 · 막대 · 값. 큰 값이 가장 긴 막대.
 * 한 계열이라 범례 없이, 값은 막대 끝에 글로 (색은 막대에만)
 */
export default function BarList({ rows, format = (v) => v.toLocaleString(), label }: Props) {
	const max = Math.max(0, ...rows.map((r) => r.value));
	return (
		<ul aria-label={label} className="flex flex-col gap-2.5">
			{rows.map((row) => (
				<li
					key={row.key}
					className="grid grid-cols-[minmax(5rem,8rem)_1fr_minmax(4.5rem,auto)] items-center gap-3 text-extra-small"
				>
					<span className="name truncate text-text">{row.label}</span>
					<span className="track h-3" aria-hidden>
						{row.value > 0 && (
							<span
								className="bar block h-full min-w-[2px] rounded-[0_4px_4px_0] bg-[var(--tone-a)]"
								style={{ width: `${(row.value / max) * 100}%` }}
							/>
						)}
					</span>
					<span className="value text-right text-text tabular-nums">
						{format(row.value)}
						{row.note && <small className="ml-1.5 text-sub-text">{row.note}</small>}
					</span>
				</li>
			))}
		</ul>
	);
}
