'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import styled from 'styled-components';
import Logo from '@/components/common/Logo';
import Button from '@/components/common/Button';
import Navigation from '@/components/header/Navigation';
import Drawer from '@/components/header/Drawer';
import Dropdown from '@/components/common/Dropdown';
import ThemeSwitcher from '@/components/header/ThemeSwitcher';
import { FaUserCircle } from 'react-icons/fa';

const Header = () => {
	const [isLogin, setIsLogin] = useState(false);
	const user = null;

	const toggleLogin = () => {
		setIsLogin(!isLogin);
	};

	return (
		<StyledHeader>
			<div className="header">
				<div className="left-section">
					<Drawer />
					<Logo />
				</div>
				<Navigation />
				<div className="right-section">
					<ThemeSwitcher className="mobile-hidden" />
					{isLogin ? (
						<Dropdown
							className="auth"
							toggleButton={
								<>
									<Button>
										<FaUserCircle className="userCircle" />
									</Button>
								</>
							}
						>
							<>
								<ThemeSwitcher className="desktop-hidden" />
								<Link href="/myPage" className="item">
									마이 페이지
								</Link>
								<Button onClick={toggleLogin}>로그아웃</Button>
							</>
						</Dropdown>
					) : (
						<Button onClick={toggleLogin} style={{ width: '5rem' }}>
							로그인
						</Button>
					)}
					<Button scheme="outline" style={{ width: '5rem' }}>
						구독하기
					</Button>
				</div>
			</div>
		</StyledHeader>
	);
};

const StyledHeader = styled.div`
	width: 100%;
	padding: 0;
	margin: 0;

	-ms-overflow-style: none;
	::-webkit-scrollbar {
		display: none;
	}

	background: ${({ theme }) => theme.color.background};
	border-bottom: 1px solid ${({ theme }) => theme.color.border};

	.header {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;

		margin: 0 auto;
		padding: 0.5rem 1rem;
		gap: 1rem;

		width: 100%;
		max-width: ${({ theme }) => theme.layout.width.large};
	}

	.left-section {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 1rem;
	}

	.right-section {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 1rem;

		.userCircle {
			border-radius: ${({ theme }) => theme.borderRadius.circle};
			object-fit: cover;
		}
	}

	.mobile-hidden {
		@media ${({ theme }) => theme.mediaQuery.mobile} {
			display: none;
		}
	}

	.desktop-hidden {
		display: none;

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			display: block;
		}
	}
`;

export default Header;
