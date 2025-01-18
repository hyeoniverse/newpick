import styled from 'styled-components';

export const IconStyled = styled.button`
	background-color: transparent;
	border-radius: ${({ theme }) => theme.borderRadius.circle};
	width: 2.5rem;
	height: 2.5rem;
	display: flex;
	justify-content: center;
	align-items: center;
	cursor: pointer;

	svg {
		width: 1.5rem;
		height: 1.5rem;
		color: ${({ theme }) => theme.color.primary};
	}

	&:hover {
		background-color: ${({ theme }) => theme.color.tertiary};
		transition: all 0.3s ease;
	}
`;
