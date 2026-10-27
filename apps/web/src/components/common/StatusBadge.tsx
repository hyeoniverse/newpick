'use client';

import styled, { css } from 'styled-components';

export type BadgeTone = 'success' | 'failed' | 'warning' | 'neutral';

/** 작업 · 기록 상태 → 배지 색 (success · failed/error · partial/running · 그 밖) */
export const toneOf = (status: string | null | undefined): BadgeTone =>
	status === 'success'
		? 'success'
		: status === 'failed' || status === 'error'
			? 'failed'
			: status === 'partial' || status === 'running'
				? 'warning'
				: 'neutral';

interface Props {
	tone: BadgeTone;
	children: React.ReactNode;
	className?: string;
}

/** 상태 배지 (공통, 관리자 표에서 시작): 성공(강조색) · 실패(빨강) · 진행 중/일부 실패(노랑) · 건너뜀/기록 없음(회색) */
export default function StatusBadge({ tone, children, className }: Props) {
	return (
		<StyledBadge $tone={tone} className={className}>
			{children}
		</StyledBadge>
	);
}

const StyledBadge = styled.span<{ $tone: BadgeTone }>`
	display: inline-block;
	flex-shrink: 0;
	padding: 0.125rem 0.5rem;
	border-radius: ${({ theme }) => theme.radius.chip};
	font-size: ${({ theme }) => theme.fontSize.extraSmall};
	font-weight: ${({ theme }) => theme.fontWeight.semiBold};
	white-space: nowrap;

	${({ $tone, theme }) =>
		$tone === 'success'
			? css`
					background: ${theme.color.tertiary};
					color: ${theme.color.primary};
				`
			: $tone === 'failed'
				? css`
						background: color-mix(in srgb, ${theme.color.error} 14%, transparent);
						color: ${theme.color.error};
					`
				: $tone === 'warning'
					? css`
							background: color-mix(in srgb, ${theme.color.warning} 20%, transparent);
							color: ${theme.color.text};
						`
					: css`
							background: ${theme.color.neutral};
							color: ${theme.color.subText};
						`}
`;
