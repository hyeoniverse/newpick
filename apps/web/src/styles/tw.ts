import type { ColorKey, FontSize, FontWeight, HeadingSize } from '@/styles/theme';

/**
 * Tailwind로 옮긴 컴포넌트가 theme.ts의 이름(size="small", color="subText" …)을 그대로 받도록 잇는 표 (#10).
 * Tailwind는 소스에 그대로 적힌 클래스 이름만 만들므로, 이름을 조립하지 않고 표에 다 적어 둔다.
 * 값은 global.css @theme inline → styles/tokens.css의 var(--np-…)라 라이트 · 다크 · 화면 폭에 따라 바뀐다.
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
