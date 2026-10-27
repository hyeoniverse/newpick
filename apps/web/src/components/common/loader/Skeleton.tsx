'use client';

import styled, { keyframes } from 'styled-components';

/** 불러오는 동안 카드 자리 (세로 카드 4장) */
export default function Skeleton() {
	return (
		<LoaderContainer aria-hidden>
			{Array.from({ length: 4 }).map((_, index) => (
				<SkeletonCard key={index}>
					<SkeletonBlock $height="120px" $radius="0" />
					<SkeletonBlock $width="80%" $height="16px" className="text" />
				</SkeletonCard>
			))}
		</LoaderContainer>
	);
}

// 로딩 애니메이션 효과
const shimmer = keyframes`
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
`;

interface BlockProps {
	$width?: string;
	$height?: string;
	$radius?: string;
}

/**
 * 불러오는 동안 글자·사진 자리를 채우는 회색 막대 (#17). 테마 색(neutral ↔ surface)으로 반짝여 다크 모드에서도 어울린다.
 * 화면마다 실제 모양대로 이어 붙여 쓴다
 */
export const SkeletonBlock = styled.span<BlockProps>`
	display: block;
	width: ${({ $width }) => $width ?? '100%'};
	height: ${({ $height }) => $height ?? '1rem'};
	border-radius: ${({ $radius, theme }) => $radius ?? theme.radius.chip};
	background: linear-gradient(
		90deg,
		${({ theme }) => theme.color.neutral} 25%,
		${({ theme }) => theme.color.surface} 50%,
		${({ theme }) => theme.color.neutral} 75%
	);
	background-size: 200% 100%;
	animation: ${shimmer} 1.5s infinite linear;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`;

const LoaderContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	width: 100%;
`;

const SkeletonCard = styled.div`
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 180px;
	border: 1px solid ${({ theme }) => theme.color.border};
	border-radius: ${({ theme }) => theme.radius.surface};
	overflow: hidden;

	.text {
		margin: 10px auto;
	}
`;
