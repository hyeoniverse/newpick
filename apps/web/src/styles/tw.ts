import type { ColorKey, FontSize, FontWeight, HeadingSize } from '@/styles/tokens/theme';

/**
 * Tailwind로 옮긴 컴포넌트가 theme.ts의 이름(size="small", color="subText" …)을 그대로 받도록 잇는 표 (#10).
 * Tailwind는 소스에 그대로 적힌 클래스 이름만 만들므로, 이름을 조립하지 않고 표에 다 적어 둔다.
 * 값은 global.css @theme inline → styles/tokens/tokens.css의 var(--np-…)라 라이트 · 다크 · 화면 폭에 따라 바뀐다.
 */

/** 클래스 이름 잇기. 거짓 값은 뺀다 */
export function cx(...names: (string | false | null | undefined)[]) {
	return names.filter(Boolean).join(' ');
}

export const TEXT_SIZE: Record<FontSize, string> = {
	extraSmall: 'text-extra-small',
	small: 'text-small',
	medium: 'text-medium',
	large: 'text-large',
	extraLarge: 'text-extra-large',
};

export const HEADING_SIZE: Record<HeadingSize, string> = {
	extraSmall: 'text-heading-extra-small',
	small: 'text-heading-small',
	medium: 'text-heading-medium',
	large: 'text-heading-large',
	extraLarge: 'text-heading-extra-large',
};

export const FONT_WEIGHT: Record<FontWeight, string> = {
	light: 'font-light',
	regular: 'font-regular',
	medium: 'font-medium',
	semiBold: 'font-semi-bold',
	bold: 'font-bold',
	extraBold: 'font-extra-bold',
};

export const TEXT_COLOR: Record<ColorKey, string> = {
	primary: 'text-primary',
	secondary: 'text-secondary',
	tertiary: 'text-tertiary',
	background: 'text-background',
	surface: 'text-surface',
	disabled: 'text-disabled',
	success: 'text-success',
	error: 'text-error',
	warning: 'text-warning',
	text: 'text-text',
	subText: 'text-sub-text',
	neutral: 'text-neutral',
	lightGrey: 'text-light-grey',
	mediumGrey: 'text-medium-grey',
	border: 'text-border',
	white: 'text-white',
	mono: 'text-mono',
};

export const BG_COLOR: Record<ColorKey, string> = {
	primary: 'bg-primary',
	secondary: 'bg-secondary',
	tertiary: 'bg-tertiary',
	background: 'bg-background',
	surface: 'bg-surface',
	disabled: 'bg-disabled',
	success: 'bg-success',
	error: 'bg-error',
	warning: 'bg-warning',
	text: 'bg-text',
	subText: 'bg-sub-text',
	neutral: 'bg-neutral',
	lightGrey: 'bg-light-grey',
	mediumGrey: 'bg-medium-grey',
	border: 'bg-border',
	white: 'bg-white',
	mono: 'bg-mono',
};

export const BORDER_COLOR: Record<ColorKey, string> = {
	primary: 'border-primary',
	secondary: 'border-secondary',
	tertiary: 'border-tertiary',
	background: 'border-background',
	surface: 'border-surface',
	disabled: 'border-disabled',
	success: 'border-success',
	error: 'border-error',
	warning: 'border-warning',
	text: 'border-text',
	subText: 'border-sub-text',
	neutral: 'border-neutral',
	lightGrey: 'border-light-grey',
	mediumGrey: 'border-medium-grey',
	border: 'border-border',
	white: 'border-white',
	mono: 'border-mono',
};

/* 공통 글자 부품의 기본 모양 (styles/parts.css). 화면 CSS가 덮어쓸 수 있게 유틸리티가 아닌 components 층 클래스 */
export const PART_TEXT_SIZE: Record<FontSize, string> = {
	extraSmall: 'np-text-extra-small',
	small: 'np-text-small',
	medium: 'np-text-medium',
	large: 'np-text-large',
	extraLarge: 'np-text-extra-large',
};
export const PART_HEADING_SIZE: Record<HeadingSize, string> = {
	extraSmall: 'np-text-heading-extra-small',
	small: 'np-text-heading-small',
	medium: 'np-text-heading-medium',
	large: 'np-text-heading-large',
	extraLarge: 'np-text-heading-extra-large',
};
export const PART_FONT_WEIGHT: Record<FontWeight, string> = {
	light: 'np-font-light',
	regular: 'np-font-regular',
	medium: 'np-font-medium',
	semiBold: 'np-font-semi-bold',
	bold: 'np-font-bold',
	extraBold: 'np-font-extra-bold',
};
export const PART_TEXT_COLOR: Record<ColorKey, string> = {
	primary: 'np-text-primary',
	secondary: 'np-text-secondary',
	tertiary: 'np-text-tertiary',
	background: 'np-text-background',
	surface: 'np-text-surface',
	disabled: 'np-text-disabled',
	success: 'np-text-success',
	error: 'np-text-error',
	warning: 'np-text-warning',
	text: 'np-text-text',
	subText: 'np-text-sub-text',
	neutral: 'np-text-neutral',
	lightGrey: 'np-text-light-grey',
	mediumGrey: 'np-text-medium-grey',
	border: 'np-text-border',
	white: 'np-text-white',
	mono: 'np-text-mono',
};
export const PART_BG_COLOR: Record<ColorKey, string> = {
	primary: 'np-bg-primary',
	secondary: 'np-bg-secondary',
	tertiary: 'np-bg-tertiary',
	background: 'np-bg-background',
	surface: 'np-bg-surface',
	disabled: 'np-bg-disabled',
	success: 'np-bg-success',
	error: 'np-bg-error',
	warning: 'np-bg-warning',
	text: 'np-bg-text',
	subText: 'np-bg-sub-text',
	neutral: 'np-bg-neutral',
	lightGrey: 'np-bg-light-grey',
	mediumGrey: 'np-bg-medium-grey',
	border: 'np-bg-border',
	white: 'np-bg-white',
	mono: 'np-bg-mono',
};
export const PART_BORDER_COLOR: Record<ColorKey, string> = {
	primary: 'np-border-primary',
	secondary: 'np-border-secondary',
	tertiary: 'np-border-tertiary',
	background: 'np-border-background',
	surface: 'np-border-surface',
	disabled: 'np-border-disabled',
	success: 'np-border-success',
	error: 'np-border-error',
	warning: 'np-border-warning',
	text: 'np-border-text',
	subText: 'np-border-sub-text',
	neutral: 'np-border-neutral',
	lightGrey: 'np-border-light-grey',
	mediumGrey: 'np-border-medium-grey',
	border: 'np-border-border',
	white: 'np-border-white',
	mono: 'np-border-mono',
};
