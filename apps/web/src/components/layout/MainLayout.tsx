'use client';

import { usePathname } from 'next/navigation';
import { useHeader } from '@/hooks/useHeader';
import BreakingBand from '@/components/common/Breaking';
import { ROUTES } from '@/constants/routes';
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
	const pathname = usePathname();
	const showBand = pathname !== ROUTES.home && !pathname.startsWith(ROUTES.admin.home);

	return (
		<div
			className={[
				'mx-auto flex h-screen w-full flex-col overflow-x-clip pt-[var(--header-height)] [transition:padding-top_0.3s_ease]',
				// 좌우 여백: 늘 2.5rem(휴대폰 1rem). 내용 폭(1024px)은 여백 안쪽이라, 1024px 근처 화면에서도 가장자리에 붙거나 잘리지 않는다
				'[&_footer_.footer]:px-10 [&_footer_.footer]:py-0 [&_header]:px-10 [&_header]:py-0 [&_main]:px-10 [&_main]:py-0',
				'mobile:[&_footer_.footer]:px-4 mobile:[&_header]:px-4 mobile:[&_main]:px-4',
			].join(' ')}
			style={{ '--header-height': headerHeight } as React.CSSProperties}
		>
			<a className="skip-link" href="#main">
				본문 바로가기
			</a>
			<Header />
			{/* 최대 폭 = 내용 1024px + 좌우 여백 */}
			<main id="main" className="content mx-auto w-full max-w-[calc(1024px+5rem)] mobile:max-w-none" tabIndex={-1}>
				{/* 속보: 메인 밖의 페이지에서도 맨 위에 (닫을 수 있음). 메인은 page.tsx가 늘 보이는 띠를 따로 둔다, 관리자 화면에는 없다 */}
				{showBand && <BreakingBand closable />}
				{children}
			</main>
			<ScrollButtons />
			<LoginPopupBridge />
			<LoginParamNotice />
			<Footer contactEmail={contactEmail} />
		</div>
	);
}
