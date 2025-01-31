'use client';

import { create } from 'zustand';
import { ThemeName } from '@/styles/theme';

const DEFAULT_THEME_NAME: ThemeName = 'light';
const THEME_LOCALSTORAGE_KEY = 'qru_theme';

interface ThemeState {
	themeName: ThemeName;
	setTheme: (theme: ThemeName) => void;
	toggleTheme: () => void;
}

// Zustand 스토어 생성
export const useThemeStore = create<ThemeState>((set) => ({
	themeName: DEFAULT_THEME_NAME,
	setTheme: (theme) => {
		localStorage.setItem(THEME_LOCALSTORAGE_KEY, theme);
		set({ themeName: theme });
	},
	toggleTheme: () =>
		set((state) => {
			const newTheme = state.themeName === 'light' ? 'dark' : 'light';
			localStorage.setItem(THEME_LOCALSTORAGE_KEY, newTheme);
			return { themeName: newTheme };
		}),
}));
