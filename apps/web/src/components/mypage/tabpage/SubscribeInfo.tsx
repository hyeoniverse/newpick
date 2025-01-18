'use client';

import { useEffect, useRef, useState } from 'react';
import { useHeader } from '@/hooks/useHeader';
import useMypage from '@/hooks/useMypage';
import { currentUserData } from '@/mocks/mypage/currentUser';

import styled from 'styled-components';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';

interface SubscribeInfoProps {
	activeCategory: string;
}

function SubscribeInfo({ activeCategory }: SubscribeInfoProps) {
	const { headerHeight } = useHeader();
	const navRef = useRef<HTMLDivElement>(null);
	const lastScrollY = useRef(0);
	const [isSticky, setIsSticky] = useState(false);

	const { handleAnchorNavigation } = useMypage();
	const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
	const { summaries } = currentUserData;

	// 스크롤 방향 감지 및 상태 업데이트
	useEffect(() => {
		const handleScroll = () => {
			const currentScrollY = window.scrollY;

			// 특정 위치 이상 스크롤되면 Sticky 활성화
			setIsSticky(currentScrollY > 365);

			// 현재 스크롤 위치 저장
			lastScrollY.current = currentScrollY;
		};

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	return (
		<StyledSubscribeInfo
			ref={navRef}
			className={`${isSticky ? 'full-width' : ''}`}
			$isSticky={isSticky}
			$paddingTop={headerHeight}
		>
			<StyledContents>
				<div className="date">
					<IoIosArrowBack />
					<p>{today}</p>
					<IoIosArrowForward />
				</div>
				<ul className="categories">
					{summaries.map((news, index) => (
						<li key={index} className={`category ${activeCategory === news.categoryName ? 'active' : ''}`}>
							<button onClick={(e) => handleAnchorNavigation(e, news.categoryName)}>
								{news.categoryName}
							</button>
						</li>
					))}
				</ul>
			</StyledContents>
		</StyledSubscribeInfo>
	);
}

interface StyledProps {
	$isSticky: boolean;
	$paddingTop: string;
}

const StyledSubscribeInfo = styled.div<StyledProps>`
	width: 100%;
	position: sticky;
	top: 0;
	padding-top: ${({ $isSticky, $paddingTop }) => ($isSticky ? $paddingTop : '0')};
	margin-top: -40px;
	z-index: 999;

	display: flex;
	flex-direction: column;
	justify-content: flex-end;
	align-items: center;

	border-bottom: none;
	transition: all 0.2s ease;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		width: 100%;
		height: 100%;
		background-color: ${({ theme }) => theme.color.surface};
		border-bottom: 1px solid ${({ theme }) => theme.color.border};
		transform: translateX(-50%);
		left: 50%;
		z-index: -1;
	}

	&.full-width::before {
		width: 100vw;
	}
`;

const StyledContents = styled.div`
	padding: 1rem;
	max-width: ${({ theme }) => theme.layout.width.large};
	margin: 0 auto;

	.date {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		font-size: ${({ theme }) => theme.fontSize.large};
		padding-bottom: 1rem;
	}

	.categories {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.2rem 1.25rem;
		color: ${({ theme }) => theme.color.subText};

		.category {
			&.active button {
				color: ${({ theme }) => theme.color.primary};
				font-weight: ${({ theme }) => theme.fontWeight.medium};
			}

			button {
				color: ${({ theme }) => theme.color.subText};
				cursor: pointer;
				font-size: ${({ theme }) => theme.fontSize.small};
				transition: all 0.3s ease;

				&:hover {
					color: ${({ theme }) => theme.color.primary};
					font-weight: ${({ theme }) => theme.fontWeight.medium};
				}
			}
		}
	}
`;

export default SubscribeInfo;
