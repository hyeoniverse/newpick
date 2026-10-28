import styled from "styled-components";

interface Props {
	flex?: number;
	children?: React.ReactNode;
	className?: string;
	/** 제목 단계: 상세는 기사 제목(h1) 바로 아래라 h2, 마이페이지는 뉴스레터 제목(h2) 아래라 h3 (#16) */
	headingAs?: 'h2' | 'h3';
}

function SummaryTextBox({ children, className, flex, headingAs = 'h2' }: Props) {
	return (
		<SummaryContainerStyled $flex={flex} className={className} data-track-section="summary">
			<SummaryTitleStyled as={headingAs}>AI 요약</SummaryTitleStyled>
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
	border-radius: ${({ theme }) => theme.radius.surface};
	padding: 1.25rem;
	height: auto;
`;

const SummaryTextBoxStyled = styled.p`
	color: ${({ theme }) => theme.color.mediumGrey};
	/* 요약은 소식마다 한 문단, 문단 사이 빈 줄 (#41) */
	white-space: pre-line;
`;

const SummaryTitleStyled = styled.h2`
	font-size: ${({ theme }) => theme.fontSize.small};
	font-weight: ${({ theme }) => theme.fontWeight.bold};
	margin-bottom: 0.5rem;
`;

export default SummaryTextBox;
