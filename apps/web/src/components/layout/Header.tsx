'use clinet';

import Link from 'next/link';
import { useCallback, useEffect, useRef } from 'react';

import { SCROLL } from '@/constants/numbers';
import { useAuth } from '@/hooks/useAuth';
import { useDropdown } from '@/hooks/useDropdown';
import { useHeader } from '@/hooks/useHeader';

import styled from 'styled-components';
import { FaUserCircle } from 'react-icons/fa';
import { IoLogoGoogle } from 'react-icons/io';

import Logo from '@/components/common/Logo';
import Imgae from '@/components/common/Image';
import Button from '@/components/common/Button';
import Dropdown from '@/components/common/Dropdown';
import Spinner from '@/components/common/loader/Spinner';
import Navigation from '@/components/layout/header/Navigation';
import Drawer from '@/components/layout/header/Drawer';
import ThemeSwitcher from '@/components/layout/header/ThemeSwitcher';

export default function Header() {
	const { user, isLoading, handleLogin, handleLogout } = useAuth();
	const { isHeaderOpen, setHeaderOpen } = useHeader();
	const { closeDropdown } = useDropdown(['auth', 'sub-navigation', 'drawer']);
	const lastScrollY = useRef(0);

	const handleScroll = useCallback(() => {
		const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;
		const documentHeight = document.documentElement.scrollHeight;
		const windowHeight = window.innerHeight;

		// 스크롤이 부족한 경우 항상 헤더 표시
		if (documentHeight <= windowHeight) {
			setHeaderOpen(true);
			return;
		}

		// 페이지 맨 위에서 항상 헤더 표시
		if (currentScrollY <= 0) {
			setHeaderOpen(true);
			return;
		}

		// 빠른 스크롤 대응: THRESHOLD(10px) 이상의 변화가 있을 때만 감지
		if (Math.abs(currentScrollY - lastScrollY.current) > SCROLL.THRESHOLD) {
			if (currentScrollY > lastScrollY.current) {
				setHeaderOpen(false);
				closeDropdown();
			} else {
				setHeaderOpen(true);
			}
		}

		lastScrollY.current = currentScrollY;
	}, [setHeaderOpen, closeDropdown]);

	useEffect(() => {
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, [handleScroll]);

	return (
		<StyledHeader $isFolded={isHeaderOpen}>
			<div className="header">
				<div className="left-section">
					<Drawer />
					<Logo />
				</div>
				<div className="center-section">
					<Navigation />
				</div>
				<div className="right-section">
					{isLoading ? (
						<Spinner size="2.5rem" />
					) : user ? (
						<Dropdown
							type="auth"
							className="auth"
							toggleButton={
								user?.profileImg ? (
									<StyledUserCircle>
										<Imgae src={user.profileImg} alt="profile" ratio="square" />
									</StyledUserCircle>
								) : (
									<StyledUserCircle>
										<FaUserCircle />
									</StyledUserCircle>
								)
							}
						>
							<>
								<ThemeSwitcher className="item" />
								<Link href="/mypage">
									<Button className="item">마이페이지</Button>
								</Link>
								<Button className="item" onClick={handleLogout}>
									로그아웃
								</Button>
							</>
						</Dropdown>
					) : (
						<>
							<Button
								scheme="outline"
								onClick={handleLogin}
								icon={<IoLogoGoogle />}
								iconPosition="left"
								disabled={isLoading}
							>
								로그인
							</Button>
						</>
					)}
				</div>
			</div>
		</StyledHeader>
	);
}

interface StyledProps {
	$isFolded: boolean;
}

const StyledHeader = styled.header<StyledProps>`
	position: fixed;
	top: ${({ $isFolded }) => ($isFolded ? '0' : '-2.98rem')};
	left: 0;
	z-index: 1000;

	width: 100%;
	margin: 0;
	padding: 0;

	background: ${({ theme }) => theme.color.background};
	border-bottom: 1px solid ${({ theme }) => theme.color.border};
	transition: top 0.3s ease, transform 0.3s ease;

	.header {
		position: relative;
		background: ${({ theme }) => theme.color.background};
		z-index: 1000;

		display: flex;
		flex: 1;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;

		margin: 0 auto;
		gap: 1rem;

		width: 100%;
		max-width: ${({ theme }) => theme.layout.width.large};
	}

	.left-section {
		position: relative;
		left: 0;

		width: fit-content;
		height: 100%;
		display: flex;
		flex-direction: row;
		justify-content: flex-start;
		align-items: center;
	}

	.center-section {
		position: relative;
		left: 0;

		width: fit-content;
		height: 100%;
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			width: 0;
			visibility: hidden;
		}
	}

	.right-section {
		position: relative;
		right: 0;

		width: fit-content;
		height: 100%;
		display: flex;
		flex: 1;
		flex-direction: row;
		justify-content: flex-end;
		align-items: center;
		gap: 0.5rem;

		.userCircle {
			border-radius: ${({ theme }) => theme.borderRadius.circle};
			object-fit: cover;
		}
	}

	.hidden {
		width: 0;
		height: 0;
		visibility: hidden;
		transform: scaleX(0);
	}

	.mobile-hidden {
		@media ${({ theme }) => theme.mediaQuery.tablet} {
			width: 0;
			height: 0;
			visibility: hidden;
			transform: scaleX(0);
			padding: 0;
		}
	}

	.desktop-hidden {
		width: 0;
		height: 0;
		visibility: hidden;
		transform: scaleX(0);

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			width: fit-content;
			height: fit-content;
			visibility: visible;
			transform: scaleX(1);
		}
	}
`;

const StyledUserCircle = styled.div`
	position: relative;
	width: 2.5rem;
	height: 2.5rem;
	display: flex;
	justify-content: center;
	align-items: center;
	border-radius: 50%;
	overflow: hidden;
`;
