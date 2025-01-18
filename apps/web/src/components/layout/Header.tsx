'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { usersData } from '@/mocks/mypage/users';

import { useAuth } from '@/hooks/useAuth';
import { useModal } from '@/hooks/useModal';
import { useDropdown } from '@/hooks/useDropdown';
import { useHeader } from '@/hooks/useHeader';

import styled from 'styled-components';
import { FaUserCircle } from 'react-icons/fa';
import Logo from '@/components/common/Logo';
import Button from '@/components/common/Button';
import Modal from '@/components/common/modal/Modal';
import Dropdown from '@/components/common/Dropdown';
import Navigation from '@/components/layout/header/Navigation';
import Drawer from '@/components/layout/header/Drawer';
import ThemeSwitcher from '@/components/layout/header/ThemeSwitcher';

const Header = () => {
	const { USER1 } = usersData;
	const { isAuthenticated, handleLogin, handleLogout } = useAuth();
	const { isHeaderOpen, setHeaderOpen } = useHeader();
	const { closeDropdown } = useDropdown(['auth', 'sub-navigation', 'drawer']);
	const { isOpen, modalType, openModal, closeModal } = useModal();
	const lastScrollY = useRef(0);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			const handleScroll = () => {
				const container = document.documentElement || document.body;
				const currentScrollY = window.scrollY || container.scrollTop || 0;
				const maxScrollY = container.scrollHeight - container.clientHeight;

				// 최상단이면 항상 헤더 보이게
				if (currentScrollY <= 0) {
					setHeaderOpen(true);
					return;
				}

				// 최하단이면 닫지 않음
				if (currentScrollY >= maxScrollY) {
					return;
				}

				// 일반 스크롤 처리
				if (currentScrollY > lastScrollY.current) {
					setHeaderOpen(false);
					closeDropdown();
				} else {
					setHeaderOpen(true);
				}

				lastScrollY.current = currentScrollY;
			};

			window.addEventListener('scroll', handleScroll);

			return () => {
				window.removeEventListener('scroll', handleScroll);
			};
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
					{/* {NAVIGATION.map((item, index) => (
						<div key={`header-nav-${index}`}>
							<Navigation items={[{ id: item.id, title: item.title, link: item.link }]} />
							{item.subItems && (
								<SubNavigation
									key={`header-sub-nav-${index}`}
									items={item.subItems}
									isActive={isHeaderOpen}
								/>
							)}
						</div>
					))} */}
				</div>
				<div className="right-section">
					<ThemeSwitcher scheme="secondary" className={isAuthenticated ? 'hidden' : 'mobile-hidden'} />
					{isAuthenticated ? (
						<Dropdown
							type="auth"
							className="auth"
							toggleButton={
								<Button>
									<FaUserCircle className="userCircle" />
								</Button>
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
								scheme="secondary"
								onClick={() =>
									handleLogin(
										{
											id: USER1.id,
											name: USER1.name,
											email: USER1.email,
										},
										'mock'
									)
								}
								style={{ width: '5rem' }}
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

export default Header;
