import { useCallback, useEffect, useRef, useState } from 'react';
import { AUTO_SCROLL_INTERVAL } from '@/constants/numbers';
import { Card as ICard } from '@/models/card.model';
import styled from 'styled-components';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useTimeout } from '@/hooks/useTimeout';

import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';

interface Props {
	className?: string;
	type?: 'main' | 'sub';
	data: ICard[];
	autoScrollInterval?: number;
}

const CardSlider = ({ className, type = 'sub', data, autoScrollInterval = AUTO_SCROLL_INTERVAL }: Props) => {
	const { isMobile } = useMediaQuery();
	const cardRef = useRef<HTMLDivElement>(null);
	const cardContainerRef = useRef<HTMLDivElement>(null);

	// 현재 슬라이드 상태
	const [currentIndex, setCurrentIndex] = useState(0);
	// 연속 클릭 방지 상태
	const [isScrolling, setIsScrolling] = useState(false);
	// 스와이프 가능 여부
	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(true);
	// 연속 클릭 방지 해제
	useTimeout(() => setIsScrolling(false), isScrolling ? 500 : null);

	// 큰 배너(main)는 끝에서 처음으로 이어진다: 첫 카드를 맨 뒤에 하나 더 두고, 거기까지 옆으로 넘긴 뒤
	// 보이지 않게 진짜 첫 카드로 옮긴다 (예전에는 모든 카드를 거꾸로 훑으며 되감겼다)
	const loop = type === 'main' && data.length > 1;

	const handleScroll = useCallback(
		(direction: 'left' | 'right') => {
			if (isScrolling) return;
			setIsScrolling(true);

			const container = cardContainerRef.current;
			if (container && cardRef.current) {
				let cardWidth = isMobile ? cardRef.current.offsetWidth : cardRef.current.offsetWidth * 2;
				let gap = isMobile ? 24 : 24 * 2;
				if (type === 'main') {
					cardWidth = cardRef.current.offsetWidth;
					gap = 16;
				}

				const scrollAmount = cardWidth + gap;
				const last = data.length - 1;
				const to = (index: number, behavior: ScrollBehavior) =>
					container.scrollTo({ left: index * scrollAmount, behavior });

				if (loop && direction === 'right' && currentIndex === last) {
					// 맨 뒤의 첫 카드까지 넘긴 뒤, 같은 모습인 진짜 첫 카드로 순간 이동
					setCurrentIndex(0);
					to(data.length, 'smooth');
					afterScroll(container, () => to(0, 'instant'));
					return;
				}
				if (loop && direction === 'left' && currentIndex === 0) {
					// 맨 뒤의 첫 카드로 순간 이동한 뒤, 마지막 카드로 넘긴다
					setCurrentIndex(last);
					to(data.length, 'instant');
					to(last, 'smooth');
					return;
				}

				const newIndex =
					direction === 'left'
						? currentIndex === 0
							? last
							: currentIndex - 1
						: currentIndex === last
							? 0
							: currentIndex + 1;
				setCurrentIndex(newIndex);
				to(newIndex, 'smooth');
			}
		},
		[isScrolling, isMobile, type, currentIndex, data.length, loop],
	);

	const goToSlide = (index: number) => {
		if (cardContainerRef.current && cardRef.current) {
			const cardWidth = cardRef.current.offsetWidth;
			let gap = isMobile ? 24 : 24 * 2;
			if (type === 'main') {
				gap = 16;
			}

			const scrollAmount = index * (cardWidth + gap);

			cardContainerRef.current.scrollTo({ left: scrollAmount, behavior: 'smooth' });
			setCurrentIndex(index);
		}
	};

	// 자동 스크롤 기능
	useEffect(() => {
		if (type !== 'main') return;

		const interval = setInterval(() => {
			handleScroll('right');
		}, autoScrollInterval);

		return () => clearInterval(interval);
	}, [currentIndex, autoScrollInterval, handleScroll, type]);

	// 스크롤 처리 함수
	useEffect(() => {
		const updateScrollState = () => {
			if (cardContainerRef.current) {
				const { scrollLeft, scrollWidth, clientWidth } = cardContainerRef.current;
				setCanScrollLeft(scrollLeft > 0);
				setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
			}
		};

		const cardContainer = cardContainerRef.current;
		if (cardContainer) {
			cardContainer.addEventListener('scroll', updateScrollState);
			updateScrollState(); // 초기값 설정
		}

		return () => {
			if (cardContainer) {
				cardContainer.removeEventListener('scroll', updateScrollState);
			}
		};
	}, []);

	return (
		<StyledCardSlider className={className} $type={type}>
			<div className="cards" ref={cardContainerRef}>
				{data.map((item, index) => (
					<Card key={index} className="card" type={type} ref={index === 0 ? cardRef : null} data={item} />
				))}
				{/* 이어 넘기기용 첫 카드 복제본: 화면 읽기 · 키보드에서는 빠진다 */}
				{loop && <Card key="loop" className="card" type={type} ref={hideFromAssistiveTech} data={data[0]} />}
			</div>
			<div className="controls">
				{type === 'main' && (
					<>
						{data.map((_, index) => (
							<Button
								key={index}
								className="indicator"
								onClick={() => goToSlide(index)}
								aria-label={`${index + 1}번째 기사`}
								aria-current={index === currentIndex || undefined}
							>
								{index === currentIndex ? <div className="filled" /> : <div className="empty" />}
							</Button>
						))}
					</>
				)}

				<div className="arrow">
					<Button
						className="left"
						icon={<IoIosArrowBack aria-hidden />}
						aria-label="이전"
						onClick={() => handleScroll('left')}
						disabled={type !== 'main' && !canScrollLeft}
					/>
					<Button
						className="right"
						icon={<IoIosArrowForward aria-hidden />}
						aria-label="다음"
						onClick={() => handleScroll('right')}
						disabled={type !== 'main' && !canScrollRight}
					/>
				</div>
			</div>
		</StyledCardSlider>
	);
};

/** 부드러운 넘김이 끝나면 한 번 (scrollend가 없는 브라우저는 시간으로) */
function afterScroll(container: HTMLElement, run: () => void) {
	let done = false;
	const once = () => {
		if (done) return;
		done = true;
		container.removeEventListener('scrollend', once);
		run();
	};
	container.addEventListener('scrollend', once);
	window.setTimeout(once, 800);
}

/** 복제본은 눈에만 보이게 */
function hideFromAssistiveTech(el: HTMLDivElement | null) {
	el?.setAttribute('aria-hidden', 'true');
	el?.setAttribute('inert', '');
}

interface StyledProps {
	$type?: 'main' | 'sub';
}

const StyledCardSlider = styled.div<StyledProps>`
	width: ${({ $type }) => ($type === 'main' ? '100%' : 'calc(60% - 0.5rem)')};
	height: fit-content;
	flex: 1;
	display: flex;
	flex-direction: column;
	position: relative;
	gap: 0.5rem;

	.cards {
		width: 100%;
		height: 100%;
		flex: 1;
		display: flex;
		gap: 1rem;
		overflow-x: hidden;
		scroll-behavior: smooth;
		align-items: stretch;

		&::-webkit-scrollbar {
			display: none;
		}
		-ms-overflow-style: none; /* IE 및 Edge */
		scrollbar-width: none; /* Firefox */

		.card {
			min-width: ${({ $type }) => ($type === 'main' ? 'calc(100% - 0.75rem)' : 'calc(33.333% - 1.2rem)')};
			height: fit-content;
			display: flex;
			flex: 1;
			flex-shrink: 0;
			flex-direction: column;
			justify-content: center;
			align-items: center;

			margin-left: ${({ $type }) => ($type === 'main' ? '0' : '0.25rem')};
			margin-right: ${({ $type }) => ($type === 'main' ? '0' : '0.25rem')};
			padding: ${({ $type }) => ($type === 'main' ? '0' : '1rem')};

			border: ${({ theme, $type }) => ($type === 'main' ? 'none' : `1px solid ${theme.color.border}`)};
			border-radius: ${({ theme }) => theme.radius.surface};

			.card-footer {
				margin-top: 1rem;
			}
		}
	}

	.controls {
		display: flex;
		flex-direction: row;
		justify-content: flex-start;
		align-items: center;
		/* 점과 점의 중심 거리를 24px 넘게: 손가락으로 눌러도 옆 점이 눌리지 않게 (#16) */
		gap: 0.75rem;

		.arrow {
			display: flex;
			justify-content: center;
			align-items: center;
			cursor: pointer;
			gap: 0.5rem;

			.left,
			.right {
				padding: 0.5rem;
				border-radius: ${({ theme }) => theme.borderRadius.circle};

				&:hover {
					svg {
						color: ${({ theme }) => theme.color.primary};
					}
					background: ${({ theme }) => theme.color.tertiary};
				}

				&:disabled {
					svg {
						color: ${({ theme }) => theme.color.neutral};
					}
				}
			}
		}

		.indicator {
			display: flex;
			flex-direction: row;
			gap: 0.5rem;
			padding: 0;
			margin: 0;

			.filled {
				width: 0.8rem;
				height: 0.8rem;
				background: ${({ theme }) => theme.color.primary};
				border-radius: ${({ theme }) => theme.borderRadius.circle};
				box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
			}

			.empty {
				width: 0.8rem;
				height: 0.8rem;
				background: ${({ theme }) => theme.color.neutral};
				border: 1px solid ${({ theme }) => theme.color.border};
				border-radius: ${({ theme }) => theme.borderRadius.circle};
			}
		}
	}
`;

export default CardSlider;
