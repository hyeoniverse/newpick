'use client';

import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import { ArticleSummary as IArticleSummary } from '@/models/article.model';
import { useAuthStore } from '@/stores/useAuthStore';
import { TRENDS_QUERY_KEY } from '@/hooks/useTrends';
import { SESSION_HINT_COOKIE } from '@/constants/api';
import { AppThemeProvider } from '@/components/providers/AppThemeProvider';

interface Props {
	children: React.ReactNode;
	initialTrends: IArticleSummary[];
}

export default function Providers({ children, initialTrends }: Props) {
	const [queryClient] = useState(() => {
		const client = new QueryClient({
			defaultOptions: {
				queries: {
					// 없는 글·권한 없음 같은 4xx는 다시 물어도 같으므로 바로 오류 화면으로. 서버 오류만 두 번 더
					retry: (failureCount, error) => !(error instanceof ApiError && error.status < 500) && failureCount < 2,
				},
			},
		});
		// 서버에서 받은 트렌드로 캐시를 채워 첫 렌더링부터 보여 줍니다.
		if (initialTrends.length > 0) client.setQueryData(TRENDS_QUERY_KEY, initialTrends);
		return client;
	});
	const setSession = useAuthStore((state) => state.setSession);

	// 페이지는 정적으로 만들어지므로 로그인 여부는 브라우저에서 표시 쿠키로 판단합니다.
	useEffect(() => {
		const hasSession = document.cookie.split('; ').includes(`${SESSION_HINT_COOKIE}=1`);
		setSession(hasSession ? 'in' : 'out');
	}, [setSession]);

	return (
		<AppThemeProvider>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</AppThemeProvider>
	);
}
