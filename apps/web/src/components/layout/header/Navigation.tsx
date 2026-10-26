'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useHeader } from '@/hooks/useHeader';
import styled from 'styled-components';
import { NAVIGATION } from '@/constants/navigation';
import Button from '@/components/common/Button';

/** 메뉴에서 마우스가 벗어나도 이만큼 기다렸다 닫는다. 아래 메뉴로 내려가는 사이에 닫히지 않게 */
const CLOSE_DELAY = 250;

const Navigation = () => {
	const { setSubOpen } = useHeader();
	// 열린 메뉴 (하위 메뉴가 있는 것만). 예전에는 CSS :hover로만 열어,
	// 메뉴와 아래 메뉴 사이 빈 틈을 지나는 순간 닫혔다
	const [openIndex, setOpenIndex] = useState<number | null>(null);
	const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

	const open = (index: number) => {
		clearTimeout(closeTimer.current);
		setOpenIndex(NAVIGATION[index].subItems ? index : null);
	};
	const closeSoon = () => {
		clearTimeout(closeTimer.current);
		closeTimer.current = setTimeout(() => setOpenIndex(null), CLOSE_DELAY);
	};
	const closeNow = () => {
		clearTimeout(closeTimer.current);
		setOpenIndex(null);
	};

	// 헤더 높이(아래 메뉴 자리)를 같이 맞춘다
	useEffect(() => {
		setSubOpen(openIndex !== null);
	}, [openIndex, setSubOpen]);

	useEffect(() => () => clearTimeout(closeTimer.current), []);

	return (
		<StyledNavigation>
			<ul>
				{NAVIGATION.map((item, index) => {
					return (
						<li
							key={index}
							className={openIndex === index ? 'open' : undefined}
							onMouseEnter={() => open(index)}
							onMouseLeave={closeSoon}
							// 키보드: 메뉴나 아래 메뉴에 초점이 있는 동안 열어 둔다
							onFocus={() => open(index)}
							onBlur={(e) => {
								if (!e.currentTarget.contains(e.relatedTarget as Node)) closeSoon();
							}}
							onKeyDown={(e) => e.key === 'Escape' && closeNow()}
							onClick={closeNow}
						>
							<Link href={item.link}>
								<Button>{item.title}</Button>
							</Link>

							{item.subItems && (
								<div className="sub-navigation">
									<div className="panel">
										{item.subItems.map((subItem, subIndex) => (
											<Link href={subItem.link} key={subIndex} className="item">
												<Button>{subItem.title}</Button>
											</Link>
										))}
									</div>
								</div>
							)}
						</li>
					);
				})}
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
			&.open {
				box-shadow: inset 0 -2px ${({ theme }) => theme.color.primary};
			}

			/* 메뉴 아래부터 헤더 아래까지의 빈 틈을 덮는 보이지 않는 다리: 내려가는 동안 메뉴 위에 있는 것으로 친다 */
			&.open::after {
				content: '';
				position: absolute;
				top: 100%;
				left: -1rem;
				right: -1rem;
				height: 1rem;
			}

			&.open .sub-navigation {
				opacity: 1;
				transform: scaleY(1);
				pointer-events: all;
			}

			.sub-navigation {
				width: 100vw;
				position: fixed;
				top: 3rem;
				left: 0;
				z-index: 1000;

				display: flex;
				flex-direction: row;
				justify-content: center;
				align-items: center;
				padding: 0 1rem;

				background: ${({ theme }) => theme.color.surface};
				border-top: 1px solid ${({ theme }) => theme.color.border};
				box-shadow: ${({ theme }) => theme.shadow.light};
				transform-origin: top;
				opacity: 0;
				transform: scaleY(0);
				transition: all 0.3s ease;
				pointer-events: none;

				.panel {
					width: 100%;
					max-width: ${({ theme }) => theme.layout.width.large};

					display: flex;
					flex-direction: row;
					justify-content: flex-start;
					align-items: center;
					margin: 0 auto;
				}

				.item {
					width: clamp(1.5rem, 3.5rem, 7rem);
					display: flex;
					justify-content: center;
					align-items: center;

					padding: 0.5rem 1rem;
					margin: 0;
					text-decoration: none;
				}
			}
		}
	}
`;

export default Navigation;
