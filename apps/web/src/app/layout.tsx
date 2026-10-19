import type { Metadata } from 'next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ArticleDetail as IArticleDetail, ArticleSummary as IArticleSummary } from '@/models/article.model';
import { fetchUserWithSubscription } from '@/api/user';
import { fetchTrendList } from '@/api/article';
import { parseArticles } from '@/utils/parseArticles';

import '@/styles/global';
import StyledComponentsRegistry from '@/lib/registry';
import Providers from '@/components/providers/Providers';
import Layout from '@/components/layout/MainLayout';
import ToastContainer from '@/components/common/toast/ToastContainer';
import ModalContainer from '@/components/common/modal/ModalContainer';

export const metadata: Metadata = {
	title: '뉴픽: NewPick',
	description: '뉴스를 새롭게 고르다',
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	// 로그인 쿠키가 없으면 백엔드를 호출하지 않습니다. 트렌드는 10분간 캐시됩니다.
	const user = await fetchUserWithSubscription();

	let parsedTrends: IArticleSummary[] = [];
	try {
		const trends: IArticleDetail[] = await fetchTrendList();
		parsedTrends = parseArticles(trends);
	} catch (error) {
		console.error(error);
	}

	return (
		<html lang="ko">
			<head>
				<link rel="icon" href="/icons/favicon.svg" />
			</head>
			<body>
				<StyledComponentsRegistry>
					<Providers initialUser={user} initialTrends={parsedTrends}>
						<Layout>{children}</Layout>
						<ToastContainer />
						<ModalContainer />
						<SpeedInsights />
					</Providers>
				</StyledComponentsRegistry>
			</body>
		</html>
	);
}
