'use client';

import React from 'react';
import { ThemeProvider } from 'styled-components';
import { GlobalStyle } from '@/styles/global';
import { useThemeStore, useSyncTheme } from '@/stores/useThemeStore';
import { getTheme } from '@/styles/theme';

export const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { themeName } = useThemeStore();
	useSyncTheme(); // 클라이언트에서 테마 동기화

	return (
		<ThemeProvider theme={getTheme(themeName)}>
			<GlobalStyle themeName={themeName} />
			{children}
		</ThemeProvider>
	);
};

export default AppThemeProvider;
