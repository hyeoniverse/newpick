import styled from 'styled-components';

interface Props {
	width?: string;
	margin?: string;
	className?: string;
}

function BarWidth({ width, margin, className }: Props) {
	return <BarStyled className={className} $width={width} $margin={margin} />;
}

interface StyledProps {
	$width?: string;
	$margin?: string;
}

const BarStyled = styled.div<StyledProps>`
	border-bottom: 1px solid ${({ theme }) => theme.color.border};
	width: ${({ $width }) => $width || '100%'};
	margin-top: ${({ $margin }) => $margin || '5rem'};
	margin-bottom: ${({ $margin }) => $margin || '5rem'};
`;

export default BarWidth;
