'use client';

import { lazy, Suspense } from 'react';
import { MYPAGE_NAVIGATION } from '@/constants/navigation';

import styled from 'styled-components';
import withAuth from '@/hoc/withAuth';
import Skeleton from '@/components/common/loader/Skeleton';
import Title from '@/components/common/Title';
import MyProfile from '@/app/(protected)/mypage/_components/MyProfile';
import TabNavigation from '@/components/common/TabNavgation';
import { useTab } from '@/hooks/useTab';

// React.lazy를 활용한 동적 import
const MySubscribe = lazy(() => import('@/app/(protected)/mypage/_components/MySubscribe'));
const MyBookmark = lazy(() => import('@/app/(protected)/mypage/_components/MyBookmark'));
const MySettings = lazy(() => import('@/app/(protected)/mypage/_components/MySettings'));

export default withAuth(function MyPage() {
	const { activeTab } = useTab();

	return (
		<StyledPage>
			<Title size="extraSmall">마이페이지</Title>
			<br />
			<MyProfile />
			<TabNavigation tabs={MYPAGE_NAVIGATION} />
			<Suspense fallback={<Skeleton />}>
				<div className="tab-contents">
					{activeTab === 'subscriptions' && <MySubscribe />}
					{activeTab === 'bookmarks' && <MyBookmark />}
					{activeTab === 'settings' && <MySettings />}
				</div>
			</Suspense>
		</StyledPage>
	);
});

const StyledPage = styled.div`
	margin-top: 1rem;
	margin-bottom: 10vh;

	.title {
		${({ theme }) => `
			font-size: ${theme.fontSize.large};
			font-weight: ${theme.fontWeight.medium};
		`}
		margin-bottom: 1.25rem;
	}
`;
