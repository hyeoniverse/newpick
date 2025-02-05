'use client';

import { useState } from 'react';
import Img from 'next/image';
import styled from 'styled-components';
import { ColorKey, BorderRadius } from '@/styles/theme';

interface Props {
	src: string;
	alt: string;
	width?: number;
	height?: number;
	ratio?: 'square' | 'wide' | 'tall';
	borderRadius?: BorderRadius;
	objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
	priority?: boolean;
	placeholder?: ColorKey;
	className?: string;
}

export default function Image({
	src,
	alt,
	width = 400,
	height = 300,
	ratio = 'wide',
	borderRadius = 'medium',
	objectFit = 'cover',
	priority = true,
	placeholder = 'surface',
	className,
}: Props) {
	const [isLoaded, setIsLoaded] = useState(false);

	return (
		<StyledImage
			className={`${className}`}
			$ratio={ratio}
			$borderRadius={borderRadius}
			$placeholder={placeholder}
			$isLoaded={isLoaded}
		>
			<Img
				src={src}
				alt={alt}
				width={width}
				height={height}
				priority={priority}
				style={{ objectFit }}
				onLoad={() => setIsLoaded(true)}
			/>
		</StyledImage>
	);
}

interface StyledProps {
	$ratio: 'square' | 'wide' | 'tall';
	$borderRadius: BorderRadius;
	$placeholder: string;
	$isLoaded: boolean;
}

const StyledImage = styled.div<StyledProps>`
	height: fit-content;
	overflow: hidden;
	border-radius: ${({ $borderRadius, theme }) => theme.borderRadius[$borderRadius || 'medium']};
	aspect-ratio: ${({ $ratio }) => {
		switch ($ratio) {
			case 'square':
				return '1 / 1';
			case 'wide':
				return '16 / 9';
			case 'tall':
				return '9 / 16';
			default:
				return '16 / 9';
		}
	}};

	/* 기본적으로 단색 배경을 적용하고, 이미지가 로드되면 숨김 */
	background: ${({ theme, $placeholder, $isLoaded }) => ($isLoaded ? 'transparent' : theme.color[$placeholder])};

	img {
		width: 100%;
		height: 100%;
		opacity: ${({ $isLoaded }) => ($isLoaded ? 1 : 0)}; /* 로드되기 전까지 투명 처리 */
		transition: opacity 0.3s ease-in-out;
	}
`;
