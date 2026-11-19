'use client';

import Image from 'next/image';
import { getFirstImage } from '@/utils/getFirstImage';
import { useImageFallback } from '@/components/common/useImageFallback';
import { cx } from '@/styles/tw';

interface Props {
	src?: string | null;
	/** 못 불러올 때 대신 보일 사진 (뉴스레터 키워드 사진). 이것도 깨지면 기본 그림 */
	fallback?: string | null;
	height?: string;
	className?: string;
	aspectratio?: number | 'auto';
}

/** 칸 폭에 맞춰 높이가 정해지는 사진 (비율을 주면 그 비율로 자른다). 못 불러오면 대신할 사진 → 기본 그림 */
function HeightAutoImg({ src, fallback, height, className, aspectratio = 'auto' }: Props) {
	// 못 불러오면 사진을 통째로 다시 그린다. 예전에는 img의 src만 바꿨는데, next/image가 넣은 srcset을
	// 브라우저가 먼저 써서 깨진 그림이 그대로 남았다 (#292)
	const { shown, unoptimized, onError } = useImageFallback((src && getFirstImage(src)) || null, fallback);
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
				unoptimized={unoptimized}
				onError={onError}
			/>
		</div>
	);
}

export default HeightAutoImg;
