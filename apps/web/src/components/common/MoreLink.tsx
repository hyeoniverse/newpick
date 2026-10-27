'use client';

import Link from 'next/link';
import styled from 'styled-components';

interface Props {
	href: string;
	children: React.ReactNode;
	className?: string;
}

/** 다른 화면으로 가는 짧은 링크 (공통, 관리자 대시보드에서 시작): '전체 보기 →'. 누를 수 있는 것이라 강조색, 올리면 밑줄 */
export default function MoreLink({ href, children, className }: Props) {
	return (
		<StyledMoreLink href={href} className={className}>
			{children}
		</StyledMoreLink>
	);
}

const StyledMoreLink = styled(Link)`
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	width: fit-content;
	font-size: ${({ theme }) => theme.fontSize.small};
	font-weight: ${({ theme }) => theme.fontWeight.medium};
	color: ${({ theme }) => theme.color.primary};
	white-space: nowrap;

	svg {
		width: 0.875rem;
		height: 0.875rem;
	}

	&:hover {
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}
`;
