'use client';

import Link from 'next/link';
import { NAVIGATION } from '@/constants/navigation';
import { useAuth } from '@/hooks/useAuth';

import styled from 'styled-components';
import Button from '@/components/common/Button';
import Dropdown from '@/components/common/Dropdown';
import ThemeSwitcher from '@/components/layout/header/ThemeSwitcher';

const Drawer = () => {
	const { isAuthenticated } = useAuth();

	return (
		<Dropdown
			type="drawer"
			className="drawer"
			toggleButton={
				<StyledDrawerButton>
					<span></span>
					<span></span>
					<span></span>
				</StyledDrawerButton>
			}
		>
			{!isAuthenticated && <ThemeSwitcher className="item" />}
			{NAVIGATION.map((item, index) => (
				<div className="item" key={`drawer-${index}`}>
					<Button>
						<Link href={item.link}>{item.title}</Link>
					</Button>
					{item.subItems &&
						item.subItems.map((subItem, subIndex) => (
							<div className="sub-item" key={`sub-drawer-${subIndex}`}>
								<Button>
									<Link href={subItem.link}>{subItem.title}</Link>
								</Button>
							</div>
						))}
				</div>
			))}
		</Dropdown>
	);
};

const StyledDrawerButton = styled.div`
	width: 0;
	height: 0;
	visibility: hidden;
	transform-origin: center;
	transform: scaleX(0);
	transition: all 0.5s ease;
	cursor: pointer;

	span {
		position: absolute;
		width: 100%;
		height: 0.125rem;
		background: ${({ theme }) => theme.color.text};
		left: 0;
		border-radius: 0.2rem;
		transition: all 0.3s ease;
	}

	/* 기본 상태 */
	span:nth-of-type(1) {
		top: 0;
		transform: translateY(0) rotate(0);
	}

	span:nth-of-type(2) {
		top: 50%;
		opacity: 1;
		transform: translateY(-50%);
	}

	span:nth-of-type(3) {
		top: 100%;
		transform: translateY(-100%) rotate(0);
	}

	/* .open 클래스가 추가된 상태 */
	&.open {
		span:nth-of-type(1) {
			top: 50%;
			transform: translateY(-50%) rotate(45deg);
		}

		span:nth-of-type(2) {
			opacity: 0;
		}

		span:nth-of-type(3) {
			top: 50%;
			transform: translateY(-50%) rotate(-45deg);
		}
	}

	@media ${({ theme }) => theme.mediaQuery.tablet} {
		position: relative;
		visibility: visible;
		width: 1.25rem;
		height: 1.25rem;
		display: flex;
		transform: scaleX(1);
		align-items: center;
		justify-content: center;
		margin-right: 1rem;

		&::before {
			content: '';
			position: absolute;
			width: 3rem;
			height: 3rem;
			background: transparent;
			top: -0.8rem;
			left: -0.8rem;
			cursor: pointer;
		}
	}
`;

export default Drawer;
