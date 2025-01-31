'use client';

import styled, { CSSProp } from 'styled-components';
import { ColorKey, FontWeight, FontSize } from '@/styles/theme';

interface Props {
	as?: 'span' | 'p';
	className?: string;
	children: React.ReactNode;
	size?: FontSize;
	weight?: FontWeight;
	color?: ColorKey;
}

const Text = ({ as = 'span', className, children, size = 'medium', weight = 'light', color = 'text' }: Props) => {
	return (
		<StyledText as={as} className={className} $size={size} $weight={weight} $color={color}>
			{children}
		</StyledText>
	);
};

interface StyleProps {
	$size: FontSize;
	$weight: FontWeight;
	$color: ColorKey;
	$styles?: string | CSSProp;
}

const StyledText = styled.span<StyleProps>`
	font-size: ${({ theme, $size }) => theme.fontSize[$size]};
	font-weight: ${({ theme, $weight }) => theme.fontWeight[$weight]};
	color: ${({ theme, $color }) => theme.color[$color]};
	transition: color 0.3s ease;
	margin: 0;

	${({ $styles }) => $styles || ''}
`;

export default Text;
