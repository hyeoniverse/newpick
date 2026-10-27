import Title from '@/components/common/Title';
import { styled } from 'styled-components';
import { ColorKey } from '@/styles/theme';

interface Props {
	className?: string;
	text: string;
	color?: ColorKey;
	/** 섹션 제목이므로 기본 h2 (페이지 제목 h1은 하나만). 바로 아래 진짜 제목이 따로 있으면 p */
	as?: 'h2' | 'p';
}

export default function BorderTitle({ className, text, color, as = 'h2' }: Props) {
	return (
		<StyledBorderTitle $color={color} className={className}>
			<Title as={as} size="small" weight="semiBold" className="title">
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
