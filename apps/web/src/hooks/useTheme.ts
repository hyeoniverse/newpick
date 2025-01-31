'use client';

import { useThemeStore } from '@/stores/useThemeStore';

export const useTheme = () => {
	const { themeName, setTheme, toggleTheme } = useThemeStore();

	return {
		themeName,
		setTheme,
		toggleTheme,
	};
};
