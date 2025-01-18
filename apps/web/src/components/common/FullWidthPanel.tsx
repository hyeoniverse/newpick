'use client';

import React from 'react';
import styled from 'styled-components';
import { ColorKey } from '@/styles/theme';

interface Props {
	children?: React.ReactNode;
	border?: ColorKey;
	background?: ColorKey;
	color?: ColorKey;
}

const FullWidthPanel: React.FC<Props> = ({ children, border, background, color }) => {
	return (
		<StyledPanel $border={border} $background={background} $color={color}>
			{children}
		</StyledPanel>
	);
};

export default FullWidthPanel;

interface StyledProps {
	$border?: ColorKey;
	$background?: ColorKey;
	$color?: ColorKey;
}

const StyledPanel = styled.section<StyledProps>`
	position: relative;
	width: 100vw;
	height: fit-content;

	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;

	margin: 4rem 0;
	padding: 3rem 1rem;
	transform: translateX(-50%);
	left: 50%;

	border: 1px solid ${({ theme, $border, $background }) => theme.color[$border || $background || 'border']};
	color: ${({ theme, $color }) => theme.color[$color || 'textSecondary']};
	background: ${({ theme, $background }) => theme.color[$background || 'primary']};
`;
