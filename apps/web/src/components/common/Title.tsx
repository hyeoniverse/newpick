'use client';

import styled from 'styled-components';
import { ColorKey, HeadingSize, FontWeight } from '@/styles/theme'; // 절대 경로 사용

interface Props {
	children: React.ReactNode;
	size: HeadingSize;
	weight?: FontWeight;
	color?: ColorKey;
}

const Title = ({ children, size, weight, color }: Props) => {
	return (
		<StyledTitle size={size} weight={weight} color={color}>
			{children}
		</StyledTitle>
	);
};

const StyledTitle = styled.p<Omit<Props, 'children'>>`
	font-size: ${({ theme, size }) => theme.heading[size].fontSize};
	font-weight: ${({ theme, weight }) => theme.fontWeight[weight || 'regular']};
	color: ${({ theme, color }) => theme.color[color || 'text']};
	transition: color 0.3s ease;
	margin: 0;
`;

export default Title;
