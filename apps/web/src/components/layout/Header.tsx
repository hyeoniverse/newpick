'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { useModal } from '@/hooks/useModal';
import { useDropdown } from '@/hooks/useDropdown';
import { useHeader } from '@/hooks/useHeader';

import styled from 'styled-components';
import { FaUserCircle } from 'react-icons/fa';
import Logo from '@/components/common/Logo';
import Image from '@/components/common/Image';
import Button from '@/components/common/Button';
import Modal from '@/components/common/modal/Modal';
import Dropdown from '@/components/common/Dropdown';
import Navigation from '@/components/layout/header/Navigation';
import Drawer from '@/components/layout/header/Drawer';
import ThemeSwitcher from '@/components/layout/header/ThemeSwitcher';
import Spinner from '../common/Spinner';
import { IoLogoGoogle } from 'react-icons/io';

const Header = () => {
	const { user, login, logout, isLoading } = useAuth();
	const { isHeaderOpen, setHeaderOpen } = useHeader();
	const { closeDropdown } = useDropdown(['auth', 'sub-navigation', 'drawer']);
	const { isOpen, modalType, openModal, closeModal } = useModal();
	const lastScrollY = useRef(0);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			const handleScroll = () => {
				const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;

				if (currentScrollY <= 0) {
					setHeaderOpen(true);
					return;
				}

				if (currentScrollY > lastScrollY.current) {
					setHeaderOpen(false);
					closeDropdown();
				} else {
					setHeaderOpen(true);
				}

				lastScrollY.current = currentScrollY;
			};

			window.addEventListener('scroll', handleScroll);
			return () => window.removeEventListener('scroll', handleScroll);
		}
	}, [setHeaderOpen, closeDropdown]);

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
					<ThemeSwitcher scheme="secondary" className={user ? 'hidden' : 'mobile-hidden'} />
					{isLoading ? (
						<Spinner size="2.5rem" />
					) : user ? (
						<Dropdown
							type="auth"
							className="auth"
							toggleButton={
								user.profileImg ? (
									<StyledUserCircle>
										<Image src={user.profileImg} alt="profile" ratio="square" />
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
									<Button className="item">내 정보</Button>
								</Link>
								<Button className="item" onClick={logout}>
									로그아웃
								</Button>
							</>
						</Dropdown>
					) : (
						<>
							<Button
								scheme="outline"
								style={{ width: '5rem' }}
								onClick={login}
								icon={<IoLogoGoogle />}
								iconPosition="left"
								disabled={user !== null}
							>
								로그인
							</Button>
							<Button scheme="primary" style={{ width: '5rem' }} onClick={() => openModal('subscribe')}>
								구독하기
							</Button>
						</>
					)}
				</div>
			</div>
			{isOpen && modalType === 'subscribe' && (
				<Modal isOpen={isOpen} onClose={closeModal}>
					<div>구독하기 모달 내용</div>
				</Modal>
			)}
		</StyledHeader>
	);
};

interface StyledProps {
	$isFolded: boolean;
}

const StyledHeader = styled.header<StyledProps>`
	position: fixed;
	top: ${({ $isFolded }) => ($isFolded ? '0' : '-3rem')};
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

export default Header;
