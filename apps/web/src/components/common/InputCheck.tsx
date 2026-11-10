'use client';

import React from 'react';
import { useInputCheck } from '@/hooks/useInputCheck';

import { cssVarTheme, type FontSize } from '@/styles/tokens/theme';
import { cx } from '@/styles/tw';
import { BiCheck } from 'react-icons/bi';

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onBlur' | 'onChange' | 'size'> {
	name: string;
	label?: string;
	size?: FontSize;
	/** 바깥에서 상태를 쥘 때 (checked와 함께). 없으면 이름(name)별 저장소로 스스로 켜고 끈다 */
	onCheckedChange?: (checked: boolean) => void;
}
/* 기본 24px: 손가락으로 누르기 충분한 크기 (#16). size를 주면 그 글자 크기 */
const BOX =
	'peer m-0 block size-[var(--check-size,1.5rem)] cursor-pointer appearance-none rounded-none border-[1.5px] border-solid border-light-grey bg-background [transition:background_0.15s_ease,border-color_0.15s_ease,box-shadow_0.15s_ease] hover:border-primary checked:border-primary checked:bg-primary focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_25%,transparent)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50';

/* 체크 표시: 체크된 상자(강조색) 위라 배경색으로 (다크 모드에서도 대비가 맞다) */
const ICON =
	'icon pointer-events-none absolute inset-0 flex items-center justify-center [&_svg]:text-medium [&_svg]:text-background [&_svg]:opacity-0 [&_svg]:[transform:scale(0.6)] [&_svg]:[transition:opacity_0.15s_ease,transform_0.15s_ease] peer-checked:[&_svg]:opacity-100 peer-checked:[&_svg]:[transform:scale(1)]';

/**
 * 체크 상자. 이름표는 상자 오른쪽에 항상 보이고, 이름표를 눌러도 체크된다.
 * 예전에는 이름표가 마우스를 올려야 위에 나타나 무엇을 체크하는지 알 수 없었다
 */
const InputCheck = React.forwardRef<HTMLInputElement, Props>(
	({ size, label, name, className, checked, onCheckedChange, ...props }, ref) => {
		const { isChecked, toggleChecked } = useInputCheck(name);
		// checked를 주면 바깥 상태로 (목록에서 여러 개 고르기 등)
		const controlled = checked !== undefined;

		return (
			<label
				className={cx('inline-flex cursor-pointer items-center gap-2 select-none', className)}
				style={size ? ({ '--check-size': cssVarTheme.fontSize[size] } as React.CSSProperties) : undefined}
			>
				<span className="input-check relative inline-flex shrink-0">
					<input
						type="checkbox"
						ref={ref}
						name={name}
						checked={controlled ? checked : isChecked}
						onChange={controlled ? (event) => onCheckedChange?.(event.target.checked) : toggleChecked}
						className={BOX}
						{...props}
					/>
					<span className={ICON} aria-hidden>
						<BiCheck />
					</span>
				</span>
				{label && <span className="text text-small text-text">{label}</span>}
			</label>
		);
	},
);

InputCheck.displayName = 'InputCheck';
export default InputCheck;
