'use client';

import styled from 'styled-components';

/** 보낸 사람 'NP' 동그라미 (공통, 메일 화면 · 받은편지함): 강조색 바탕에 흰 글자. 장식이라 화면 읽기에서는 뺀다 */
export default function BrandAvatar({ size = '2.5rem', className }: { size?: string; className?: string }) {
	return (
		<StyledBrandAvatar $size={size} className={className} aria-hidden>
			NP
		</StyledBrandAvatar>
	);
}

const StyledBrandAvatar = styled.span<{ $size: string }>`
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	width: ${({ $size }) => $size};
	height: ${({ $size }) => $size};
	border-radius: ${({ theme }) => theme.borderRadius.circle};
	background: ${({ theme }) => theme.color.primary};
	color: #ffffff;
	font-size: ${({ theme }) => theme.fontSize.extraSmall};
	font-weight: ${({ theme }) => theme.fontWeight.bold};
`;
