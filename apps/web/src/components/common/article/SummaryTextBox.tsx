import styled from "styled-components";

interface Props {
	flex?: number;
	children?: React.ReactNode;
	className?: string;
}

function SummaryTextBox({ children, className, flex }: Props) {
	return (
		<SummaryContainerStyled $flex={flex} className={className}>
			<SummaryTitleStyled>AI 요약</SummaryTitleStyled>
			<SummaryTextBoxStyled>{children}</SummaryTextBoxStyled>
		</SummaryContainerStyled>
	);
}

interface StyledProps {
	$flex?: number;
}

const SummaryContainerStyled = styled.div<StyledProps>`
	flex: ${({ $flex }) => $flex || 1};
	background-color: ${({ theme }) => theme.color.surface};
	border: 1px solid ${({ theme }) => theme.color.border};
	border-radius: ${({ theme }) => theme.borderRadius.soft};
	padding: 1.25rem;
	height: auto;
`;

const SummaryTextBoxStyled = styled.p`
	color: ${({ theme }) => theme.color.mediumGrey};
	/* 요약은 소식마다 한 문단, 문단 사이 빈 줄 (#41) */
	white-space: pre-line;
`;

const SummaryTitleStyled = styled.h5`
	font-size: ${({ theme }) => theme.fontSize.small};
	margin-bottom: 0.5rem;
`;

export default SummaryTextBox;
