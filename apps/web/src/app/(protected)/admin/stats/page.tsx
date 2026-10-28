import type { Metadata } from 'next';
import { Suspense } from 'react';
import StatsAdmin from '@/app/(protected)/admin/_components/StatsAdmin';

export const metadata: Metadata = {
	title: '관리자 · 통계',
	robots: { index: false, follow: false },
};

/** 관리자 통계 (#122): 구독자 · AI 비용 · 발송 · 읽기 추이 */
export default function Page() {
	return (
		<Suspense fallback={null}>
			<StatsAdmin />
		</Suspense>
	);
}
