'use client';

import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { User as IUser } from '@/models/user.model';
import { useAuthStore } from '@/stores/useAuthStore';
import { AppThemeProvider } from '@/components/providers/AppThemeProvider';

interface Props {
	children: React.ReactNode;
	initialUser: IUser | null;
}

export default function Providers({ children, initialUser }: Props) {
	const [queryClient] = useState(() => new QueryClient());
	const setUser = useAuthStore((state) => state.setUser);

	useEffect(() => {
		if (initialUser) {
			setUser(initialUser);
		}
	}, [initialUser, setUser]);

	return (
		<AppThemeProvider>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</AppThemeProvider>
	);
}
