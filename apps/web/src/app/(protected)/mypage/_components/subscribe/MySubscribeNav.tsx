'use client';

import styled from 'styled-components';
import { useEffect, useRef, useState } from 'react';
import { useHeader } from '@/hooks/useHeader';
import { useTrends } from '@/hooks/useTrends';

import { remToPx } from '@/utils/formatter';
import { useAuthStore } from '@/stores/useAuthStore';
import { filterByCategories } from '@/utils/queryNewsletters';
import { mapIdToTitle } from '@/utils/mapInterests';

interface SubscribeInfoProps {
	activeCategory: string;
}

function MySubscribeNav({ activeCategory }: SubscribeInfoProps) {
	const { user } = useAuthStore();
	const { trends } = useTrends();
	const userInterests = mapIdToTitle(user?.interests ?? []);
	const userArticles = filterByCategories(trends, userInterests);

	const lastScrollY = useRef(0);
	const navRef = useRef<HTMLDivElement>(null);
	const [isSticky, setIsSticky] = useState(false);
	const { headerHeight } = useHeader();

	// 스크롤 좌우 넓어지는 효과
	useEffect(() => {
		const handleScroll = () => {
			const currentScrollY = window.scrollY;

			// 특정 위치 이상 스크롤되면 Sticky 활성화
			setIsSticky(currentScrollY > 308);

			// 현재 스크롤 위치 저장
			lastScrollY.current = currentScrollY;
		};
		handleScroll();

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	// 구독한 뉴스레터 네비게이션 스크롤 앵커 설정
	const handleAnchorNavigation = (e: React.MouseEvent<HTMLButtonElement>, categoryName: string) => {
		e.preventDefault();
		// 해당 카테고리를 가진 요소 찾기
		const element = document.querySelector<HTMLElement>(`[data-categoryid="${categoryName}"]`);

		if (element) {
			const offset = remToPx('10rem') + remToPx(headerHeight);
			const elementPosition = element.getBoundingClientRect().top + window.scrollY;
			window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
		}
	};

	const now = new Date();

	const threshold = new Date();
	threshold.setHours(8, 0, 0, 0);
	if (now < threshold) {
		// 만약 지금이 8시 이전이라면 어제 8시로 설정
		threshold.setDate(threshold.getDate() - 1);
	}
	const date = threshold.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

	return (
		<SubscribeInfoStyled
			ref={navRef}
			className={isSticky ? 'full-width' : ''}
			$isSticky={isSticky}
			$paddingTop={headerHeight}
		>
			<ContentsStyled>
				<div className="date">
					<p>{date}</p>
				</div>
				<ul className="categories">
					{userArticles.length > 0 &&
						userArticles.map((article) => (
							<li
								key={article.id}
								className={`category ${activeCategory === article.categoryName ? 'active' : ''}`}
							>
								<button onClick={(e) => handleAnchorNavigation(e, article.categoryName)}>
									{article.categoryName}
								</button>
							</li>
						))}
				</ul>
			</ContentsStyled>
		</SubscribeInfoStyled>
	);
}

interface StyledProps {
	$isSticky: boolean;
	$paddingTop: string;
}

const SubscribeInfoStyled = styled.div<StyledProps>`
	position: sticky;
	width: 100%;
	margin-top: -40px;
	top: 0;
	padding-top: ${({ $isSticky, $paddingTop }) => ($isSticky ? $paddingTop : '0')};
	z-index: 999;
	background-color: transparent;
	border-bottom: none;
	transition: all 0.3s ease;

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
		transition: all 0.3s ease;
		z-index: -1;
	}

	&.full-width::before {
		width: 100vw;
	}
`;

const ContentsStyled = styled.div`
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
		color: ${({ theme }) => theme.color.mediumGrey};

		.category {
			&.active button {
				color: ${({ theme }) => theme.color.primary};
				font-weight: ${({ theme }) => theme.fontWeight.medium};
			}

			button {
				color: ${({ theme }) => theme.color.mediumGrey};
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

export default MySubscribeNav;
