'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cx } from '@/styles/tw';
import { NAVIGATION } from '@/constants/navigation';
import Button from '@/components/common/Button';

/** 분야는 기사 목록 위 분야 탭에서 고르므로 메뉴 아래 펼침 목록은 두지 않는다. 지금 보는 곳만 밑줄로 표시 */
const Navigation = () => {
	const pathname = usePathname();

	return (
		<nav className="mx-auto flex w-full flex-row items-center justify-center">
			<ul className="m-0 flex list-none gap-4 p-0">
				{NAVIGATION.map((item) => (
					<li
						key={item.id}
						className={cx(
							'relative cursor-pointer p-2 text-small hover:shadow-[inset_0_-2px_var(--color-primary)]',
							pathname.startsWith(item.link) && 'current shadow-[inset_0_-2px_var(--color-primary)]',
						)}
					>
						<Link href={item.link} aria-current={pathname.startsWith(item.link) ? 'page' : undefined}>
							<Button as="span">{item.title}</Button>
						</Link>
					</li>
				))}
			</ul>
		</nav>
	);
};

export default Navigation;
