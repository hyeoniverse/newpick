'use client';

import { LuNewspaper } from 'react-icons/lu';
import Image from '@/components/common/Image';
import { cx } from '@/styles/tw';

/** 뉴스레터 썸네일 (첫 그림, 16:9). 그림이 없으면 연한 보라 바탕에 신문 아이콘 */
export default function Thumb({ src, className }: { src: string | null | undefined; className?: string }) {
	return (
		<span className={cx('np-mypage-thumb-thumb', className)}>
			{src ? (
				<Image src={src} alt="" ratio="wide" borderRadius="flat" priority={false} />
			) : (
				<span className="thumb-empty" aria-hidden>
					<LuNewspaper />
				</span>
			)}
		</span>
	);
}
