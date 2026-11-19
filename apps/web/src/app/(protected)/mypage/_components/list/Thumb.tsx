'use client';

import { LuNewspaper } from 'react-icons/lu';
import Image from '@/components/common/Image';
import { cx } from '@/styles/tw';

interface Props {
	src: string | null | undefined;
	/** 그림이 깨질 때(또는 없을 때) 대신 보일 사진 (뉴스레터 키워드 사진) */
	fallback?: string | null;
	className?: string;
}

/** 뉴스레터 썸네일 (첫 그림, 16:9). 그림도 대신할 사진도 없으면 연한 보라 바탕에 신문 아이콘 */
export default function Thumb({ src, fallback, className }: Props) {
	return (
		<span className={cx('np-mypage-thumb-thumb', className)}>
			{src || fallback ? (
				<Image src={src ?? ''} fallback={fallback} alt="" ratio="wide" borderRadius="flat" priority={false} />
			) : (
				<span className="thumb-empty" aria-hidden>
					<LuNewspaper />
				</span>
			)}
		</span>
	);
}
