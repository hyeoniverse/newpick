import type { Metadata } from 'next';
import { Suspense } from 'react';
import PageStatsAdmin from '@/app/(protected)/admin/_components/PageStatsAdmin';

export const metadata: Metadata = {
	title: '관리자 · 히트맵',
	robots: { index: false, follow: false },
};

/** 관리자 통계 (#131): 한 페이지의 섹션별 체류 시간 · 히트맵 */
export default function Page() {
	return (
		<Suspense fallback={null}>
			<PageStatsAdmin />
		</Suspense>
	);
}
