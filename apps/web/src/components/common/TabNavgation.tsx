'use client';

import { NavigationItem as INavigationItem } from '@/models/navigation.model';
import useTabStore from '@/stores/useTabStore';
import { useEffect } from 'react';
import styled from 'styled-components';

interface Props {
	tabs: INavigationItem[];
}

export default function TabNavigation({ tabs }: Props) {
	const { activeTab, setActiveTab } = useTabStore();

	// 처음엔 주소의 ?tab=(예: 수신 거부 화면의 '마이페이지에서 해지' → ?tab=settings)을 따르고, 없으면 첫 탭 (#17)
	useEffect(() => {
		const fromUrl = new URLSearchParams(window.location.search).get('tab');
		setActiveTab(tabs.some((tab) => tab.link === fromUrl) ? fromUrl! : tabs[0].link);
	}, [setActiveTab, tabs]);

	// 고른 탭을 주소에도 남겨, 새로 고침 · 뒤로 와도 같은 탭 (기록은 쌓지 않음)
	useEffect(() => {
		const url = new URL(window.location.href);
		if (url.searchParams.get('tab') === activeTab) return;
		url.searchParams.set('tab', activeTab);
		window.history.replaceState(window.history.state, '', url);
	}, [activeTab]);

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
		transition: border-bottom 0.2s ease, color 0.2s ease;

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
