'use client';

import styled from 'styled-components';
import BorderTitle from '@/components/common/BorderTitle';

interface Props {
	/** 구분선 제목 (HOW TO USE 등). 다른 섹션(EXPLORE · WHO WE ARE)과 같은 BorderTitle */
	label: string;
	title?: React.ReactNode;
	sub?: React.ReactNode;
	className?: string;
}

/** 시작하기 섹션 제목: 기존 구분선 제목 아래에 큰 제목과 한 줄 설명 */
export default function SectionHeading({ label, title, sub, className }: Props) {
	return (
		<StyledHeading className={className}>
			<BorderTitle text={label} className="border-title" />
			{title && <h2 className="heading">{title}</h2>}
			{sub && <p className="sub">{sub}</p>}
		</StyledHeading>
	);
}

// header 태그는 레이아웃이 1024px 이하에서 좌우 여백을 넣으므로(MainLayout) div로
const StyledHeading = styled.div`
	margin-bottom: 3.5rem;
	word-break: keep-all;

	@media ${({ theme }) => theme.mediaQuery.tablet} {
		margin-bottom: 2.5rem;
	}

	.border-title {
		margin-bottom: 2.5rem;
	}

	.heading {
		margin: 0;
		font-size: clamp(2rem, 5vw, 3.5rem);
		font-weight: 800;
		line-height: 1.2;
		letter-spacing: -0.02em;
		color: ${({ theme }) => theme.color.text};
	}

	.sub {
		margin: 1rem 0 0;
		font-size: ${({ theme }) => theme.fontSize.medium};
		line-height: 1.7;
		color: ${({ theme }) => theme.color.subText};
	}
`;
