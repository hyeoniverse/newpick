'use client';

import { cx } from '@/styles/tw';

export interface ChipOption {
	label: string;
	value: string;
}

interface Props {
	/** 줄 앞 이름표 (예: '관심사'). 화면 읽기 프로그램의 묶음 이름으로도 쓴다 */
	label: string;
	/** 묶음 이름을 이름표와 다르게 읽히고 싶을 때 (예: '받은 관심사') */
	ariaLabel?: string;
	options: ChipOption[];
	/** 지금 고른 값. 보통 ''가 '전체' */
	value: string;
	onChange: (value: string) => void;
	className?: string;
}

/**
 * 거르기 칩 한 줄 (공통, 관리자 목록에서 시작): '관심사 [전체] [IT] [정치] …'. 하나만 고르고, 고른 칩을 다시 누르면 '전체'로.
 * 이름표 폭을 맞춰 여러 줄을 쌓아도 칩이 같은 자리에서 시작하고, 좁은 화면에서는 이름표가 위 한 줄로 간다
 */
export default function FilterChips({ label, ariaLabel, options, value, onChange, className }: Props) {
	const hasAll = options.some((option) => option.value === '');
	return (
		<div role="group" aria-label={ariaLabel ?? label} className={cx('flex flex-wrap items-center gap-1.5', className)}>
			<span className="chips-label w-14 shrink-0 text-extra-small font-semi-bold text-sub-text mobile:basis-full">
				{label}
			</span>
			{options.map((option) => (
				<button
					key={option.value}
					type="button"
					aria-pressed={value === option.value}
					className="inline-flex h-8 cursor-pointer items-center rounded-chip border border-solid border-border px-3 text-extra-small text-medium-grey aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-[#ffffff]"
					// 고른 칩을 다시 누르면 해제하고 '전체'('')로
					onClick={() => onChange(value === option.value && hasAll ? '' : option.value)}
				>
					{option.label}
				</button>
			))}
		</div>
	);
}
