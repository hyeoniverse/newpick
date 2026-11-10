'use client';

import { useHeader } from '@/hooks/useHeader';
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
		<div
			className={[
				'mx-auto flex h-screen w-screen flex-col pt-[var(--header-height)] [transition:padding-top_0.3s_ease]',
				// 좌우 여백: 내용 폭(1024px)보다 좁은 화면(태블릿)에서는 2.5rem, 휴대폰 1rem
				'tablet:[&_footer_.footer]:px-10 tablet:[&_footer_.footer]:py-0 tablet:[&_header]:px-10 tablet:[&_header]:py-0 tablet:[&_main]:px-10 tablet:[&_main]:py-0',
				'mobile:[&_footer_.footer]:px-4 mobile:[&_header]:px-4 mobile:[&_main]:px-4',
			].join(' ')}
			style={{ '--header-height': headerHeight } as React.CSSProperties}
		>
			<a className="skip-link" href="#main">
				본문 바로가기
			</a>
			<Header />
			<main id="main" className="content mx-auto w-full max-w-[1024px]" tabIndex={-1}>
				{children}
			</main>
			<ScrollButtons />
			<LoginPopupBridge />
			<LoginParamNotice />
			<Footer contactEmail={contactEmail} />
		</div>
	);
}
