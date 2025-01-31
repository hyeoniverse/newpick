'use client';

import React, { useEffect } from 'react';
import { ThemeProvider } from 'styled-components';
import { GlobalStyle } from '@/styles/global';
import { useTheme } from '@/hooks/useTheme';
import { getTheme } from '@/styles/theme';

const THEME_LOCALSTORAGE_KEY = 'newpick_theme';

export const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { themeName, setTheme } = useTheme();

	// 마운트 시 localStorage에서 테마 불러오기
	useEffect(() => {
		const savedTheme = (localStorage.getItem(THEME_LOCALSTORAGE_KEY) as 'light' | 'dark') || 'light';
		setTheme(savedTheme);
	}, [setTheme]);

	return (
		<ThemeProvider theme={getTheme(themeName)}>
			<GlobalStyle themeName={themeName} />
			{children}
		</ThemeProvider>
	);
};

export default AppThemeProvider;
