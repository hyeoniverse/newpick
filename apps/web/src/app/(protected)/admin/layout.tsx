import { fetchProfileOnServer } from '@/api/serverProfile';
import { InitialProfileProvider } from '@/components/common/auth/InitialProfile';

/**
 * 관리자 화면 공통: 프로필(관리자 여부)을 서버에서 받아 첫 HTML부터 화면을 그린다.
 * 예전에는 브라우저가 프로필을 받을 때까지 화면 전체가 스피너였다가 통째로 바뀌어, 내용이 늦게 보이고(LCP)
 * 아래가 크게 밀렸다(CLS 0.16~1.07). 쿠키를 읽어 요청마다 그리며(동적) Next가 private, no-store를 붙인다.
 * 서버에서 못 받으면(늦음 · 거절) null → 예전처럼 브라우저가 받을 때까지 스피너
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	const profile = await fetchProfileOnServer();
	return <InitialProfileProvider profile={profile}>{children}</InitialProfileProvider>;
}
