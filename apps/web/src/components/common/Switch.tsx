'use client';

import { cx } from '@/styles/tw';

interface Props {
	checked: boolean;
	onChange: (checked: boolean) => void;
	/** 화면 읽기 프로그램이 읽는 이름 (보이는 제목이 따로 있으면 aria-labelledby로) */
	label?: string;
	labelledBy?: string;
	disabled?: boolean;
}

/** 켜고 끄는 스위치: 누르면 바로 바뀐다 (저장 단추 없이). 키보드는 Space · Enter */
export default function Switch({ checked, onChange, label, labelledBy, disabled }: Props) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			aria-label={label}
			aria-labelledby={labelledBy}
			disabled={disabled}
			onClick={() => onChange(!checked)}
			className={cx(
				'relative m-0 h-6 w-11 shrink-0 cursor-pointer rounded-[999px] border-none p-0 [transition:background_0.2s_ease] motion-reduce:transition-none',
				'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-default disabled:opacity-50',
				checked ? 'bg-primary' : 'bg-border',
			)}
		>
			<span
				className={cx(
					'knob absolute top-[0.1875rem] left-[0.1875rem] m-0 size-[1.125rem] rounded-full bg-[#ffffff] shadow-[0_1px_2px_rgba(0,0,0,0.2)] [transition:transform_0.2s_ease] motion-reduce:transition-none',
					checked ? '[transform:translateX(1.25rem)]' : '[transform:translateX(0)]',
				)}
				aria-hidden
			/>
		</button>
	);
}
