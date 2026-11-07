'use client';

import { SyntheticEvent } from 'react';
import Image from 'next/image';
import { getFirstImage } from '@/utils/getFirstImage';
import { cx } from '@/styles/tw';

interface Props {
	src?: string | null;
	height?: string;
	className?: string;
	aspectratio?: number | 'auto';
}

/** 칸 폭에 맞춰 높이가 정해지는 사진 (비율을 주면 그 비율로 자른다). 못 불러오면 기본 그림 */
function HeightAutoImg({ src, height, className, aspectratio = 'auto' }: Props) {
	const imageOnErrorHandler = (e: SyntheticEvent<HTMLImageElement>) => {
		e.currentTarget.onerror = null;
		e.currentTarget.src = '/img/newpick_default_img.jpg';
	};
	return (
		<div
			className={cx('relative overflow-hidden rounded-surface', height && 'h-[var(--img-height)]', className)}
			style={{ '--img-height': height, '--img-ratio': String(aspectratio) } as React.CSSProperties}
		>
			{/* next/image fill이 넣는 position: absolute · height: 100%를 덮어써 폭에 맞춰 늘어나게 */}
			<Image
				src={(src && getFirstImage(src)) || '/img/newpick_default_img.jpg'}
				alt="news-img"
				quality={75}
				sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
				fill
				className="relative! block h-[unset]! w-full object-cover object-center [aspect-ratio:var(--img-ratio)] [content-visibility:auto]"
				onError={imageOnErrorHandler}
			/>
		</div>
	);
}

export default HeightAutoImg;
