'use client';

import styled, { CSSProp } from 'styled-components';
import { ColorKey, HeadingSize, FontWeight } from '@/styles/theme';

interface Props {
	children: React.ReactNode;
	className?: string;
	size?: HeadingSize;
	weight?: FontWeight;
	color?: ColorKey;
}

const Title = ({ children, className, size = 'medium', weight, color }: Props) => {
	return (
		<StyledTitle className={`${className}`} $size={size} $weight={weight} $color={color}>
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
