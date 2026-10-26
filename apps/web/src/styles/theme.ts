export type ThemeName = 'light' | 'dark';

export type ColorKey =
	| 'primary' // 주요 색상
	| 'secondary' // 보조 색상
	| 'tertiary' // 세번째 색상
	| 'background' // 배경 색상
	| 'surface' // 표면 색상 ex) 카드, 버튼
	| 'disabled' // 비활성 색상
	| 'success' // 성공 색상
	| 'error' // 오류 색상
	| 'warning' // 경고 색상
	| 'text' // 텍스트 색상
	| 'subText' // 보조텍스트 색상
	| 'neutral' // 옅은 그레이 색상
	| 'lightGrey' // 밝은 그레이 색상
	| 'mediumGrey' // 어두운 그레이 색상
	| 'border' // 테두리 색상
	| 'white' // 흰색
	| 'mono'; // 회색 계열

export type HeadingSize = 'extraSmall' | 'small' | 'medium' | 'large' | 'extraLarge';
export type FontSize = 'extraSmall' | 'small' | 'medium' | 'large' | 'extraLarge';
export type FontWeight = 'light' | 'regular' | 'medium' | 'semiBold' | 'bold' | 'extraBold';

export type BorderRadius = 'flat' | 'soft' | 'medium' | 'rounded' | 'capsule' | 'circle';
/**
 * control: 누르는 것 (버튼·입력칸·선택 목록·체크 상자) — 각지게
 * chip: 분류·고르기 (태그·분야 칩·꼬리표) — 알약 모양. 동작 버튼과 모양으로 구분된다
 * surface: 담는 것 (카드·사진·펼친 목록·안내 상자) — 살짝 둥글게
 * floating: 화면 위에 뜨는 것 (시트·토스트) — 바탕과 구분되게 더 둥글게
 * 원래 둥근 것(프로필 사진·라디오·점)은 borderRadius.circle
 */
export type RadiusRole = 'control' | 'chip' | 'surface' | 'floating';
export type Shadow = 'light' | 'medium' | 'heavy';

export type ButtonSize = 'extraSmall' | 'small' | 'medium' | 'large' | 'extraLarge';
export type ButtonScheme = 'primary' | 'secondary' | 'outline' | 'mono' | 'monoOutline' | 'danger' | 'default';
export type LayoutWidth = 'small' | 'medium' | 'large';
export type MediaQuery = 'mobile' | 'tablet' | 'desktop';

export interface Theme {
	name: ThemeName;
	color: Record<ColorKey, string>;

	fontSize: Record<FontSize, string>;
	fontWeight: Record<FontWeight, string>;
	heading: {
		[key in HeadingSize]: {
			fontSize: string;
		};
	};

	borderRadius: Record<BorderRadius, string>;
	/** 쓰임새별 모서리 (#63). 새로 만드는 곳은 이것을 쓴다 */
	radius: Record<RadiusRole, string>;
	shadow: Record<Shadow, string>;

	button: {
		[key in ButtonSize]: {
			fontSize: string;
			padding: string;
			gap?: string;
		};
	};
	buttonScheme: {
		[key in ButtonScheme]: {
			color: string;
			background: string;
			border: string;
			fontWeight: string;
			hover: {
				color: string;
				background?: string;
				border?: string;
				fontWeight?: string;
			};
		};
	};

	layout: {
		width: {
			[key in LayoutWidth]: string;
		};
	};
	mediaQuery: {
		[key in MediaQuery]: string;
	};
}

export const lightTheme: Theme = {
	name: 'light',
	color: {
		primary: '#3610e1',
		secondary: '#5564F1',
		tertiary: '#f4f1ff',
		background: '#FFFFFF',
		surface: '#F9F9F9',
		disabled: '#BDBDBD',
		success: '#8BC34A',
		error: '#E57373',
		warning: '#FFB300',
		text: '#000000',
		subText: '#808080',
		neutral: '#F0F0F0',
		mediumGrey: '#444444',
		lightGrey: '#999999',
		border: '#d9d9d9',
		white: '#FFFFFF',
		mono: '#111111',
	},
	fontSize: {
		extraSmall: '0.875rem',
		small: '1rem',
		medium: '1.125rem',
		large: '1.375rem',
		extraLarge: '1.75rem',
	},
	fontWeight: {
		light: '400',
		regular: '500',
		medium: '600',
		semiBold: '700',
		bold: '800',
		extraBold: '900',
	},
	heading: {
		extraSmall: {
			fontSize: '1.5rem',
		},
		small: {
			fontSize: '1.75rem',
		},
		medium: {
			fontSize: '2rem',
		},
		large: {
			fontSize: '2.25rem',
		},
		extraLarge: {
			fontSize: '3rem',
		},
	},
	borderRadius: {
		flat: '0',
		soft: '4px',
		medium: '8px',
		rounded: '16px',
		capsule: '9999px',
		circle: '50%',
	},
	radius: {
		control: '0',
		chip: '9999px',
		surface: '8px',
		floating: '16px',
	},
	button: {
		extraLarge: {
			fontSize: '1.75rem',
			padding: '1rem 2rem',
			gap: '0.75rem',
		},
		large: {
			fontSize: '1.5rem',
			padding: '1rem 1.5rem',
			gap: '0.75rem',
		},
		medium: {
			fontSize: '1.25rem',
			padding: '0.8rem 1.2rem',
			gap: '0.75rem',
		},
		small: {
			fontSize: '1rem',
			padding: '0.5rem 0.8rem',
			gap: '0.75rem',
		},
		extraSmall: {
			fontSize: '0.875rem',
			padding: '0.375rem 0.625rem',
			gap: '0.75rem',
		},
	},
	buttonScheme: {
		primary: {
			color: '#ffffff',
			background: '#3610e1',
			border: '1px solid #3610e1',
			fontWeight: '500',
			hover: {
				color: '#f4f1ff',
				background: '#2001af',
			},
		},
		// 연한 강조색 바탕 (default는 바탕 없음). 예전에는 둘이 똑같아 보였다
		secondary: {
			color: '#3610e1',
			background: '#F4F1FF',
			border: '1px solid transparent',
			fontWeight: '600',
			hover: {
				color: '#3610e1',
				background: '#E6DFFF',
			},
		},
		outline: {
			color: '#3610e1',
			background: 'transparent',
			border: '1px solid #3610e1',
			fontWeight: '500',
			hover: {
				color: '#3610e1',
				background: '#f4f1ff',
			},
		},
		mono: {
			color: '#ffffff',
			background: '#222222',
			border: '1px solid transparent',
			fontWeight: '500',
			hover: {
				color: '#f1f1f1',
				background: '#111111',
			},
		},
		monoOutline: {
			color: '#444444',
			background: 'transparent',
			border: '1px solid #999999',
			fontWeight: '500',
			hover: {
				color: '#444444',
				background: '#f1f1f1',
				border: '1px solid #444444',
			},
		},
		danger: {
			color: '#FFFFFF',
			background: '#E57373',
			border: '1px solid #E57373',
			fontWeight: '500',
			hover: {
				color: '#ffffff',
				background: '#D32F2F',
				border: '1px solid #D32F2F',
			},
		},
		default: {
			color: '#000000',
			background: 'transparent',
			border: '1px solid transparent',
			fontWeight: '500',
			hover: {
				color: '#3610e1',
				fontWeight: '700',
			},
		},
	},
	shadow: {
		light: '0px 1px 3px rgba(0, 0, 0, 0.1)',
		medium: '0px 4px 6px rgba(0, 0, 0, 0.1)',
		heavy: '0px 10px 15px rgba(0, 0, 0, 0.1)',
	},
	layout: {
		width: {
			large: '1024px',
			medium: '768px',
			small: '375px',
		},
	},
	mediaQuery: {
		desktop: '(max-width: 1024px)',
		tablet: '(max-width: 768px)',
		mobile: '(max-width: 425px)',
	},
};

export const darkTheme: Theme = {
	...lightTheme,
	name: 'dark',
	color: {
		primary: '#9ca9ff',
		secondary: '#6980ff',
		background: '#121212',
		tertiary: '#0f1d7a',
		surface: '#1E1E1E',
		disabled: '#555555',
		success: '#66BB6A',
		error: '#EF5350',
		warning: '#FFB300',
		text: '#f1f1f1',
		subText: '#c1c1c1',
		neutral: '#2D2D2D',
		mediumGrey: '#a3a3a3',
		lightGrey: '#606060',
		border: '#333333',
		white: '#FFFFFF',
		mono: '#111111',
	},
	buttonScheme: {
		primary: {
			color: '#121212',
			background: '#8C9EFF',
			border: '1px solid transparent',
			fontWeight: '500',
			hover: {
				color: '#000000',
				background: '#6c80ed',
			},
		},
		secondary: {
			color: '#c9d0ff',
			background: '#1b2357',
			border: '1px solid transparent',
			fontWeight: '600',
			hover: {
				color: '#ffffff',
				background: '#0f1d7a',
			},
		},
		outline: {
			color: '#9ca9ff',
			background: 'transparent',
			border: '1px solid #9ca9ff',
			fontWeight: '500',
			hover: {
				color: '#121212',
				background: '#9ca9ff',
			},
		},
		mono: {
			color: '#121212',
			background: '#f1f1f1',
			border: '1px solid transparent',
			fontWeight: '500',
			hover: {
				color: '#121212',
				background: '#d9d9d9',
			},
		},
		monoOutline: {
			color: '#f1f1f1',
			background: 'transparent',
			border: '1px solid #808080',
			fontWeight: '500',
			hover: {
				color: '#f1f1f1',
				background: '#191919',
				border: '1px solid #999999',
			},
		},
		danger: {
			color: '#FFFFFF',
			background: '#EF5350',
			border: '1px solid #EF5350',
			fontWeight: '500',
			hover: {
				color: '#FFFFFF',
				background: '#D32F2F',
				border: '1px solid #D32F2F',
			},
		},
		default: {
			color: '#f1f1f1',
			background: 'transparent',
			border: '1px solid transparent',
			fontWeight: '500',
			hover: {
				color: '#9ca9ff',
				fontWeight: '700',
			},
		},
	},
};

export const getTheme = (themeName: ThemeName): Theme => {
	return themeName === 'dark' ? darkTheme : lightTheme;
};

/**
 * 라이트·다크에 따라 바뀌는 값(색·버튼 색·그림자)을 CSS 변수로 바꾼다.
 * 서버는 페이지를 저장된 테마를 모른 채 미리 만들어 두므로, 컴포넌트가 테마마다 다른 값을 쓰면
 * 브라우저에서 다크로 그릴 때 서버가 만든 화면과 class가 달라진다(하이드레이션 불일치).
 * 컴포넌트에는 늘 같은 var(--…)를 주고, 실제 색은 <html data-theme>에 따라 GlobalStyle이 정한다
 */
type ThemedPart = Pick<Theme, 'color' | 'buttonScheme' | 'shadow'>;

const toVarName = (path: string[]) => `--np-${path.map((p) => p.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)).join('-')}`;

/** 같은 모양의 객체에서 글자 값만 var(--np-…)로 바꾼다 */
const toVarRefs = <T>(value: T, path: string[]): T => {
	if (typeof value === 'string') return `var(${toVarName(path)})` as T;
	return Object.fromEntries(Object.entries(value as object).map(([key, v]) => [key, toVarRefs(v, [...path, key])])) as T;
};

/** --np-color-primary: #3610e1; 같은 선언 목록 */
const toVarDeclarations = (value: unknown, path: string[]): string[] =>
	typeof value === 'string'
		? [`${toVarName(path)}: ${value};`]
		: Object.entries(value as object).flatMap(([key, v]) => toVarDeclarations(v, [...path, key]));

const themedPart = ({ color, buttonScheme, shadow }: Theme): ThemedPart => ({ color, buttonScheme, shadow });

export const themeVars = (theme: Theme) => toVarDeclarations(themedPart(theme), []).join('\n');

/** 컴포넌트가 쓰는 테마: 크기·글꼴 등은 그대로, 바뀌는 색은 CSS 변수. 라이트·다크 어느 쪽이든 같다 */
export const cssVarTheme: Theme = { ...lightTheme, ...toVarRefs(themedPart(lightTheme), []) };
