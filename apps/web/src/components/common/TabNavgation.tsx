'use client';

import { NavigationItem as INavigationItem } from '@/models/navigation.model';
import useTabStore from '@/stores/useTabStore';
import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import styled from 'styled-components';

interface Props {
	tabs: INavigationItem[];
}

/** 주소의 ?tab=을 읽으므로 Suspense 안에서 (정적 페이지에서도 쓰이게) */
export default function TabNavigation(props: Props) {
	return (
		<Suspense fallback={null}>
			<Tabs {...props} />
		</Suspense>
	);
}

function Tabs({ tabs }: Props) {
	const { activeTab, setActiveTab } = useTabStore();
	const fromUrl = useSearchParams().get('tab');

	// 주소의 ?tab=(예: 수신 거부 화면의 '마이페이지에서 해지' → ?tab=settings, 스크랩 알림의 '모아 보기' → ?tab=highlights)을 따르고,
	// 없으면 첫 탭 (#17). window.location이 아니라 라우터 값으로 읽는다: 다른 화면에서 링크로 올 때는
	// 이 효과가 도는 순간 주소창이 아직 바뀌지 않아 첫 탭으로 떨어졌다
	useEffect(() => {
		setActiveTab(tabs.some((tab) => tab.link === fromUrl) ? fromUrl! : tabs[0].link);
	}, [fromUrl, setActiveTab, tabs]);

	// 고른 탭을 주소에도 남겨, 새로 고침 · 뒤로 와도 같은 탭 (기록은 쌓지 않음). 첫 탭이면 주소를 깨끗하게(?tab= 없이)
	useEffect(() => {
		const url = new URL(window.location.href);
		const wanted = activeTab === tabs[0].link ? null : activeTab;
		if (url.searchParams.get('tab') === wanted) return;
		if (wanted) url.searchParams.set('tab', wanted);
		else url.searchParams.delete('tab');
		window.history.replaceState(window.history.state, '', url);
	}, [activeTab, tabs]);

	return (
		<TabNavigationStyled role="tablist">
			{tabs.map(({ id, title, link }) => (
				<button
					key={id}
					type="button"
					role="tab"
					aria-selected={activeTab === link}
					className={activeTab === link ? 'active' : ''}
					onClick={() => setActiveTab(link)}
				>
					<span>{title}</span>
				</button>
			))}
		</TabNavigationStyled>
	);
}

const TabNavigationStyled = styled.div`
	height: 100%;
	margin: 60px 0 40px 0;
	border-bottom: 1px solid ${({ theme }) => theme.color.border};

	display: flex;
	flex-direction: row;
	justify-content: flex-start;

	button {
		cursor: pointer;
		padding: 1rem 0;
		width: calc(100% / 3);
		background-color: transparent;
		color: ${({ theme }) => theme.color.lightGrey};
		font-size: ${({ theme }) => theme.fontSize.small};
		margin-bottom: -1px;
		border-bottom: 1px solid transparent;
		transition:
			border-bottom 0.2s ease,
			color 0.2s ease;

		span {
			height: 100%;
			display: flex;
			justify-content: center;
			align-items: center;
			white-space: nowrap;
		}

		&.active {
			font-weight: ${({ theme }) => theme.fontWeight.regular};
			color: ${({ theme }) => theme.color.text};
			box-shadow: inset 0 -2px 0 ${({ theme }) => theme.color.text};
		}

		&:hover {
			color: ${({ theme }) => theme.color.text};
		}
	}
`;
