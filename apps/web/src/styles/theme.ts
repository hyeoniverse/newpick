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
	| 'border'; // 테두리 색상

export type HeadingSize = 'extraSmall' | 'small' | 'medium' | 'large' | 'extraLarge';
export type FontSize = 'extraSmall' | 'small' | 'medium' | 'large' | 'extraLarge';
export type FontWeight = 'light' | 'regular' | 'medium' | 'semiBold' | 'bold' | 'extraBold';

export type BorderRadius = 'flat' | 'soft' | 'medium' | 'rounded' | 'capsule' | 'circle';
export type Shadow = 'light' | 'medium' | 'heavy';

export type ButtonSize = 'extraSmall' | 'small' | 'medium' | 'large' | 'extraLarge';
export type ButtonScheme = 'primary' | 'secondary' | 'outline' | 'mono' | 'monoOutline' | 'danger' | 'default';
export type LayoutWidth = 'small' | 'medium' | 'large';
export type MediaQuery = 'mobile' | 'tablet' | 'desktop';

interface Theme {
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
	button: {
		extraLarge: {
			fontSize: '1.125rem',
			padding: '1rem 2rem',
			gap: '0.75rem',
		},
		large: {
			fontSize: '1rem',
			padding: '1rem 1.5rem',
			gap: '0.75rem',
		},
		medium: {
			fontSize: '1rem',
			padding: '0.8rem 1.2rem',
			gap: '0.75rem',
		},
		small: {
			fontSize: '0.875rem',
			padding: '0.5rem 0.8rem',
			gap: '0.75rem',
		},
		extraSmall: {
			fontSize: '0.875rem',
			padding: '0 0.5rem',
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
		secondary: {
			color: '#000000',
			background: 'transparent',
			border: '1px solid transparent',
			fontWeight: '500',
			hover: {
				color: '#3610e1',
				background: '#F4F1FF',
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
		subText: '#a3a3a3',
		neutral: '#2D2D2D',
		mediumGrey: '#a3a3a3',
		lightGrey: '#606060',
		border: '#606060',
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
			color: '#f1f1f1',
			background: 'transparent',
			border: '1px solid transparent',
			fontWeight: '500',
			hover: {
				color: '#9ca9ff',
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
