'use client';

import { lazy, Suspense } from 'react';
import { useTab } from '@/hooks/useTab';

import Skeleton from '@/components/common/loader/Skeleton';
// React.lazy를 활용한 동적 import
const MySubscribe = lazy(() => import('@/app/(protected)/mypage/_components/MySubscribe'));
const MyBookmark = lazy(() => import('@/app/(protected)/mypage/_components/MyBookmark'));
const MySettings = lazy(() => import('@/app/(protected)/mypage/_components/MySettings'));

interface Props {
	status: boolean;
	interests: string[];
}

function MyTabs({ status, interests }: Props) {
	const { activeTab } = useTab();

	return (
		<Suspense fallback={<Skeleton />}>
			<div className="tab-contents">
				{activeTab === 'subscriptions' && <MySubscribe status={status} />}
				{activeTab === 'bookmarks' && <MyBookmark />}
				{activeTab === 'settings' && <MySettings status={status} interests={interests} />}
			</div>
		</Suspense>
	);
}

export default MyTabs;
