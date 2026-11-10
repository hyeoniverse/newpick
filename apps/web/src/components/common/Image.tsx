'use client';

import { useState } from 'react';
import Img from 'next/image';
import type { BorderRadius, ColorKey } from '@/styles/tokens/theme';
import { BG_COLOR, cx } from '@/styles/tw';

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

/** 비율 상자 안의 사진. 불러오는 동안은 단색 바탕, 다 불러오면 서서히 나타난다 */
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
		<div
			className={cx(
				'np-image',
				RATIO[ratio],
				RADIUS[borderRadius],
				isLoaded ? 'bg-transparent' : BG_COLOR[placeholder],
				'[&_img]:size-full [&_img]:[transition:opacity_0.3s_ease-in-out]',
				isLoaded ? '[&_img]:opacity-100' : '[&_img]:opacity-0',
				className,
			)}
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
		</div>
	);
}
