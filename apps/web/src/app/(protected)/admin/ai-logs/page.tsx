import type { Metadata } from 'next';
import { Suspense } from 'react';
import AiLogsList from '@/app/(protected)/admin/_components/AiLogsList';

export const metadata: Metadata = {
	title: '관리자 · AI 기록',
	robots: { index: false, follow: false },
};

/** 관리자 상세: AI 기록 (#21). 기간 · 쪽은 주소에서 읽으므로 Suspense 안에 */
export default function Page() {
	return (
		<Suspense fallback={null}>
			<AiLogsList />
		</Suspense>
	);
}
