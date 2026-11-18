'use client';

import { useState } from 'react';
import Img from 'next/image';
import type { BorderRadius, ColorKey } from '@/styles/tokens/theme';
import { BG_COLOR, cx } from '@/styles/tw';
import { DEFAULT_IMAGES } from '@/constants/images';

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
	/** 못 불러올 때(지워진 기사 사진 등) 대신 보일 그림 */
	fallback?: string;
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

/** 비율 상자 안의 사진. 불러오는 동안은 단색 바탕, 다 불러오면 서서히 나타난다. 못 불러오면 기본 그림으로 */
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
	fallback = DEFAULT_IMAGES.MONO,
	className,
}: Props) {
	const [isLoaded, setIsLoaded] = useState(false);
	// 못 불러온 주소. src가 바뀌면 저절로 다시 원래 주소부터 시도한다
	const [failedSrc, setFailedSrc] = useState<string | null>(null);
	const shown = failedSrc === src ? fallback : src;

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
		>
			<Img
				src={shown}
				alt={alt}
				width={width}
				height={height}
				priority={priority}
				style={{ objectFit }}
				onLoad={() => setIsLoaded(true)}
				onError={() => {
					if (shown !== fallback) setFailedSrc(src);
				}}
			/>
		</div>
	);
}
