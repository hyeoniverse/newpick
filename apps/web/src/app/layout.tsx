import type { Metadata } from 'next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ArticleDetail as IArticleDetail, ArticleSummary as IArticleSummary } from '@/models/article.model';
import { fetchTrendList } from '@/api/article';
import { fetchContactEmail } from '@/api/contact';
import { parseArticles } from '@/utils/parseArticles';
import { SESSION_HINT_COOKIE } from '@/constants/api';
import { THEME_LOCALSTORAGE_KEY } from '@/stores/useThemeStore';
import { DEFAULT_OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/constants/site';

import '@/styles/pretendard.css';
import '@/styles/global';
import StyledComponentsRegistry from '@/lib/registry';
import Providers from '@/components/providers/Providers';
import Layout from '@/components/layout/MainLayout';
import ToastContainer from '@/components/common/toast/ToastContainer';
import ModalContainer from '@/components/common/modal/ModalContainer';
import Tracker from '@/components/common/analytics/Tracker';

/**
 * 사이트 공통 메타데이터 (#15). 화면마다 title만 주면 '제목 | 뉴픽: NewPick'이 되고,
 * 공유 미리보기는 기본 이미지(/og.png)를 쓴다. 기사 상세는 기사 제목 · 부제 · 사진으로 덮어쓴다
 */
export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
	title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
	description: SITE_DESCRIPTION,
	applicationName: SITE_NAME,
	openGraph: {
		type: 'website',
		siteName: SITE_NAME,
		locale: 'ko_KR',
		url: '/',
		title: SITE_NAME,
		description: SITE_DESCRIPTION,
		images: [DEFAULT_OG_IMAGE],
	},
	twitter: {
		card: 'summary_large_image',
		title: SITE_NAME,
		description: SITE_DESCRIPTION,
		images: [DEFAULT_OG_IMAGE.url],
	},
};

/**
 * 화면을 그리기 전에 로그인 표시 쿠키를 읽어 <html data-auth>를 정합니다.
 * 하이드레이션 전에도 헤더가 CSS로 맞는 쪽(로그인 버튼 / 프로필 자리)만 보여 줘 깜빡이지 않습니다.
 */
const sessionHintScript = `document.documentElement.dataset.auth=document.cookie.split('; ').includes('${SESSION_HINT_COOKIE}=1')?'in':'out'`;

/** 저장된 테마도 그리기 전에 <html data-theme>에 적어, 다크 사용자가 라이트 화면을 잠깐 보지 않게 합니다 */
const themeScript = `try{document.documentElement.dataset.theme=localStorage.getItem('${THEME_LOCALSTORAGE_KEY}')==='dark'?'dark':'light'}catch(e){}`;

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	// 요청 쿠키를 읽지 않아 모든 페이지를 정적으로 만들 수 있습니다. 로그인 사용자는 브라우저에서 조회합니다.
	// 트렌드는 10분간 캐시됩니다.
	let parsedTrends: IArticleSummary[] = [];
	const contactPromise = fetchContactEmail();
	try {
		const trends: IArticleDetail[] = await fetchTrendList();
		parsedTrends = parseArticles(trends);
	} catch (error) {
		console.error(error);
	}
	const contactEmail = await contactPromise;

	return (
		<html lang="ko" suppressHydrationWarning>
			<head>
				<script dangerouslySetInnerHTML={{ __html: sessionHintScript }} />
				<script dangerouslySetInnerHTML={{ __html: themeScript }} />
				<link rel="icon" href="/icons/favicon.svg" />
			</head>
			<body>
				<StyledComponentsRegistry>
					<Providers initialTrends={parsedTrends}>
						<Layout contactEmail={contactEmail}>{children}</Layout>
						<ToastContainer />
						<ModalContainer />
						<SpeedInsights />
						{/* 방문 통계 (#131): 쿠키 없이 */}
						<Tracker />
					</Providers>
				</StyledComponentsRegistry>
			</body>
		</html>
	);
}
