'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef } from 'react';

import { SCROLL } from '@/constants/numbers';
import { useAuth } from '@/hooks/useAuth';
import { useDropdown } from '@/hooks/useDropdown';
import { useHeader } from '@/hooks/useHeader';
import { useOpenLogin } from '@/hooks/useOpenLogin';

import styled from 'styled-components';
import { IoLogoGoogle } from 'react-icons/io';

import Logo from '@/components/common/Logo';
import Imgae from '@/components/common/Image';
import Button from '@/components/common/Button';
import Dropdown from '@/components/common/Dropdown';
import Navigation from '@/components/layout/header/Navigation';
import Drawer from '@/components/layout/header/Drawer';
import ThemeSwitcher from '@/components/layout/header/ThemeSwitcher';
import AvatarPlaceholder from '@/components/common/AvatarPlaceholder';

export default function Header() {
	const { user, session, handleLogout } = useAuth();
	const openLogin = useOpenLogin();
	const { isHeaderOpen, setHeaderOpen } = useHeader();
	const { closeDropdown } = useDropdown(['auth', 'drawer']);
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
					{/* unknown: 표시 쿠키를 읽기 전에는 둘 다 그려 두고 <html data-auth>에 맞춰 CSS로 하나만 보여 줍니다. */}
					{session !== 'out' &&
						(user ? (
							<Dropdown
								type="auth"
								className="auth"
								label="내 계정 메뉴"
								toggleButton={
									user.profileImg ? (
										<StyledUserCircle>
											<Imgae src={user.profileImg} alt="" ratio="square" />
										</StyledUserCircle>
									) : (
										<StyledUserCircle>
											<AvatarPlaceholder />
										</StyledUserCircle>
									)
								}
							>
								<>
									<ThemeSwitcher className="item" />
									<Link href="/mypage">
										<Button as="span" className="item">
											마이페이지
										</Button>
									</Link>
									{/* 관리자에게만 보이는 진입점 (#73). 실제 권한은 API가 지킨다 */}
									{user.role === 'admin' && (
										<Link href="/admin">
											<Button as="span" className="item">
												관리자
											</Button>
										</Link>
									)}
									<Button className="item" onClick={handleLogout}>
										로그아웃
									</Button>
								</>
							</Dropdown>
						) : (
							// 사용자 정보를 조회하는 동안 프로필 사진 자리에 사람 모양(머리·어깨)을 채워 둡니다.
							// 아이콘을 보여 주면 사진이 없는 사람처럼 보였다
							<StyledUserCircle className="auth-in">
								<AvatarPlaceholder loading />
							</StyledUserCircle>
						))}
					{session !== 'in' && (
						<div className="auth-out">
							<ThemeSwitcher scheme="secondary" className="item" />
							<Button scheme="outline" onClick={() => openLogin()} icon={<IoLogoGoogle />} iconPosition="left">
								로그인
							</Button>
						</div>
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
	transition:
		top 0.3s ease,
		transform 0.3s ease;

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

		.auth-out {
			display: flex;
			align-items: center;
			gap: 0.5rem;
		}
	}

	html[data-auth='in'] & .auth-out,
	html[data-auth='out'] & .auth-in {
		display: none;
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
