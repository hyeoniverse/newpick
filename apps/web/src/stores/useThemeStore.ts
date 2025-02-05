'use client';

import { create } from 'zustand';
import { ThemeName } from '@/styles/theme';
import React from 'react';

const THEME_LOCALSTORAGE_KEY = 'newpick_theme';

interface ThemeState {
	themeName: ThemeName;
	setTheme: (theme: ThemeName) => void;
	toggleTheme: () => void;
}

// Zustand 스토어 생성
export const useThemeStore = create<ThemeState>((set) => ({
	themeName: 'light', // 서버에서는 항상 light로 설정하여 초기 UI 불일치 방지

	setTheme: (theme) => {
		if (typeof window !== 'undefined') {
			localStorage.setItem(THEME_LOCALSTORAGE_KEY, theme);
		}
		set({ themeName: theme });
	},

	toggleTheme: () =>
		set((state) => {
			const newTheme = state.themeName === 'light' ? 'dark' : 'light';
			if (typeof window !== 'undefined') {
				localStorage.setItem(THEME_LOCALSTORAGE_KEY, newTheme);
			}
			return { themeName: newTheme };
		}),
}));

// 클라이언트에서 테마 불러오기
export const useSyncTheme = () => {
	const { setTheme } = useThemeStore();

	React.useEffect(() => {
		if (typeof window !== 'undefined') {
			const savedTheme = (localStorage.getItem(THEME_LOCALSTORAGE_KEY) as ThemeName) || 'light';
			setTheme(savedTheme);
		}
	}, [setTheme]);
};
