'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchPopularKeywords } from '@/api/article';
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

	// 지금 보는 관심사에서 최근 30일 자주 나온 태그
	const { data: keywords = [] } = useQuery({
		queryKey: ['popularKeywords', filters.categoryId],
		queryFn: () => fetchPopularKeywords(filters.categoryId || undefined),
		staleTime: 1000 * 60 * 10,
	});

	// 고른 기간을 다시 누르면 해제하고 전체 기간으로
	const setPeriod = (period: SearchPeriod) =>
		filters.period === period && period !== 'all'
			? go({ period: 'all' })
			: go(
					period === 'custom'
						? { period, from: filters.from || kstDate(29), to: filters.to || kstDate(0) }
						: { period },
				);

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
					{/* 직접 지정 바로 오른쪽. 자리가 모자라면 날짜 칸만 다음 줄로 (기간 버튼은 잘리지 않게) */}
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
				</div>
				{filters.q && (
					<button type="button" className="keyword" onClick={() => go({ q: '' }, true)}>
						‘{filters.q}’
						<LuX aria-label="검색어 지우기" />
					</button>
				)}
				{/* 고른 태그가 아래 태그 줄에 있으면 거기서 켜짐으로 보이므로 칩은 그 밖의 태그일 때만 */}
				{filters.keyword && !keywords.some(({ keyword }) => keyword === filters.keyword) && (
					<button type="button" className="keyword" onClick={() => go({ keyword: '' })}>
						#{filters.keyword}
						<LuX aria-label="키워드 조건 지우기" />
					</button>
				)}
			</div>
			{keywords.length > 0 && (
				<div className="tags" role="group" aria-label="자주 나온 태그 (최근 30일)">
					{/* 이름표는 제자리, 태그만 옆으로 넘긴다 */}
					<span className="tags-label">태그</span>
					<div className="tags-list">
						{keywords.map(({ keyword, count }) => {
							const active = filters.keyword === keyword;
							return (
								<button
									key={keyword}
									type="button"
									aria-pressed={active}
									title={`최근 30일 ${count}편`}
									onClick={() => go({ keyword: active ? '' : keyword })}
								>
									<span className="hash">#</span>
									{keyword}
								</button>
							);
						})}
					</div>
				</div>
			)}
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

	/* 기간 버튼 + 직접 지정 날짜 칸. 자리가 모자라면 날짜 칸만 다음 줄로 */
	.periods {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem;
		max-width: 100%;

		.dates {
			flex-shrink: 0;
			margin-left: 0.25rem;
		}

		> button {
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

	/* 자주 나온 태그: 카드 태그와 같은 모양(얇은 테두리 · 진한 회색 · #만 강조색), 고르면 강조색 */
	.tags {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		max-width: 100%;

		.tags-label {
			flex-shrink: 0;
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};
			color: ${({ theme }) => theme.color.subText};
		}

		/* 옆으로 넘기는 칸. 넘기는 칸은 위아래도 잘라 내므로, 테두리 · 초점 표시가 잘리지 않게 위아래 여유를 둔다 */
		.tags-list {
			display: flex;
			align-items: center;
			gap: 0.375rem;
			min-width: 0;
			padding: 0.25rem 0.125rem;
			overflow-x: auto;
			scrollbar-width: none;

			&::-webkit-scrollbar {
				display: none;
			}
		}

		button {
			flex-shrink: 0;
			padding: 0.0625rem 0.5rem;
			border: 1px solid ${({ theme }) => theme.color.border};
			border-radius: ${({ theme }) => theme.radius.chip};
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			font-weight: ${({ theme }) => theme.fontWeight.medium};
			line-height: 1.6;
			color: ${({ theme }) => theme.color.mediumGrey};
			white-space: nowrap;
			cursor: pointer;

			.hash {
				margin-right: 0.0625rem;
				color: ${({ theme }) => theme.color.primary};
			}

			&:hover {
				border-color: ${({ theme }) => theme.color.primary};
				color: ${({ theme }) => theme.color.primary};
			}

			&[aria-pressed='true'] {
				border-color: ${({ theme }) => theme.color.primary};
				background: ${({ theme }) => theme.color.primary};
				color: #ffffff;

				.hash {
					color: inherit;
				}
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
