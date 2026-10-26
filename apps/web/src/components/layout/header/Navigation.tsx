'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styled from 'styled-components';
import { NAVIGATION } from '@/constants/navigation';
import Button from '@/components/common/Button';

/** 분야는 기사 목록 위 분야 탭에서 고르므로 메뉴 아래 펼침 목록은 두지 않는다. 지금 보는 곳만 밑줄로 표시 */
const Navigation = () => {
	const pathname = usePathname();

	return (
		<StyledNavigation>
			<ul>
				{NAVIGATION.map((item) => (
					<li key={item.id} className={pathname.startsWith(item.link) ? 'current' : undefined}>
						<Link href={item.link} aria-current={pathname.startsWith(item.link) ? 'page' : undefined}>
							<Button>{item.title}</Button>
						</Link>
					</li>
				))}
			</ul>
		</StyledNavigation>
	);
};

const StyledNavigation = styled.nav`
	width: 100%;
	margin: 0 auto;
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;

	ul {
		display: flex;
		gap: 1rem;
		padding: 0;
		margin: 0;
		list-style: none;

		li {
			position: relative;
			padding: 0.5rem;
			cursor: pointer;
			font-size: ${({ theme }) => theme.fontSize.small};

			&:hover,
			&.current {
				box-shadow: inset 0 -2px ${({ theme }) => theme.color.primary};
			}
		}
	}
`;

export default Navigation;
