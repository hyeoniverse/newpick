import type { Metadata } from 'next';
import { Suspense } from 'react';
import UsersAdmin from '@/app/(protected)/admin/_components/UsersAdmin';

export const metadata: Metadata = {
	title: '관리자 · 사용자',
	robots: { index: false, follow: false },
};

/** 관리자 CMS (#31): 사용자 — 이메일 · 이름 · 권한으로 찾기, 권한 바꾸기, 지우기 */
export default function Page() {
	return (
		<Suspense fallback={null}>
			<UsersAdmin />
		</Suspense>
	);
}
