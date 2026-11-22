import { ROUTES } from '@/constants/routes';
import React, { Fragment, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { NAVIGATION } from '@/constants/navigation';
import { CATEGORIES } from '@/constants/categories';
import { useDropdown } from '@/hooks/useDropdown';

import Dropdown from '@/components/common/Dropdown';

/**
 * 태블릿 · 휴대폰 메뉴: 머리글 아래로 펼쳐지는 목록, 뒤는 어둡게.
 * 지금 보는 메뉴는 강조색. 화면 모드 단추는 로그인 전에도 머리글에 있어 여기엔 두지 않는다
 */
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
			// 줄 수(--n): 패널이 접히는 전체 시간(마지막 줄까지)을 계산해 그때까지 보이게 둔다
			style={{ '--n': NAVIGATION.length + CATEGORIES.length } as React.CSSProperties}
			toggleButton={
				<div className="np-drawer-button">
					<span></span>
					<span></span>
					<span></span>
				</div>
			}
		>
			{/* 줄마다 --i(순서), 분야 줄은 --phase 1: 상위 메뉴가 위부터 한 줄씩 다 펼쳐진 뒤 분야가 한 줄씩. 접을 때는 거꾸로 (Dropdown의 drawer 스타일) */}
			<nav aria-label="메뉴">
				{NAVIGATION.map((item, i) => (
					<Fragment key={item.id}>
						<div className="row" style={{ '--i': i } as React.CSSProperties}>
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
						{item.link === ROUTES.articles && (
							<Suspense fallback={<DrawerCategories active={null} base={NAVIGATION.length} />}>
								<CurrentCategory base={NAVIGATION.length} />
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
			active={pathname === ROUTES.articles ? Number(searchParams.get('categoryId')) || 0 : null}
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
				<li key={c.id} className="row" style={{ '--i': base + i, '--phase': 1 } as React.CSSProperties}>
					<div className="row-body">
						<Link
							href={c.id ? ROUTES.articlesByCategory(c.id) : ROUTES.articles}
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

export default Drawer;
