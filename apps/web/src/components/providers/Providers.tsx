'use client';

import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { User as IUser } from '@/models/user.model';
import { ArticleSummary as IArticleSummary } from '@/models/article.model';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTrendStore } from '@/stores/useTrendsStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { AppThemeProvider } from '@/components/providers/AppThemeProvider';

interface Props {
	children: React.ReactNode;
	initialUser: IUser | null;
	initialTrends: IArticleSummary[];
}

export default function Providers({ children, initialUser, initialTrends }: Props) {
	const [queryClient] = useState(() => new QueryClient());
	const setUser = useAuthStore((state) => state.setUser);
	const setTrends = useTrendStore((state) => state.setTrends);
	const { setTheme } = useThemeStore();

	useEffect(() => {
		if (initialUser) {
			setUser(initialUser);
		}
	}, [initialUser, setUser]);

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
