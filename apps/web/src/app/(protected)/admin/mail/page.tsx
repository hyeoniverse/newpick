import type { Metadata } from 'next';
import { Suspense } from 'react';
import MailList from '@/app/(protected)/admin/_components/MailList';

export const metadata: Metadata = {
	title: '관리자 · 발송 기록',
	robots: { index: false, follow: false },
};

/** 관리자 상세: 발송 기록 (#21). 기간 · 쪽은 주소에서 읽으므로 Suspense 안에 */
export default function Page() {
	return (
		<Suspense fallback={null}>
			<MailList />
		</Suspense>
	);
}
