import React, { Fragment, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { NAVIGATION } from '@/constants/navigation';
import { CATEGORIES } from '@/constants/categories';
import { useDropdown } from '@/hooks/useDropdown';

import styled from 'styled-components';
import Dropdown from '@/components/common/Dropdown';

/**
 * 태블릿 · 휴대폰 메뉴: 머리글 아래로 펼쳐지는 목록, 뒤는 어둡게.
 * 지금 보는 메뉴는 강조색. 화면 모드 단추는 로그인 전에도 머리글에 있어 여기엔 두지 않는다
 */
/** 분야 줄은 '뉴스레터' 바로 아래 끼어들므로, 그 뒤 메뉴의 화면 순서는 분야 수만큼 밀린다 */
const SUB_AT = NAVIGATION.findIndex((item) => item.link === '/articles');
const lineOf = (i: number) => (i > SUB_AT ? i + CATEGORIES.length : i);

const Drawer = () => {
	const pathname = usePathname();

	// 펼친 메뉴는 머리글 바로 아래에: 머리글 높이를 --np-header-h로 알린다 (글자 크기 등으로 바뀌면 다시)
	useEffect(() => {
		const header = document.querySelector('header');
		if (!header) return;
		const root = document.documentElement;
		const observer = new ResizeObserver(() => root.style.setProperty('--np-header-h', `${header.offsetHeight}px`));
		observer.observe(header);
		return () => observer.disconnect();
	}, []);

	return (
		<Dropdown
			type="drawer"
			className="drawer"
			label="메뉴"
			toggleButton={
				<StyledDrawerButton>
					<span></span>
					<span></span>
					<span></span>
				</StyledDrawerButton>
			}
		>
			{/* 줄(메뉴 · 분야)마다 --i(화면 순서) · nav에 --n(줄 수): 펼칠 때는 위부터, 접을 때는 아래부터 한 줄씩 (Dropdown의 drawer 스타일) */}
			<nav aria-label="메뉴" style={{ '--n': NAVIGATION.length + CATEGORIES.length } as React.CSSProperties}>
				{NAVIGATION.map((item, i) => (
					<Fragment key={item.id}>
						<div className="row" style={{ '--i': lineOf(i) } as React.CSSProperties}>
							<div className="row-body">
								<Link
									href={item.link}
									className="item"
									aria-current={pathname.startsWith(item.link) ? 'page' : undefined}
								>
									{item.title}
								</Link>
							</div>
						</div>
						{/* 뉴스레터 아래 분야: 메뉴에서 바로 그 분야 목록으로 (주소의 분야를 읽어서 Suspense 안에) */}
						{item.link === '/articles' && (
							<Suspense fallback={<DrawerCategories active={null} base={lineOf(i) + 1} />}>
								<CurrentCategory base={lineOf(i) + 1} />
							</Suspense>
						)}
					</Fragment>
				))}
			</nav>
		</Dropdown>
	);
};

/** 지금 보는 분야 (뉴스레터 목록에 있을 때만) */
function CurrentCategory({ base }: { base: number }) {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	return (
		<DrawerCategories
			active={pathname === '/articles' ? Number(searchParams.get('categoryId')) || 0 : null}
			base={base}
		/>
	);
}

/** 분야 칩: 누르면 그 분야 목록으로 가며 메뉴를 닫는다 (같은 /articles 안에서 옮기면 주소 경로가 같아 저절로 닫히지 않는다) */
function DrawerCategories({ active, base }: { active: number | null; base: number }) {
	const { closeDropdown } = useDropdown('drawer');
	return (
		<ul className="categories" aria-label="분야">
			{CATEGORIES.map((c, i) => (
				<li key={c.id} className="row" style={{ '--i': base + i } as React.CSSProperties}>
					<div className="row-body">
						<Link
							href={c.id ? `/articles?categoryId=${c.id}` : '/articles'}
							className="category"
							aria-current={active === c.id ? 'page' : undefined}
							onClick={closeDropdown}
						>
							{c.name}
						</Link>
					</div>
				</li>
			))}
		</ul>
	);
}

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
