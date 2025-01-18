import { useRef, useState } from 'react';
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
}

const CardSlider = ({ className, type = 'sub', data }: Props) => {
	const isMobile = useMediaQuery();
	const cardRef = useRef<HTMLDivElement>(null);
	const cardContainerRef = useRef<HTMLDivElement>(null);

	// 현재 슬라이드 상태
	const [currentIndex, setCurrentIndex] = useState(0);

	// 연속 클릭 방지 상태
	const [isScrolling, setIsScrolling] = useState(false);

	// 연속 클릭 방지 해제
	useTimeout(() => setIsScrolling(false), isScrolling ? 500 : null);

	// 스크롤 처리 함수
	const handleScroll = (direction: 'left' | 'right') => {
		if (isScrolling) return; // 스크롤 중이면 실행하지 않음
		setIsScrolling(true); // 스크롤 상태 활성화

		if (cardContainerRef.current && cardRef.current) {
			// 현재 인덱스 업데이트 및 무한 슬라이드 구현
			if (type === 'main') {
				const cardWidth =
					type === 'main'
						? cardRef.current.offsetWidth
						: isMobile
						? cardRef.current.offsetWidth * 2
						: cardRef.current.offsetWidth;
				const gap = type === 'main' ? 16 : isMobile ? 24 * 2 : 24;
				const scrollAmount = cardWidth + gap;

				setCurrentIndex((prev) => {
					let newIndex = prev;
					if (direction === 'left') {
						newIndex = prev === 0 ? data.length - 1 : prev - 1; // 왼쪽 끝에서 마지막 슬라이드로 이동
					} else {
						newIndex = prev === data.length - 1 ? 0 : prev + 1; // 오른쪽 끝에서 첫 번째 슬라이드로 이동
					}

					// 스크롤 동작
					cardContainerRef.current?.scrollTo({
						left: newIndex * scrollAmount,
						behavior: 'smooth',
					});

					return newIndex;
				});
			} else {
				const cardWidth = isMobile ? cardRef.current.offsetWidth * 2 : cardRef.current.offsetWidth;
				const gap = isMobile ? 24 * 2 : 24;
				const scrollAmount = cardWidth + gap;

				cardContainerRef.current.scrollBy({
					left: direction === 'left' ? -scrollAmount : scrollAmount,
					behavior: 'smooth',
				});
			}
		}
	};

	// 특정 슬라이드로 이동
	const goToSlide = (index: number) => {
		if (cardContainerRef.current && cardRef.current) {
			const cardWidth = cardRef.current.offsetWidth;
			const gap = type === 'main' ? 16 : isMobile ? 24 * 2 : 24;
			const scrollAmount = index * (cardWidth + gap);

			cardContainerRef.current.scrollTo({ left: scrollAmount, behavior: 'smooth' });
			setCurrentIndex(index);
		}
	};

	return (
		<StyledCardSlider className={className} $type={type}>
			<div className="cards" ref={cardContainerRef}>
				{data.map((item, index) => (
					<Card key={index} className="card" type={type} ref={index === 0 ? cardRef : null} data={item} />
				))}
			</div>
			<div className="controls">
				{type === 'main' && (
					<>
						{data.map((_, index) => (
							<Button key={index} className="indicator" onClick={() => goToSlide(index)}>
								{index === currentIndex ? <div className="filled" /> : <div className="empty" />}
							</Button>
						))}
					</>
				)}

				<div className="arrow">
					<Button className="left" onClick={() => handleScroll('left')}>
						<IoIosArrowBack />
					</Button>
					<Button className="right" onClick={() => handleScroll('right')}>
						<IoIosArrowForward />
					</Button>
				</div>
			</div>
		</StyledCardSlider>
	);
};

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
			border-radius: ${({ theme }) => theme.borderRadius.medium};

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
		gap: 0.5rem;

		.arrow {
			color: ${({ theme }) => theme.color.subText};
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
					background: ${({ theme }) => theme.color.tertiary};
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
