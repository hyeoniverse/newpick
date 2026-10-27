import type { Metadata } from 'next';
import AdminHome from './_components/AdminHome';

export const metadata: Metadata = {
	title: '관리자 | 뉴픽',
	robots: { index: false, follow: false },
};

/** 관리자 첫 화면: 운영 도구 모음 (#73). 로그인은 middleware, 관리자 확인은 화면(AdminGate)에서 */
export default function AdminPage() {
	return <AdminHome />;
}
