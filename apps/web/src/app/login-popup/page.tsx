import type { Metadata } from 'next';
import LoginPopupStart from './LoginPopupStart';

export const metadata: Metadata = { title: '로그인', robots: { index: false, follow: false } };

/** iframe 안 로그인용 팝업의 첫 화면. 표시를 남기고 바로 구글 로그인으로 넘어간다 (utils/loginPopup.ts) */
export default function LoginPopupPage() {
	return <LoginPopupStart />;
}
