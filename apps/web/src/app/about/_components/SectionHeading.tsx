'use client';

import styled from 'styled-components';

interface Props {
	eyebrow: string;
	title: React.ReactNode;
	sub?: React.ReactNode;
	className?: string;
}

/** 시작하기 섹션 제목: 작은 머리말 + 크고 가운데 정렬된 제목 + 한 줄 설명 */
export default function SectionHeading({ eyebrow, title, sub, className }: Props) {
	return (
		<StyledHeading className={className}>
			<p className="eyebrow">{eyebrow}</p>
			<h2 className="heading">{title}</h2>
			{sub && <p className="sub">{sub}</p>}
		</StyledHeading>
	);
}

const StyledHeading = styled.header`
	max-width: 48rem;
	margin: 0 auto 4rem;
	text-align: center;
	word-break: keep-all;

	@media ${({ theme }) => theme.mediaQuery.tablet} {
		margin-bottom: 2.5rem;
	}

	.eyebrow {
		margin: 0 0 1rem;
		font-size: ${({ theme }) => theme.fontSize.small};
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		letter-spacing: 0.08em;
		color: ${({ theme }) => theme.color.primary};
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
		margin: 1.25rem 0 0;
		font-size: ${({ theme }) => theme.fontSize.medium};
		line-height: 1.7;
		color: ${({ theme }) => theme.color.subText};
	}
`;
