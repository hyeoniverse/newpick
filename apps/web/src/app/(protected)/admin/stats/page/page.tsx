import type { Metadata } from 'next';
import { Suspense } from 'react';
import PageStatsAdmin from '@/app/(protected)/admin/_components/PageStatsAdmin';

export const metadata: Metadata = {
	title: '관리자 · 머문 곳',
	robots: { index: false, follow: false },
};

/** 관리자 통계 (#131): 한 페이지의 구역별 머문 시간 · 히트맵 */
export default function Page() {
	return (
		<Suspense fallback={null}>
			<PageStatsAdmin />
		</Suspense>
	);
}
