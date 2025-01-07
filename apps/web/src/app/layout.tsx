import type { Metadata } from 'next';
import '@/styles/globals';
import StyledComponentsRegistry from '@/lib/registry';
import { AppThemeProvider } from '@/context/themeContext';
import ToastContainer from '@/components/common/toast/ToastContainer';
import Layout from '@/components/layout/Layout';

export const metadata: Metadata = {
	title: '뉴픽: NewPick',
	description: '뉴스를 새롭게 고르다',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="ko">
			<head>
				<link rel="icon" href="/icons/logo_small.ico" />
			</head>
			<body>
				<StyledComponentsRegistry>
					<AppThemeProvider>
						<Layout>{children}</Layout>
						<ToastContainer />
					</AppThemeProvider>
				</StyledComponentsRegistry>
			</body>
		</html>
	);
}
