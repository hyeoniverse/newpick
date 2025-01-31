'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppThemeProvider } from '@/components/providers/AppThemeProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(() => new QueryClient());

	return (
		<AppThemeProvider>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</AppThemeProvider>
	);
}
