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

	useEffect(() => {
		setActiveTab(tabs[0].link);
	}, [setActiveTab, tabs]);

	const handleTabClick = (link: string) => {
		setActiveTab(link);
	};

	return (
		<TabNavigationStyled>
			{tabs.map(({ id, title, link }) => (
				<button key={id} className={activeTab === link ? 'active' : ''} onClick={() => handleTabClick(link)}>
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
			flex-wrap: wrap;
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
