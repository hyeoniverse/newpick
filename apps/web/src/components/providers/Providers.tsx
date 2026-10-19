'use client';

import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { User as IUser } from '@/models/user.model';
import { ArticleSummary as IArticleSummary } from '@/models/article.model';
import { useAuthStore } from '@/stores/useAuthStore';
import { TRENDS_QUERY_KEY } from '@/hooks/useTrends';
import { useThemeStore } from '@/stores/useThemeStore';
import { AppThemeProvider } from '@/components/providers/AppThemeProvider';

interface Props {
	children: React.ReactNode;
	initialUser: IUser | null;
	initialTrends: IArticleSummary[];
}

export default function Providers({ children, initialUser, initialTrends }: Props) {
	const [queryClient] = useState(() => {
		const client = new QueryClient();
		// 서버에서 받은 트렌드로 캐시를 채워 첫 렌더링부터 보여 줍니다.
		if (initialTrends.length > 0) client.setQueryData(TRENDS_QUERY_KEY, initialTrends);
		return client;
	});
	const setUser = useAuthStore((state) => state.setUser);
	const { setTheme } = useThemeStore();

	useEffect(() => {
		if (initialUser) {
			setUser(initialUser);
		}
	}, [initialUser, setUser]);

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
