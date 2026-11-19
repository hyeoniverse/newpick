'use client';

import { useState } from 'react';
import Img from 'next/image';
import type { BorderRadius, ColorKey } from '@/styles/tokens/theme';
import { BG_COLOR, cx } from '@/styles/tw';
import { useImageFallback } from '@/components/common/useImageFallback';
import { DEFAULT_IMAGE_BG, DEFAULT_IMAGES } from '@/constants/images';

interface Props {
	src: string;
	alt: string;
	width?: number;
	height?: number;
	ratio?: 'square' | 'wide' | 'tall';
	borderRadius?: BorderRadius;
	objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
	/**
	 * 첫 화면에 보이는 사진(LCP 후보)만 true (#292): 먼저 받고(preload), 서서히 나타나기 없이 받는 대로 보인다.
	 * 나머지는 화면 가까이 와서 받고(lazy) 다 받으면 서서히 나타난다
	 */
	priority?: boolean;
	placeholder?: ColorKey;
	/** 못 불러올 때(지워진 기사 사진 · 사진 최적화 실패) 대신 보일 사진. 이것도 깨지면 기본 그림 */
	fallback?: string | null;
	/**
	 * 원래 사진을 못 불러올 때 사진 대신 그릴 것 (프로필 사진 → 사람 모양 AvatarPlaceholder).
	 * 주면 fallback · 기본 그림 대신 이것을 그린다
	 */
	fallbackNode?: React.ReactNode;
	className?: string;
}

/* 비율 · 틀은 styles/parts.css (.np-image): 화면 CSS가 덮어쓸 수 있게 components 층에 둔다 */
const RATIO = { square: 'np-ratio-square', wide: 'np-ratio-wide', tall: 'np-ratio-tall' } as const;
const RADIUS: Record<BorderRadius, string> = {
	flat: 'rounded-none',
	soft: 'rounded-[4px]',
	medium: 'rounded-[8px]',
	rounded: 'rounded-[16px]',
	capsule: 'rounded-[9999px]',
	circle: 'rounded-[50%]',
};

/** 비율 상자 안의 사진. 불러오는 동안은 단색 바탕, 다 불러오면 서서히 나타난다. 못 불러오면 대신할 사진 → 기본 그림으로 */
export default function Image({
	src,
	alt,
	width = 400,
	height = 300,
	ratio = 'wide',
	borderRadius = 'medium',
	objectFit = 'cover',
	priority = false,
	placeholder = 'surface',
	fallback,
	fallbackNode,
	className,
}: Props) {
	const [isLoaded, setIsLoaded] = useState(false);
	const { shown, unoptimized, onError } = useImageFallback(src, fallback);
	// 기본 그림(가로 3:2)을 세로로 긴 칸(tall)에 채우면 양옆이 잘려 NewPick 글자가 잘린다. 그때만 전체를 넣고 남는 곳은
	// 같은 바탕색. 넓은 · 정사각 칸은 양옆만 조금 잘리고 글자는 온전해 그대로 채운다
	const isDefault = shown === DEFAULT_IMAGES.MONO && ratio === 'tall';

	if (fallbackNode && src && src !== DEFAULT_IMAGES.MONO && shown !== src) return <>{fallbackNode}</>;

	return (
		<div
			className={cx(
				'np-image',
				RATIO[ratio],
				RADIUS[borderRadius],
				isLoaded ? 'bg-transparent' : BG_COLOR[placeholder],
				// 서서히 나타나기는 JS(onLoad)를 기다려 휴대폰에서 첫 사진이 늦게 보였다(LCP). 첫 화면 사진은 바로 보인다
				!priority && (isLoaded ? '[&_img]:opacity-100' : '[&_img]:opacity-0'),
				className,
			)}
			style={isDefault ? { backgroundColor: DEFAULT_IMAGE_BG } : undefined}
		>
			<Img
				src={shown}
				alt={alt}
				width={width}
				height={height}
				priority={priority}
				unoptimized={unoptimized}
				style={{ objectFit: isDefault ? 'contain' : objectFit }}
				onLoad={() => setIsLoaded(true)}
				onError={onError}
			/>
		</div>
	);
}
