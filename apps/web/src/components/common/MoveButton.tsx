import styled from 'styled-components';
import Button from '@/components/common/Button';

interface Props {
	onClick?: () => void;
	text?: string;
	frontIcon?: React.ReactNode;
	backIcon?: React.ReactNode;
	className?: string;
	width?: string;
}

function MoveButton({ onClick, frontIcon, backIcon, text, className, width }: Props) {
	return (
		<MoveButtonStyled scheme="monoOutline" onClick={onClick} className={className} $width={width}>
			{frontIcon}
			{text}
			{backIcon}
		</MoveButtonStyled>
	);
}

interface StyledProps {
	$width?: string;
}

const MoveButtonStyled = styled(Button)<StyledProps>`
	border-radius: ${({ theme }) => theme.borderRadius.capsule};
	color: ${({ theme }) => theme.color.mediumGrey};
	width: ${({ $width }) => $width || 'fit-content'};
	height: fit-content;

	svg {
		color: ${({ theme }) => theme.color.mediumGrey};
	}
`;

export default MoveButton;
