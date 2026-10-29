'use client';

import styled from 'styled-components';
import InputSelect from '@/components/common/InputSelect';

interface Props {
	/** 목록 이름 (예: '받은 메일', '북마크', '스크랩한 문장') */
	title: string;
	count: number;
	/** 오른쪽 도구: 보기 칩 · 정렬 · 선택 */
	children?: React.ReactNode;
}

/**
 * 마이페이지 목록 머리 (내 뉴스레터 · 북마크 · 스크랩 공통): 왼쪽 '이름 N', 오른쪽 보기 칩 · 정렬 · 선택.
 * 오른쪽 칩 묶음은 몇 개뿐이라 이름표('보기')는 화면에서 빼고 묶음 이름(aria-label)으로만 둔다
 */
export default function ListHead({ title, count, children }: Props) {
	return (
		<StyledListHead>
			<h3>
				{title} <span className="count">{count}</span>
			</h3>
			{children && <div className="list-tools">{children}</div>}
		</StyledListHead>
	);
}

interface SortProps<T extends string> {
	value: T;
	options: { value: T; label: string }[];
	onChange: (value: T) => void;
}

/** 정렬 고르기: 공통 선택 목록(InputSelect)의 작은 칸 */
export function SortSelect<T extends string>({ value, options, onChange }: SortProps<T>) {
	return (
		<InputSelect
			name="sort"
			size="small"
			ariaLabel="정렬"
			value={value}
			options={options}
			onChange={(next) => onChange(next as T)}
		/>
	);
}

const StyledListHead = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem 1rem;
	margin-top: 0.5rem;

	h3 {
		margin: 0;
		font-size: ${({ theme }) => theme.fontSize.medium};
		font-weight: ${({ theme }) => theme.fontWeight.bold};
	}

	.count {
		margin-left: 0.25rem;
		color: ${({ theme }) => theme.color.primary};
	}

	.list-tools {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 0.75rem;
	}

	.list-tools [role='group'] .chips-label {
		display: none;
	}
`;

/**
 * 목록 머리 아래 거르기 줄 (예: '관심사 [전체] [IT] …'). 휴대폰에서는 이름표 옆에 칩을 한 줄로 두고 옆으로 밀어 본다
 */
export const FilterRow = styled.div`
	margin-top: -0.25rem;

	[role='group'] .chips-label {
		width: auto;
		margin-right: 0.25rem;
	}

	@media ${({ theme }) => theme.mediaQuery.mobile} {
		[role='group'] {
			flex-wrap: nowrap;
			overflow-x: auto;
			scrollbar-width: none;

			.chips-label {
				flex-basis: auto;
			}

			button {
				flex-shrink: 0;
			}
		}
	}
`;
