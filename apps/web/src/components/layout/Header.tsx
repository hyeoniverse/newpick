'use client';

import { ACTIONS } from '@/copy';

import { ROUTES } from '@/constants/routes';
import Link from 'next/link';
import { Suspense, useCallback, useEffect, useRef } from 'react';

import { SCROLL } from '@/constants/numbers';
import { useAuth } from '@/hooks/useAuth';
import { useDropdown } from '@/hooks/useDropdown';
import { useHeader } from '@/hooks/useHeader';
import { useOpenLogin } from '@/hooks/useOpenLogin';

import { cx } from '@/styles/tw';
import { IoLogoGoogle } from 'react-icons/io';

import Logo from '@/components/common/Logo';
import Imgae from '@/components/common/Image';
import Button from '@/components/common/Button';
import Dropdown from '@/components/common/Dropdown';
import Navigation from '@/components/layout/header/Navigation';
import Drawer from '@/components/layout/header/Drawer';
import ThemeSwitcher from '@/components/layout/header/ThemeSwitcher';
import { useUnseenFollows } from '@/hooks/useFollows';
import AvatarPlaceholder from '@/components/common/AvatarPlaceholder';
import HeaderSearch, { HeaderSearchFallback } from '@/components/layout/header/HeaderSearch';

/* 프로필 원 (사진은 overflow: hidden. 새 후속 소식 점은 원 바깥 칸에) */
const USER_CIRCLE = 'relative flex size-10 items-center justify-center overflow-hidden rounded-[50%]';
/* 표시 쿠키를 읽기 전에는 둘 다 그려 두고 <html data-auth>에 맞춰 하나만 보여 준다 */
const AUTH_IN = "[html[data-auth='out']_&]:hidden";
const AUTH_OUT = "[html[data-auth='in']_&]:hidden";

export default function Header() {
	const { user, session, handleLogout } = useAuth();
	// 후속 지켜보기: 아직 안 본 후속 소식 (프로필에 점 · 메뉴에 개수)
	const { data: unseenFollows = 0 } = useUnseenFollows();
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
		<header
			className={cx(
				'fixed left-0 z-[1000] m-0 w-full border-0 border-b border-solid border-border bg-background p-0 [transition:top_0.3s_ease,transform_0.3s_ease]',
				isHeaderOpen ? 'top-0' : 'top-[-2.98rem]',
			)}
		>
			<div className="header relative z-[1000] mx-auto flex w-full max-w-[1024px] flex-1 flex-row items-center justify-between gap-4 bg-background">
				<div className="left-section relative left-0 flex h-full w-fit flex-row items-center justify-start">
					<Drawer />
					<Logo />
				</div>
				<div className="center-section relative left-0 flex h-full w-fit flex-row items-center justify-center tablet:invisible tablet:w-0">
					<Navigation />
				</div>
				<div className="right-section relative right-0 flex h-full w-fit flex-1 flex-row items-center justify-end gap-2">
					{/* 지난 뉴스레터 검색 (#20). 주소(?q=)를 읽으므로 Suspense 안에 */}
					<Suspense fallback={<HeaderSearchFallback />}>
						<HeaderSearch />
					</Suspense>
					{/* unknown: 표시 쿠키를 읽기 전에는 둘 다 그려 두고 <html data-auth>에 맞춰 CSS로 하나만 보여 줍니다. */}
					{session !== 'out' &&
						(user ? (
							<Dropdown
								type="auth"
								className="auth"
								label="내 계정 메뉴"
								toggleButton={
									<span className="relative inline-flex">
										<span className={USER_CIRCLE}>
											{user.profileImg ? <Imgae src={user.profileImg} alt="" ratio="square" /> : <AvatarPlaceholder />}
										</span>
										{unseenFollows > 0 && (
											<span
												className="follow-dot absolute top-0 right-0 size-2.5 rounded-[50%] border-2 border-solid border-background bg-primary"
												role="status"
												aria-label={`새 후속 소식 ${unseenFollows}건`}
											/>
										)}
									</span>
								}
							>
								<>
									<ThemeSwitcher className="item" />
									<Link href={ROUTES.mypage()}>
										<Button as="span" className="item">
											마이페이지
										</Button>
									</Link>
									{unseenFollows > 0 && (
										<Link href={ROUTES.mypage('follows')}>
											<Button as="span" className="item">
												새 후속 소식 {unseenFollows}
											</Button>
										</Link>
									)}
									{/* 관리자에게만 보이는 진입점 (#73). 실제 권한은 API가 지킨다 */}
									{user.role === 'admin' && (
										<Link href={ROUTES.admin.home}>
											<Button as="span" className="item">
												관리자
											</Button>
										</Link>
									)}
									<Button className="item" onClick={handleLogout}>
										{ACTIONS.logout}
									</Button>
								</>
							</Dropdown>
						) : (
							// 사용자 정보를 조회하는 동안 프로필 사진 자리에 사람 모양(머리·어깨)을 채워 둡니다.
							// 아이콘을 보여 주면 사진이 없는 사람처럼 보였다
							<span className={cx(USER_CIRCLE, 'auth-in', AUTH_IN)}>
								<AvatarPlaceholder loading />
							</span>
						))}
					{session !== 'in' && (
						<div className={cx('auth-out flex items-center gap-2', AUTH_OUT)}>
							<ThemeSwitcher scheme="secondary" className="item" />
							<Button scheme="outline" onClick={() => openLogin()} icon={<IoLogoGoogle />} iconPosition="left">
								{ACTIONS.login}
							</Button>
						</div>
					)}
				</div>
			</div>
		</header>
	);
}
