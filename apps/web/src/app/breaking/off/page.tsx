import type { Metadata } from 'next';
import { Suspense } from 'react';
import BreakingOff from './_components/BreakingOff';

export const metadata: Metadata = { title: '속보 메일 받지 않기', robots: { index: false, follow: false } };

/** 속보 메일 아래 '속보만 받지 않기'로 오는 화면. 로그인 없이 메일의 토큰으로 속보 메일만 끈다 (매일 메일은 그대로) */
export default function BreakingOffPage() {
	return (
		<Suspense>
			<BreakingOff />
		</Suspense>
	);
}
