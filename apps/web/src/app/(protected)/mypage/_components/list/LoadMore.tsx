'use client';

import styled from 'styled-components';
import { LuChevronDown, LuLoaderCircle } from 'react-icons/lu';

interface Props {
	/** 아직 안 불러온 수 */
	remaining: number;
	loading: boolean;
	onClick: () => void;
}

/** 목록 끝 '더 보기 (N개 남음)': 북마크 · 스크랩을 한 쪽씩 이어 붙인다. 다 불러오면 그리지 않는다 */
export default function LoadMore({ remaining, loading, onClick }: Props) {
	if (remaining <= 0) return null;
	return (
		<StyledLoadMore type="button" onClick={onClick} disabled={loading} aria-busy={loading || undefined}>
			{loading ? <LuLoaderCircle className="spin" aria-hidden /> : <LuChevronDown aria-hidden />}더 보기{' '}
			<span className="left">{remaining.toLocaleString()}개 남음</span>
		</StyledLoadMore>
	);
}

const StyledLoadMore = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.375rem;
	width: 100%;
	height: 2.75rem;
	border: 1px solid ${({ theme }) => theme.color.border};
	border-radius: ${({ theme }) => theme.radius.surface};
	font: inherit;
	font-size: ${({ theme }) => theme.fontSize.extraSmall};
	color: ${({ theme }) => theme.color.text};
	cursor: pointer;

	.left {
		color: ${({ theme }) => theme.color.subText};
	}

	svg {
		width: 1rem;
		height: 1rem;
	}

	.spin {
		animation: load-more-spin 0.8s linear infinite;
	}

	@keyframes load-more-spin {
		to {
			transform: rotate(360deg);
		}
	}

	&:hover:not(:disabled) {
		border-color: ${({ theme }) => theme.color.primary};
		color: ${({ theme }) => theme.color.primary};
	}

	&:disabled {
		cursor: progress;
	}
`;
