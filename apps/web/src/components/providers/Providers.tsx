'use client';

import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ArticleSummary as IArticleSummary } from '@/models/article.model';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTrendStore } from '@/stores/useTrendsStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { SESSION_HINT_COOKIE } from '@/constants/api';
import { AppThemeProvider } from '@/components/providers/AppThemeProvider';

interface Props {
	children: React.ReactNode;
	initialTrends: IArticleSummary[];
}

export default function Providers({ children, initialTrends }: Props) {
	const [queryClient] = useState(() => new QueryClient());
	const setSession = useAuthStore((state) => state.setSession);
	const setTrends = useTrendStore((state) => state.setTrends);
	const { setTheme } = useThemeStore();

	// 페이지는 정적으로 만들어지므로 로그인 여부는 브라우저에서 표시 쿠키로 판단합니다.
	useEffect(() => {
		const hasSession = document.cookie.split('; ').includes(`${SESSION_HINT_COOKIE}=1`);
		setSession(hasSession ? 'in' : 'out');
	}, [setSession]);

	useEffect(() => {
		if (initialTrends.length > 0) {
			setTrends(initialTrends);
		}
	}, [initialTrends, setTrends]);

	useEffect(() => {
		const savedTheme = localStorage.getItem('newpick_theme') || 'light';
		setTheme(savedTheme as 'light' | 'dark');
	}, [setTheme]);

	return (
		<AppThemeProvider>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</AppThemeProvider>
	);
}
