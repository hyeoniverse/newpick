'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getFirstImage } from '@/utils/getFirstImage';
import { DEFAULT_IMAGES } from '@/constants/images';
import { cx } from '@/styles/tw';

interface Props {
	src?: string | null;
	height?: string;
	className?: string;
	aspectratio?: number | 'auto';
}

/** 칸 폭에 맞춰 높이가 정해지는 사진 (비율을 주면 그 비율로 자른다). 못 불러오면 기본 그림 */
function HeightAutoImg({ src, height, className, aspectratio = 'auto' }: Props) {
	const wanted = (src && getFirstImage(src)) || DEFAULT_IMAGES.MONO;
	// 못 불러온 주소를 기억해 기본 그림으로 다시 그린다. 예전에는 img의 src만 바꿨는데, next/image가 넣은 srcset을
	// 브라우저가 먼저 써서 깨진 그림이 그대로 남았다 (#292). 주소가 바뀌면(다른 글) 다시 시도한다
	const [failedSrc, setFailedSrc] = useState<string | null>(null);
	const shown = failedSrc === wanted ? DEFAULT_IMAGES.MONO : wanted;
	return (
		<div
			className={cx('relative overflow-hidden rounded-surface', height && 'h-[var(--img-height)]', className)}
			style={{ '--img-height': height, '--img-ratio': String(aspectratio) } as React.CSSProperties}
		>
			{/* next/image fill이 넣는 position: absolute · height: 100%를 덮어써 폭에 맞춰 늘어나게 */}
			<Image
				src={shown}
				alt="news-img"
				quality={75}
				sizes="(max-width: 1023px) 100vw, (max-width: 1200px) 50vw, 33vw"
				fill
				className="relative! block h-[unset]! w-full object-cover object-center [aspect-ratio:var(--img-ratio)] [content-visibility:auto]"
				onError={() => setFailedSrc(wanted)}
			/>
		</div>
	);
}

export default HeightAutoImg;
