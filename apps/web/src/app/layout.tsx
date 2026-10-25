import type { Metadata } from 'next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ArticleDetail as IArticleDetail, ArticleSummary as IArticleSummary } from '@/models/article.model';
import { fetchTrendList } from '@/api/article';
import { parseArticles } from '@/utils/parseArticles';
import { SESSION_HINT_COOKIE } from '@/constants/api';

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

/**
 * 화면을 그리기 전에 로그인 표시 쿠키를 읽어 <html data-auth>를 정합니다.
 * 하이드레이션 전에도 헤더가 CSS로 맞는 쪽(로그인 버튼 / 프로필 자리)만 보여 줘 깜빡이지 않습니다.
 */
const sessionHintScript = `document.documentElement.dataset.auth=document.cookie.split('; ').includes('${SESSION_HINT_COOKIE}=1')?'in':'out'`;

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	// 요청 쿠키를 읽지 않아 모든 페이지를 정적으로 만들 수 있습니다. 로그인 사용자는 브라우저에서 조회합니다.
	// 트렌드는 10분간 캐시됩니다.
	let parsedTrends: IArticleSummary[] = [];
	try {
		const trends: IArticleDetail[] = await fetchTrendList();
		parsedTrends = parseArticles(trends);
	} catch (error) {
		console.error(error);
	}

	return (
		<html lang="ko" suppressHydrationWarning>
			<head>
				<script dangerouslySetInnerHTML={{ __html: sessionHintScript }} />
				<link rel="icon" href="/icons/favicon.svg" />
			</head>
			<body>
				<StyledComponentsRegistry>
					<Providers initialTrends={parsedTrends}>
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
