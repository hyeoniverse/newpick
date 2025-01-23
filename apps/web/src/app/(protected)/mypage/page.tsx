'use client';

import { useState, lazy, Suspense } from 'react';
import styled from 'styled-components';
import withAuth from '@/hoc/withAuth';
import Skeleton from '@/components/common/loader/Skeleton';
import Title from '@/components/common/Title';

// React.lazy를 활용한 동적 import
const MyProfile = lazy(() => import('@/components/mypage/profile/MyProfile'));
const TabButton = lazy(() => import('@/components/mypage/TabButton'));
const MySubscribe = lazy(() => import('@/components/mypage/mySubscribe/MySubscribe'));
const MyBookmark = lazy(() => import('@/components/mypage/MyBookmark'));
const MyNewsletterSetting = lazy(() => import('@/components/mypage/MyNewsletterSetting'));

const DEFAULT_TAB = 'subscribe';

function MyPage() {
	const [activeTab, setActiveTab] = useState(DEFAULT_TAB);

	return (
		<PageStyled>
			<Title size="extraSmall">마이페이지</Title>
			<br />
			<MyProfile />
			<TabButton activeTab={activeTab} setActiveTab={setActiveTab} />
			<br />
			<Suspense fallback={<Skeleton />}>
				<div className="tab-contents">
					{activeTab === 'subscribe' && <MySubscribe />}
					{activeTab === 'bookmark' && <MyBookmark />}
					{activeTab === 'newsletterSetting' && <MyNewsletterSetting />}
				</div>
			</Suspense>
		</PageStyled>
	);
}

const PageStyled = styled.div`
	margin: 3rem 0 10rem 0;

	.title {
		${({ theme }) => `
			font-size: ${theme.fontSize.large};
			font-weight: ${theme.fontWeight.medium};
		`}
		margin-bottom: 1.25rem;
	}
`;

export default withAuth(MyPage);
