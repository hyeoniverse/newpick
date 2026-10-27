'use client';

import styled from 'styled-components';

export interface ChipOption {
	label: string;
	value: string;
}

interface Props {
	/** 줄 앞 이름표 (예: '관심사'). 화면 읽기 프로그램의 묶음 이름으로도 쓴다 */
	label: string;
	/** 묶음 이름을 이름표와 다르게 읽히고 싶을 때 (예: '받은 관심사') */
	ariaLabel?: string;
	options: ChipOption[];
	/** 지금 고른 값. 보통 ''가 '전체' */
	value: string;
	onChange: (value: string) => void;
	className?: string;
}

/**
 * 거르기 칩 한 줄 (공통, 관리자 목록에서 시작): '관심사 [전체] [IT] [정치] …'. 하나만 고른다.
 * 이름표 폭을 맞춰 여러 줄을 쌓아도 칩이 같은 자리에서 시작하고, 좁은 화면에서는 이름표가 위 한 줄로 간다
 */
export default function FilterChips({ label, ariaLabel, options, value, onChange, className }: Props) {
	return (
		<StyledFilterChips role="group" aria-label={ariaLabel ?? label} className={className}>
			<span className="chips-label">{label}</span>
			{options.map((option) => (
				<button
					key={option.value}
					type="button"
					aria-pressed={value === option.value}
					onClick={() => onChange(option.value)}
				>
					{option.label}
				</button>
			))}
		</StyledFilterChips>
	);
}

const StyledFilterChips = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.375rem;

	.chips-label {
		flex-shrink: 0;
		width: 3.5rem;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		color: ${({ theme }) => theme.color.subText};

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			flex-basis: 100%;
		}
	}

	button {
		display: inline-flex;
		align-items: center;
		height: 2rem;
		padding: 0 0.75rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.chip};
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.mediumGrey};
		cursor: pointer;

		&[aria-pressed='true'] {
			border-color: ${({ theme }) => theme.color.primary};
			background: ${({ theme }) => theme.color.primary};
			color: #ffffff;
		}
	}
`;
