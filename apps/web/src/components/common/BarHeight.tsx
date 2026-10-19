import styled from 'styled-components';

interface Props {
	height?: string;
	margin?: string;
}

function BarHeight({ height, margin }: Props) {
	return <BarStyled $height={height} $margin={margin} />;
}

interface StyledProps {
	$height?: string;
	$margin?: string;
}

const BarStyled = styled.div<StyledProps>`
	border-left: 1px solid ${({ theme }) => theme.color.border};
	height: ${({ $height }) => $height || '100%'};
	margin-left: ${({ $margin }) => $margin || '4rem'};
	margin-right: ${({ $margin }) => $margin || '4rem'};
`;

export default BarHeight;
