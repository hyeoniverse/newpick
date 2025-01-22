'use client';

import { useState, Suspense, lazy } from 'react';
import { useAuth } from '@/hooks/useAuth';

import styled from 'styled-components';
import Error from '@/components/common/Error';
import Loader from '@/components/common/Loader';

// ✅ React.lazy를 활용한 동적 import
const MyProfile = lazy(() => import('@/components/mypage/profile/MyProfile'));
const TabButton = lazy(() => import('@/components/mypage/TabButton'));
const MySubscribe = lazy(() => import('@/components/mypage/mySubscribe/MySubscribe'));
const MyBookmark = lazy(() => import('@/components/mypage/MyBookmark'));
const MyNewsletterSetting = lazy(() => import('@/components/mypage/MyNewsletterSetting'));

function Page() {
	const { user, isLoading } = useAuth();
	const [activeTab, setActiveTab] = useState('subscribe');

	return (
		<PageStyled>
			{isLoading ? (
				<Loader />
			) : !user ? (
				<Error type="unauthorized" />
			) : (
				<Suspense fallback={<Loader />}>
					<p className="title">마이페이지</p>
					<MyProfile />
					<TabButton activeTab={activeTab} setActiveTab={setActiveTab} />
					<div className="tab-contents">
						{activeTab === 'subscribe' && <MySubscribe />}
						{activeTab === 'bookmark' && <MyBookmark />}
						{activeTab === 'newsletterSetting' && <MyNewsletterSetting />}
					</div>
				</Suspense>
			)}
		</PageStyled>
	);
}

const PageStyled = styled.div`
	margin: 3rem 0 10rem 0;

	.title {
		font-size: ${({ theme }) => theme.fontSize.large};
		margin-bottom: 1.25rem;
		font-weight: ${({ theme }) => theme.fontWeight.medium};
	}
`;

export default Page;
