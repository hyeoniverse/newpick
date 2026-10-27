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

	const custom = filters.period === 'custom';

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
				<div className={custom ? 'periods custom' : 'periods'} role="group" aria-label="기간">
					{PERIOD_OPTIONS.map((option) => {
						// 직접 지정 중에는 오늘 · 1주 · 1달을 옆으로 접어 그 자리에 날짜 칸이 들어온다 (줄이 늘지 않게)
						const folded = custom && option.value !== 'all' && option.value !== 'custom';
						return (
							<button
								key={option.value}
								type="button"
								className={folded ? 'folded' : option.value === 'all' ? 'all' : undefined}
								aria-hidden={folded || undefined}
								tabIndex={folded ? -1 : undefined}
								aria-pressed={filters.period === option.value}
								onClick={() => setPeriod(option.value)}
							>
								{option.label}
							</button>
						);
					})}
					{/* 직접 지정 바로 오른쪽 */}
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
		/* 기간 줄이 자기 폭을 보고 '전체 기간'까지 접을지 정한다 (아래 @container) */
		container-type: inline-size;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 1rem;
	}

	/* 기간 버튼 + 직접 지정 날짜 칸. 자리가 모자라면 날짜 칸만 다음 줄로 */
	/* 기간 버튼 + 직접 지정 날짜 칸. 직접 지정이면 오늘 · 1주 · 1달이 접혀 한 줄에 들어간다 */
	@keyframes datesIn {
		from {
			opacity: 0;
			transform: translateX(-0.5rem);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	.periods {
		display: flex;
		align-items: center;
		max-width: 100%;
		/* 날짜 칸(2.25rem)이 나타나도 줄 높이가 그대로이게 처음부터 그 높이 */
		min-height: 2.25rem;

		.dates {
			flex-shrink: 0;
			margin-left: 0.25rem;
			animation: datesIn 0.25s ease-out;
		}

		> button {
			flex-shrink: 0;
			max-width: 6rem;
			margin-right: 0.25rem;
			overflow: hidden;
			transition:
				max-width 0.25s ease,
				padding 0.25s ease,
				margin 0.25s ease,
				opacity 0.2s ease,
				visibility 0.25s;
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

			/* 접힘: 폭 · 여백을 0으로 줄이며 사라진다 */
			&.folded {
				max-width: 0;
				margin-right: 0;
				padding-left: 0;
				padding-right: 0;
				opacity: 0;
				visibility: hidden;
			}
		}

		@media (prefers-reduced-motion: reduce) {
			.dates,
			> button {
				animation: none;
				transition: none;
			}
		}

		/* 좁은 화면: 버튼 · 날짜 칸을 줄여(달력 아이콘 빼고) 한 줄에 */
		@media ${({ theme }) => theme.mediaQuery.tablet} {
			> button {
				padding: 0.375rem 0.5rem;
			}

			.dates .control {
				width: 6.5rem;
			}

			.dates .calendar-icon {
				display: none;
			}

			.dates .date-input {
				padding: 0 0.5rem;
				font-size: ${({ theme }) => theme.fontSize.extraSmall};
				text-align: center;
			}
		}

		/* 휴대폰: 날짜 칸을 더 줄여 '전체 기간 · 직접 지정 · [시작] ~ [종료]'가 한 줄에 */
		@media ${({ theme }) => theme.mediaQuery.mobile} {
			.dates .control {
				width: 5.25rem;
			}

			.dates .date-input {
				padding: 0 0.25rem;
				font-size: 0.75rem;
			}
		}

		/* 그래도 자리가 모자라면(폭 22rem 미만, 예: 375px 휴대폰) '전체 기간'도 접는다. 직접 지정을 다시 누르면 전체로 돌아간다 */
		@container (max-width: 22rem) {
			&.custom > button.all {
				max-width: 0;
				margin-right: 0;
				padding-left: 0;
				padding-right: 0;
				opacity: 0;
				visibility: hidden;
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
