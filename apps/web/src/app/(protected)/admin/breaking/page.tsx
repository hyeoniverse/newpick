import type { Metadata } from 'next';
import BreakingAdmin from '@/app/(protected)/admin/_components/BreakingAdmin';

export const metadata: Metadata = {
	title: '관리자 · 속보',
	robots: { index: false, follow: false },
};

/** 관리자: 속보 후보 확인 (승인 · 기각) */
export default function Page() {
	return <BreakingAdmin />;
}
