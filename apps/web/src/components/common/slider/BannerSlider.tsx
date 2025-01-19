import React, { useState, useCallback } from 'react';
import { Banner as IBanner } from '@/models/banner.model';
import { useInterval } from '@/hooks/useInterval';

import styled from 'styled-components';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import Image from '@/components/common/Image';
import Button from '@/components/common/Button';

interface Props {
	banners: IBanner[];
}

const BannerSlider = ({ banners }: Props) => {
	const [currentIndex, setCurrentIndex] = useState(0); // 현재 슬라이드 인덱스 상태
	const [resetInterval, setResetInterval] = useState(0); // Interval 초기화를 위한 상태

	// 다음 슬라이드로 이동하는 함수
	const goToNext = useCallback(() => {
		if (banners.length === 0) return;
		setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
		resetSliderInterval();
	}, [banners.length]);

	// 이전 슬라이드로 이동하는 함수
	const goToPrevious = useCallback(() => {
		if (banners.length === 0) return;
		setCurrentIndex((prevIndex) => (prevIndex === 0 ? banners.length - 1 : prevIndex - 1));
		resetSliderInterval();
	}, [banners.length]);

	// 특정 슬라이드로 이동하는 함수
	const goToSlide = (index: number) => {
		setCurrentIndex(index);
		resetSliderInterval(); // interval 초기화
	};

	// Interval 초기화 함수
	const resetSliderInterval = () => {
		setResetInterval((prev) => prev + 1); // 상태를 변경하여 interval 재실행
	};

	// 자동 슬라이드: 일정 시간마다 goToNext 호출
	useInterval(goToNext, 5000, resetInterval); // resetInterval 상태로 재실행 트리거

	return (
		<StyledSlider>
			<div className="slides">
				{banners.map((item, index) => (
					<div key={item.id} className={`slide ${index === currentIndex ? 'active' : ''}`}>
						<div className="image-placeholder">
							<Image src={item.image} alt={item.title} />
						</div>
						<div className="overlay">
							<div className="content">
								<h1>{item.title}</h1>
								<p>{item.description}</p>
							</div>
						</div>
					</div>
				))}
			</div>
			<div className="controls">
				{banners.map((_, index) => (
					<Button key={index} className="indicator" onClick={() => goToSlide(index)}>
						{index === currentIndex ? <div className="filled" /> : <div className="empty" />}
					</Button>
				))}
				<div className="arrow">
					<Button onClick={goToPrevious}>
						<IoIosArrowBack />
					</Button>
					<Button onClick={goToNext}>
						<IoIosArrowForward />
					</Button>
				</div>
			</div>
		</StyledSlider>
	);
};

const StyledSlider = styled.div`
	position: relative;
	width: 100%;
	overflow: hidden;

	.slides {
		width: 100%;
		aspect-ratio: 16 / 9;
	}

	.slide {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		aspect-ratio: 16 / 9;

		border-radius: ${({ theme }) => theme.borderRadius.medium};
		background-size: cover;
		background-position: center;
		opacity: 0;
		transition: opacity 1s ease-in-out;
		overflow: hidden;

		&.active {
			opacity: 1;
		}

		.image-placeholder {
			width: 100%;
			aspect-ratio: 16 / 9;
			overflow: hidden;
			border-radius: ${({ theme }) => theme.borderRadius.medium};
			background: ${({ theme }) => theme.color.surface};
		}

		.overlay {
			position: absolute;
			bottom: 0;
			left: 0;
			width: 100%;
			height: 100%;

			display: flex;
			flex-direction: column;
			justify-content: flex-end;
			align-items: flex-start;
			padding: 2rem;

			background: linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.2));
			color: white;

			.content {
				width: 100%;
				height: 100%;

				display: flex;
				flex-direction: column;
				justify-content: flex-end;
				align-items: flex-start;

				h1 {
					font-size: ${({ theme }) => theme.heading.medium};
					color: white;
					text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);

					overflow: hidden;
					text-overflow: ellipsis;
					display: -webkit-box;
					-webkit-line-clamp: 2;
					-webkit-box-orient: vertical;

					@media ${({ theme }) => theme.mediaQuery.tablet} {
						-webkit-line-clamp: 1;
					}
				}

				p {
					font-size: ${({ theme }) => theme.fontSize.medium};
					color: white;
					text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);

					overflow: hidden;
					text-overflow: ellipsis;
					display: -webkit-box;
					-webkit-line-clamp: 2;
					-webkit-box-orient: vertical;

					@media ${({ theme }) => theme.mediaQuery.tablet} {
						font-size: ${({ theme }) => theme.heading.small};
						-webkit-line-clamp: 1;
					}
				}
			}
		}
	}

	.controls {
		width: 100%;
		height: fit-content;

		display: flex;
		flex-direction: row;
		justify-content: flex-start;
		align-items: center;
		padding: 0.5rem 1rem;
		gap: 0.5rem;

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

		.arrow {
			display: flex;
			align-items: center;
			gap: 0.5rem;

			button {
				aspect-ratio: 1;
				padding: 0.5rem;

				display: flex;
				justify-content: center;
				align-items: center;

				color: ${({ theme }) => theme.color.subText};
				background: transparent;
				border-radius: ${({ theme }) => theme.borderRadius.circle};
				border: none;
				cursor: pointer;
				transition: background 0.3s ease;

				&:hover {
					background: ${({ theme }) => theme.color.tertiary};
				}
			}
		}
	}
`;

export default BannerSlider;
