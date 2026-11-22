'use client';

import { lazy, Suspense } from 'react';
import { useTab } from '@/hooks/useTab';

import Skeleton from '@/components/common/loader/Skeleton';
// 첫 탭(받은 메일)은 바로: 따로 받으면 JS가 다 돈 뒤 이 코드를 또 받고 나서야 목록을 요청해 휴대폰 LCP가 늦었다.
// 서버가 첫 쪽을 미리 받아 두므로(page.tsx) 첫 HTML에 목록이 들어간다
import MySubscribe from '@/app/(protected)/mypage/_components/MySubscribe';
// 나머지 탭은 고를 때 받는다
const MyBookmark = lazy(() => import('@/app/(protected)/mypage/_components/MyBookmark'));
const MyHighlights = lazy(() => import('@/app/(protected)/mypage/_components/MyHighlights'));
const MySettings = lazy(() => import('@/app/(protected)/mypage/_components/MySettings'));
const MyFollows = lazy(() => import('@/app/(protected)/mypage/_components/MyFollows'));

function MyTabs() {
	const { activeTab } = useTab();

	return (
		<Suspense fallback={<Skeleton />}>
			<div className="tab-contents" role="tabpanel">
				{activeTab === 'subscriptions' && <MySubscribe />}
				{activeTab === 'bookmarks' && <MyBookmark />}
				{activeTab === 'highlights' && <MyHighlights />}
				{activeTab === 'follows' && <MyFollows />}
				{activeTab === 'settings' && <MySettings />}
			</div>
		</Suspense>
	);
}

export default MyTabs;
