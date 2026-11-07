'use client';

import React from 'react';
import { ThemeProvider } from 'styled-components';
import { useSyncTheme } from '@/stores/useThemeStore';
import { cssVarTheme } from '@/styles/theme';

export const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	useSyncTheme(); // 클라이언트에서 테마 동기화

	// 테마가 바뀌어도 컴포넌트의 class는 그대로이고 <html data-theme>의 색 변수만 바뀐다.
	// 색 변수와 전역 기본 스타일은 app/global.css(정적 CSS)에 있다
	return <ThemeProvider theme={cssVarTheme}>{children}</ThemeProvider>;
};

export default AppThemeProvider;
