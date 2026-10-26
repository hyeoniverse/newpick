'use client';

import styled, { keyframes } from 'styled-components';

interface Props {
	/** 불러오는 중이면 위로 옅은 빛이 지나간다. 사진이 없는 사람이면 끈다 */
	loading?: boolean;
	className?: string;
}

/**
 * 프로필 사진 자리 (#70). 사람 모양(머리·어깨)을 채운 원.
 * 헤더·마이페이지에서 불러오는 중이거나 프로필 사진이 없을 때 쓴다.
 * 색은 글자색을 바탕색에 섞어 만들어 라이트·다크 모두 같은 대비. 크기는 감싼 곳에 맞춘다
 */
export default function AvatarPlaceholder({ loading = false, className }: Props) {
	return (
		<StyledAvatar
			className={className}
			$loading={loading}
			{...(loading ? { role: 'status', 'aria-busy': true, 'aria-label': '프로필 불러오는 중' } : { 'aria-hidden': true })}
		>
			<svg viewBox="0 0 40 40" aria-hidden>
				<circle cx="20" cy="15" r="7" />
				<path d="M6 40c0-8.3 6.3-14 14-14s14 5.7 14 14z" />
			</svg>
		</StyledAvatar>
	);
}

const shimmer = keyframes`
	from { transform: translateX(-100%); }
	to { transform: translateX(100%); }
`;

const StyledAvatar = styled.span<{ $loading: boolean }>`
	position: relative;
	display: block;
	width: 100%;
	height: 100%;
	aspect-ratio: 1;
	overflow: hidden;
	border-radius: ${({ theme }) => theme.borderRadius.circle};
	background: color-mix(in srgb, ${({ theme }) => theme.color.text} 7%, ${({ theme }) => theme.color.background});

	/* 헤더 펼침 메뉴 버튼처럼 안쪽 svg 크기를 정하는 곳 안에서도 원을 꽉 채우게 (&&로 우선순위를 올린다) */
	&& svg {
		display: block;
		width: 100%;
		height: 100%;
		margin: 0;
		fill: color-mix(in srgb, ${({ theme }) => theme.color.text} 22%, ${({ theme }) => theme.color.background});
	}

	/* 흰 빛은 다크 모드에서 원 전체를 밝혀 모양을 지운다. 바탕색 쪽으로 옅게 */
	&::after {
		content: '';
		display: ${({ $loading }) => ($loading ? 'block' : 'none')};
		position: absolute;
		inset: 0;
		background: linear-gradient(
			90deg,
			transparent,
			color-mix(in srgb, ${({ theme }) => theme.color.background} 55%, transparent),
			transparent
		);
		animation: ${shimmer} 1.2s ease-in-out infinite;
	}

	@media (prefers-reduced-motion: reduce) {
		&::after {
			display: none;
		}
	}
`;
