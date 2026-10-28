import type { Metadata } from 'next';
import { Suspense } from 'react';
import CategoriesAdmin from '@/app/(protected)/admin/_components/CategoriesAdmin';

export const metadata: Metadata = {
	title: '관리자 · 관심사',
	robots: { index: false, follow: false },
};

/** 관리자 CMS (#31): 관심사 현황 — 뉴스레터 · 고른 사람 · 구독 중 · 수집 기사 */
export default function Page() {
	return (
		<Suspense fallback={null}>
			<CategoriesAdmin />
		</Suspense>
	);
}
