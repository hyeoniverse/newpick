import type { Metadata } from 'next';
import { Suspense } from 'react';
import Unsubscribe from './Unsubscribe';

export const metadata: Metadata = { title: '수신 거부', robots: { index: false, follow: false } };

/** 메일 아래 '수신 거부'로 오는 화면 (#18). 로그인 없이 메일의 토큰으로 해지한다 */
export default function UnsubscribePage() {
	return (
		<Suspense>
			<Unsubscribe />
		</Suspense>
	);
}
