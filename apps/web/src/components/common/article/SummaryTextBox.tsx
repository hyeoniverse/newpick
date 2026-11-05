import styled from 'styled-components';
import { summaryItems } from '@/utils/summaryItems';

interface Props {
	flex?: number;
	children?: React.ReactNode;
	className?: string;
	/** 제목 단계: 상세는 기사 제목(h1) 바로 아래라 h2, 마이페이지는 뉴스레터 제목(h2) 아래라 h3 (#16) */
	headingAs?: 'h2' | 'h3';
}

/** AI 요약. 글(문자열)이면 문장마다 한 줄씩 목록으로 (소식별), 한 문장뿐이면 문단 그대로 */
function SummaryTextBox({ children, className, flex, headingAs = 'h2' }: Props) {
	const items = typeof children === 'string' ? summaryItems(children) : [];
	return (
		<SummaryContainerStyled $flex={flex} className={className} data-track-section="summary">
			<SummaryTitleStyled as={headingAs}>AI 요약</SummaryTitleStyled>
			{items.length > 1 ? (
				<SummaryListStyled>
					{items.map((item, i) => (
						<li key={i}>{item}</li>
					))}
				</SummaryListStyled>
			) : (
				<SummaryTextBoxStyled>{children}</SummaryTextBoxStyled>
			)}
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

const SummaryListStyled = styled.ul`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	margin: 0;
	padding: 0;
	list-style: none;
	color: ${({ theme }) => theme.color.mediumGrey};
	word-break: keep-all;

	/* 글머리 점은 직접 그린다 (사이트 공통 CSS가 목록 점을 지운다) */
	li {
		position: relative;
		margin: 0;
		padding-left: 1rem;
		line-height: 1.6;

		&::before {
			content: '';
			position: absolute;
			left: 0.125rem;
			top: 0.7em;
			width: 0.3125rem;
			height: 0.3125rem;
			border-radius: 50%;
			background: ${({ theme }) => theme.color.primary};
		}
	}
`;

const SummaryTitleStyled = styled.h2`
	font-size: ${({ theme }) => theme.fontSize.small};
	font-weight: ${({ theme }) => theme.fontWeight.bold};
	margin-bottom: 0.5rem;
`;

export default SummaryTextBox;
