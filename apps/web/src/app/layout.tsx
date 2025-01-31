import type { Metadata } from 'next';
import { fetchUserWithSubscription } from '@/api/user';

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
	const user = await fetchUserWithSubscription();

	return (
		<html lang="ko">
			<head>
				<link rel="icon" href="/icons/favicon.svg" />
			</head>
			<body>
				<StyledComponentsRegistry>
					<Providers initialUser={user}>
						<Layout>{children}</Layout>
						<ToastContainer />
						<ModalContainer />
					</Providers>
				</StyledComponentsRegistry>
			</body>
		</html>
	);
}
