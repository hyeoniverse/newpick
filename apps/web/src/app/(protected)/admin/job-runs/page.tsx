import type { Metadata } from 'next';
import { Suspense } from 'react';
import JobRunsList from '@/app/(protected)/admin/_components/JobRunsList';

export const metadata: Metadata = {
	title: '관리자 · 실행 기록',
	robots: { index: false, follow: false },
};

/** 관리자 상세: 예약 작업 실행 기록 (#21). 기간 · 쪽은 주소에서 읽으므로 Suspense 안에 */
export default function Page() {
	return (
		<Suspense fallback={null}>
			<JobRunsList />
		</Suspense>
	);
}
