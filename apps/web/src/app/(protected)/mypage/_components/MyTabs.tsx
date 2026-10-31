'use client';

import { lazy, Suspense } from 'react';
import { useTab } from '@/hooks/useTab';

import Skeleton from '@/components/common/loader/Skeleton';
// React.lazy를 활용한 동적 import
const MySubscribe = lazy(() => import('@/app/(protected)/mypage/_components/MySubscribe'));
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
