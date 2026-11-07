'use client';

import React, { JSX } from 'react';
import { LuLoaderCircle } from 'react-icons/lu';
import { ButtonScheme, ButtonSize, cssVarTheme } from '@/styles/theme';
import { cx } from '@/styles/tw';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	as?: keyof JSX.IntrinsicElements;
	ref?: React.Ref<HTMLButtonElement>;
	children?: React.ReactNode;
	size?: ButtonSize;
	scheme?: ButtonScheme;
	disabled?: boolean;
	isLoading?: boolean;
	icon?: React.ReactNode;
	iconPosition?: 'left' | 'right';
	tooltip?: string;
}

/** 크기 · 색 조합을 styles/button.css의 --btn-* 변수로. 색은 var(--np-…)라 라이트 · 다크를 따른다 */
function buttonVars(size: ButtonSize, scheme: ButtonScheme) {
	const { fontSize, padding, gap } = cssVarTheme.button[size];
	const { color, background, border, fontWeight, hover } = cssVarTheme.buttonScheme[scheme];
	return {
		'--btn-font-size': fontSize,
		'--btn-padding': padding,
		'--btn-gap': gap,
		'--btn-weight': fontWeight,
		'--btn-color': color,
		'--btn-bg': background,
		'--btn-border': border,
		'--btn-hover-color': hover.color,
		'--btn-hover-bg': hover.background,
		'--btn-hover-border': hover.border,
		'--btn-hover-weight': hover.fontWeight,
	} as React.CSSProperties;
}

/** 마우스 올림 값이 있는 속성 (styles/button.css의 [data-hover~=…]) */
function hoverKeys(scheme: ButtonScheme) {
	const { hover } = cssVarTheme.buttonScheme[scheme];
	return (
		[hover.background && 'bg', hover.border && 'border', hover.fontWeight && 'weight'].filter(Boolean).join(' ') ||
		undefined
	);
}

const Button = ({
	as = 'button',
	children,
	ref,
	size = 'small',
	scheme = 'default',
	disabled,
	isLoading,
	tooltip,
	icon,
	iconPosition = 'right',
	className,
	style,
	...props
}: Props) => {
	const Tag = as as React.ElementType;
	const childList = React.Children.toArray(children);
	const textContent = childList.filter((child) => typeof child === 'string').join(' ');
	// 글자만 있는 단추는 hover 때 굵어져도 너비가 그대로이게, 굵은 글자 폭을 미리 잡아 둔다 (.label::after)
	const label =
		textContent && childList.every((child) => typeof child === 'string') ? (
			<span className="label" data-text={textContent}>
				{children}
			</span>
		) : (
			children
		);

	return (
		<Tag
			// 글자가 없는 아이콘 버튼은 빈 title을 달지 않는다. 이름은 aria-label로 준다 (#16)
			title={textContent || undefined}
			ref={ref}
			className={cx('np-button', className)}
			style={{ ...buttonVars(size, scheme), ...style }}
			// 로딩 중에는 다시 누르지 못하게
			disabled={disabled || isLoading}
			aria-busy={isLoading || undefined}
			data-tooltip={tooltip}
			data-hover={hoverKeys(scheme)}
			{...props}
		>
			{isLoading && <LuLoaderCircle className="spinner" aria-hidden />}
			{icon && iconPosition === 'left' && <span className="icon">{icon}</span>}
			{label}
			{icon && iconPosition === 'right' && <span className="icon">{icon}</span>}
		</Tag>
	);
};

export default Button;
