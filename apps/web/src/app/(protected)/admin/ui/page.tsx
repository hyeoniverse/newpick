import type { Metadata } from 'next';
import DesignSystem from './_components/DesignSystem';

export const metadata: Metadata = {
	title: '디자인 시스템 (관리자)',
	robots: { index: false, follow: false },
};

/** 관리자: 디자인 시스템(테마 값·공통 컴포넌트) 확인 화면. 로그인은 middleware, 관리자 확인은 화면에서 */
export default function DesignSystemPage() {
	return <DesignSystem />;
}
