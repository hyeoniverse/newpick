'use client';

import { useHeader } from '@/hooks/useHeader';
import styled from 'styled-components';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ScrollButtons from '@/components/common/ScrollButtons';
import LoginParamNotice from '@/components/common/auth/LoginParamNotice';
import LoginPopupBridge from '@/components/common/auth/LoginPopupBridge';

interface Props {
	children: React.ReactNode;
	/** 아래쪽 문의처 (서버에서 받음) */
	contactEmail?: string | null;
}

export default function Layout({ children, contactEmail }: Props) {
	const { headerHeight } = useHeader();

	return (
		<StyledLayout $headerHeight={headerHeight}>
			<Header />
			<Content className="content">{children}</Content>
			<ScrollButtons />
			<LoginPopupBridge />
			<LoginParamNotice />
			<Footer contactEmail={contactEmail} />
		</StyledLayout>
	);
}

interface StyledProps {
	$headerHeight: string;
}

const StyledLayout = styled.div<StyledProps>`
	display: flex;
	flex-direction: column;
	margin: 0 auto;
	width: 100vw;
	height: 100vh;

	padding-top: ${({ $headerHeight }) => $headerHeight};
	transition: padding-top 0.3s ease;

	@media ${({ theme }) => theme.mediaQuery.desktop} {
		header {
			padding: 0 1rem;
		}
		main {
			padding: 0 1rem;
		}
		footer {
			.footer {
				padding: 0 1rem;
			}
		}
	}
`;

const Content = styled.main`
	width: 100%;
	max-width: ${({ theme }) => theme.layout.width.large};
	margin: 0 auto;
`;
