'use client';

import React from 'react';
import { cx } from '@/styles/tw';

interface Props<T extends string> {
	name: string;
	/** 묶음 이름 (fieldset legend) */
	label?: string;
	value: T;
	options: { label: string; value: T }[];
	onChange: (value: T) => void;
	className?: string;
}

/* 고른 표시는 가운데 점(::before). 초점은 옅은 강조색 띠 */
const RADIO =
	"m-0 grid size-5 shrink-0 cursor-pointer appearance-none place-content-center rounded-full border-[1.5px] border-solid border-light-grey bg-background [transition:border-color_0.15s_ease,box-shadow_0.15s_ease] before:size-2.5 before:[transform:scale(0)] before:rounded-full before:bg-primary before:[transition:transform_0.15s_ease] before:content-[''] hover:border-primary checked:border-primary checked:before:[transform:scale(1)] focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_25%,transparent)] focus-visible:outline-none";

/**
 * 라디오 버튼 묶음: 여러 개 중 하나만 고른다. 체크 상자(InputCheck)와 같은 모양·크기.
 * 진짜 <input type="radio">라 ←→↑↓로 옮겨 고를 수 있다
 */
export default function InputRadio<T extends string>({ name, label, value, options, onChange, className }: Props<T>) {
	return (
		<fieldset className={cx('m-0 min-w-0 border-none p-0', className)}>
			{label && <legend className="np-field-label p-0">{label}</legend>}
			<div className="options flex flex-wrap gap-x-5 gap-y-2">
				{options.map((option) => (
					<label key={option.value} className="option inline-flex cursor-pointer items-center gap-2 select-none">
						<input
							type="radio"
							name={name}
							value={option.value}
							checked={option.value === value}
							onChange={() => onChange(option.value)}
							className={RADIO}
						/>
						<span className="text text-small text-text">{option.label}</span>
					</label>
				))}
			</div>
		</fieldset>
	);
}
