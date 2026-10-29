'use client';

import styled from 'styled-components';
import { LuNewspaper } from 'react-icons/lu';
import Image from '@/components/common/Image';

/** 뉴스레터 썸네일 (첫 그림, 16:9). 그림이 없으면 연한 보라 바탕에 신문 아이콘 */
export default function Thumb({ src, className }: { src: string | null | undefined; className?: string }) {
	return (
		<StyledThumb className={className}>
			{src ? (
				<Image src={src} alt="" ratio="wide" borderRadius="flat" priority={false} />
			) : (
				<span className="thumb-empty" aria-hidden>
					<LuNewspaper />
				</span>
			)}
		</StyledThumb>
	);
}

const StyledThumb = styled.span`
	display: block;
	overflow: hidden;

	.thumb-empty {
		display: flex;
		align-items: center;
		justify-content: center;
		aspect-ratio: 16 / 9;
		background: ${({ theme }) => theme.color.tertiary};
		color: ${({ theme }) => theme.color.primary};

		svg {
			width: 1.75rem;
			height: 1.75rem;
		}
	}
`;
