'use client';

import styled, { CSSProp } from 'styled-components';
import { ColorKey, HeadingSize, FontWeight } from '@/styles/theme';

interface Props {
	children: React.ReactNode;
	className?: string;
	size?: HeadingSize;
	weight?: FontWeight;
	color?: ColorKey;
	/** 문서 구조상 제목 단계 (기본 h1). 모양은 size로 따로 정한다 */
	as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p';
}

const Title = ({ children, className, size = 'medium', weight, color, as }: Props) => {
	return (
		<StyledTitle as={as} className={`${className}`} $size={size} $weight={weight} $color={color}>
			{children}
		</StyledTitle>
	);
};

interface StyledProps {
	$size: HeadingSize;
	$weight?: FontWeight;
	$color?: ColorKey;
	$styles?: string | CSSProp;
}

const StyledTitle = styled.h1<StyledProps>`
	font-size: ${({ theme, $size }) => theme.heading[$size].fontSize};
	font-weight: ${({ theme, $weight }) => theme.fontWeight[$weight || 'regular']};
	color: ${({ theme, $color }) => theme.color[$color || 'text']};
	transition: color 0.3s ease;
	margin: 0;

	${({ $styles }) => $styles || ''}
`;

export default Title;
