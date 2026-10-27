'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { LuX } from 'react-icons/lu';
import styled from 'styled-components';
import { PERIOD_OPTIONS, SearchPeriod, readFilters, toPageHref } from '@/utils/newsletterSearch';
import { kstDate } from '@/utils/formatter';
import { DateRangePicker } from '@/components/common/DatePicker';

/**
 * 뉴스레터 목록 위 필터 줄 (#20): 기간 · 키워드(태그에서 들어옴).
 * 검색어는 헤더 검색칸, 정렬은 목록 머리의 최신순 · 인기순, 관심사는 위 칩. 모두 주소에 남는다
 */
export default function SearchFilters() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const filters = readFilters(searchParams);

	const go = (next: Partial<typeof filters>, push = false) => {
		const href = toPageHref({ ...filters, ...next });
		if (push) router.push(href, { scroll: false });
		else router.replace(href, { scroll: false });
	};

	const setPeriod = (period: SearchPeriod) =>
		go(period === 'custom' ? { period, from: filters.from || kstDate(29), to: filters.to || kstDate(0) } : { period });

	return (
		<StyledSearchFilters>
			<div className="filters">
				<div className="periods" role="group" aria-label="기간">
					{PERIOD_OPTIONS.map((option) => (
						<button
							key={option.value}
							type="button"
							aria-pressed={filters.period === option.value}
							onClick={() => setPeriod(option.value)}
						>
							{option.label}
						</button>
					))}
				</div>
				{filters.period === 'custom' && (
					<DateRangePicker
						size="small"
						start={filters.from}
						end={filters.to}
						max={kstDate(0)}
						onChange={({ start, end }) => go({ from: start, to: end })}
						className="dates"
					/>
				)}
				{filters.q && (
					<button type="button" className="keyword" onClick={() => go({ q: '' }, true)}>
						‘{filters.q}’
						<LuX aria-label="검색어 지우기" />
					</button>
				)}
				{filters.keyword && (
					<button type="button" className="keyword" onClick={() => go({ keyword: '' })}>
						#{filters.keyword}
						<LuX aria-label="키워드 조건 지우기" />
					</button>
				)}
			</div>
		</StyledSearchFilters>
	);
}

const StyledSearchFilters = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	width: 100%;

	.filters {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 1rem;
	}

	/* 기간: 모바일은 접히지 않고 한 줄을 옆으로 넘긴다 */
	.periods {
		display: flex;
		gap: 0.25rem;
		max-width: 100%;
		overflow-x: auto;
		scrollbar-width: none;

		button {
			flex-shrink: 0;
			padding: 0.375rem 0.75rem;
			border-radius: ${({ theme }) => theme.radius.chip};
			font-size: ${({ theme }) => theme.fontSize.small};
			color: ${({ theme }) => theme.color.subText};
			cursor: pointer;
			white-space: nowrap;

			&:hover {
				color: ${({ theme }) => theme.color.text};
			}

			&[aria-pressed='true'] {
				background: ${({ theme }) => theme.color.tertiary};
				color: ${({ theme }) => theme.color.primary};
				font-weight: ${({ theme }) => theme.fontWeight.semiBold};
			}
		}
	}

	.keyword {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem 0.25rem 0.75rem;
		border-radius: ${({ theme }) => theme.radius.chip};
		background: ${({ theme }) => theme.color.primary};
		color: #ffffff;
		font-size: ${({ theme }) => theme.fontSize.small};
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		cursor: pointer;
	}
`;
