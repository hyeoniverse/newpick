import type { Metadata } from 'next';
import { Suspense } from 'react';
import TagsAdmin from '@/app/(protected)/admin/_components/TagsAdmin';

export const metadata: Metadata = {
	title: '관리자 · 태그',
	robots: { index: false, follow: false },
};

/** 관리자: 태그 정돈 (#20) — 합치기 · 이름 바꾸기 · 지우기, 규칙. 주소를 읽으므로 Suspense 안에 */
export default function Page() {
	return (
		<Suspense fallback={null}>
			<TagsAdmin />
		</Suspense>
	);
}
