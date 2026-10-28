import type { Metadata } from 'next';
import { Suspense } from 'react';
import SubscribersAdmin from '@/app/(protected)/admin/_components/SubscribersAdmin';

export const metadata: Metadata = {
	title: '관리자 · 구독자',
	robots: { index: false, follow: false },
};

/** 관리자 CMS (#31): 구독자 — 구독 상태 · 관심사 · 이메일로 찾기 */
export default function Page() {
	return (
		<Suspense fallback={null}>
			<SubscribersAdmin />
		</Suspense>
	);
}
