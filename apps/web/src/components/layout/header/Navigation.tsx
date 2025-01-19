import Link from 'next/link';
import { useEffect } from 'react';
import { useHeader } from '@/hooks/useHeader';
import styled from 'styled-components';
import { NAVIGATION } from '@/constants/navigation';
import Button from '@/components/common/Button';

const Navigation = () => {
	const { isSubOpen, setSubOpen } = useHeader();

	useEffect(() => {
		setSubOpen(isSubOpen);
	}, [isSubOpen, setSubOpen]);

	return (
		<StyledNavigation>
			<ul>
				{NAVIGATION.map((item, index) => {
					return (
						<li
							key={index}
							onMouseEnter={() => item.subItems && setSubOpen(true)}
							onMouseLeave={() => setSubOpen(false)}
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

			&:hover {
				box-shadow: inset 0 -2px ${({ theme }) => theme.color.primary};

				.sub-navigation {
					opacity: 1;
					transform: scaleY(1);
					pointer-events: all;
				}
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
