'use client';

import styled from 'styled-components';
import { chartTones } from './TrendChart';

interface Row {
	key: string;
	label: string;
	value: number;
	/** 값 옆 작은 글 (예: '3편') */
	note?: string;
}

interface Props {
	rows: Row[];
	format?: (value: number) => string;
	/** 목록 이름 (화면 읽기 프로그램용) */
	label: string;
}

/**
 * 나눔을 가로 막대로 (관리자 통계 #122): 이름 · 막대 · 값. 큰 값이 가장 긴 막대.
 * 한 계열이라 범례 없이, 값은 막대 끝에 글로 (색은 막대에만)
 */
export default function BarList({ rows, format = (v) => v.toLocaleString(), label }: Props) {
	const max = Math.max(0, ...rows.map((r) => r.value));
	return (
		<StyledBarList aria-label={label}>
			{rows.map((row) => (
				<li key={row.key}>
					<span className="name">{row.label}</span>
					<span className="track" aria-hidden>
						{row.value > 0 && <span className="bar" style={{ width: `${(row.value / max) * 100}%` }} />}
					</span>
					<span className="value">
						{format(row.value)}
						{row.note && <small>{row.note}</small>}
					</span>
				</li>
			))}
		</StyledBarList>
	);
}

const StyledBarList = styled.ul`
	${chartTones}
	display: flex;
	flex-direction: column;
	gap: 0.625rem;

	li {
		display: grid;
		grid-template-columns: minmax(5rem, 8rem) 1fr minmax(4.5rem, auto);
		align-items: center;
		gap: 0.75rem;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
	}

	.name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: ${({ theme }) => theme.color.text};
	}

	.track {
		height: 0.75rem;
	}

	.bar {
		display: block;
		height: 100%;
		min-width: 2px;
		border-radius: 0 4px 4px 0;
		background: var(--tone-a);
	}

	.value {
		text-align: right;
		font-variant-numeric: tabular-nums;
		color: ${({ theme }) => theme.color.text};

		small {
			margin-left: 0.375rem;
			color: ${({ theme }) => theme.color.subText};
		}
	}
`;
