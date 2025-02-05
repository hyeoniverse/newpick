import Title from '@/components/common/Title';
import { styled } from 'styled-components';
import { ColorKey } from '@/styles/theme';

interface Props {
	className?: string;
	text: string;
	color?: ColorKey;
}

export default function BorderTitle({ className, text, color }: Props) {
	return (
		<StyledBorderTitle $color={color} className={className}>
			<Title size="small" weight="semiBold" className="title">
				{text}
			</Title>
			<div className="bar" />
		</StyledBorderTitle>
	);
}

interface StyledProps {
	$color?: ColorKey;
}

const StyledBorderTitle = styled.div<StyledProps>`
	width: 100%;
	display: flex;
	align-items: center;
	margin-bottom: 3rem;
	text-align: center;

	.title {
		white-space: nowrap;
		margin-right: 1rem;
		color: ${({ theme, $color }) => ($color ? theme.color[$color] : theme.color.text)};
	}

	.bar {
		border-bottom: 1px solid ${({ theme, $color }) => ($color ? theme.color[$color] : theme.color.text)};
		color: ${({ theme, $color }) => ($color ? theme.color[$color] : theme.color.text)};
		width: 100%;
		height: fit-content;
	}
`;
