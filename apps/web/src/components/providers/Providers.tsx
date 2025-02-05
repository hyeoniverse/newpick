'use client';

import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { User as IUser } from '@/models/user.model';
import { ArticleSummary as IArticleSummary } from '@/models/article.model';
import { useAuthStore } from '@/stores/useAuthStore';
import { AppThemeProvider } from '@/components/providers/AppThemeProvider';
import { useTrendStore } from '@/stores/useTrendsStore';

interface Props {
	children: React.ReactNode;
	initialUser: IUser | null;
	initialTrends: IArticleSummary[];
}

export default function Providers({ children, initialUser, initialTrends }: Props) {
	const [queryClient] = useState(() => new QueryClient());
	const setUser = useAuthStore((state) => state.setUser);
	const setTrends = useTrendStore((state) => state.setTrends);

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

	return (
		<AppThemeProvider>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</AppThemeProvider>
	);
}
