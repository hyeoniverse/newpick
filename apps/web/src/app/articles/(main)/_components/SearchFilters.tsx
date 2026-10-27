'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LuSearch, LuX } from 'react-icons/lu';
import styled from 'styled-components';
import { PERIOD_OPTIONS, SearchPeriod, readFilters, toPageHref } from '@/utils/newsletterSearch';
import { kstDate } from '@/utils/formatter';

/**
 * 뉴스레터 목록 위 검색창과 필터 줄 (#20): 검색어 · 키워드(태그에서 들어옴) · 기간.
 * 정렬은 목록 머리의 최신순 · 인기순, 관심사는 위 칩. 모두 주소에 남는다
 */
export default function SearchFilters() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const filters = readFilters(searchParams);
	const [q, setQ] = useState(filters.q);
	const [error, setError] = useState('');

	// 뒤로 가기 등으로 주소가 바뀌면 입력칸도 따라간다
	useEffect(() => setQ(filters.q), [filters.q]);

	const go = (next: Partial<typeof filters>, push = false) => {
		const href = toPageHref({ ...filters, ...next });
		if (push) router.push(href, { scroll: false });
		else router.replace(href, { scroll: false });
	};

	const submit = (event: React.FormEvent) => {
		event.preventDefault();
		const value = q.trim();
		if (value && [...value.replace(/\s/g, '')].length < 2) {
			setError('검색어는 2글자 이상 입력해 주세요.');
			return;
		}
		setError('');
		go({ q: value }, true);
	};

	const setPeriod = (period: SearchPeriod) =>
		go(period === 'custom' ? { period, from: filters.from || kstDate(29), to: filters.to || kstDate(0) } : { period });

	return (
		<StyledSearchFilters>
			<form role="search" className="search" onSubmit={submit}>
				<LuSearch className="search-icon" aria-hidden />
				<input
					type="search"
					name="q"
					value={q}
					onChange={(event) => {
						setQ(event.target.value);
						setError('');
					}}
					placeholder="지난 뉴스레터 검색 (2글자 이상)"
					aria-label="뉴스레터 검색어"
					aria-invalid={Boolean(error) || undefined}
					aria-describedby={error ? 'search-error' : undefined}
					maxLength={50}
				/>
				{filters.q && (
					<button type="button" className="clear" aria-label="검색어 지우기" onClick={() => go({ q: '' }, true)}>
						<LuX aria-hidden />
					</button>
				)}
				<button type="submit" className="submit">
					검색
				</button>
			</form>
			{error && (
				<p id="search-error" className="error" role="alert">
					{error}
				</p>
			)}

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
					<div className="dates">
						<input
							type="date"
							aria-label="시작 날짜"
							value={filters.from}
							max={filters.to || undefined}
							onChange={(event) => go({ from: event.target.value })}
						/>
						<span aria-hidden>~</span>
						<input
							type="date"
							aria-label="끝 날짜"
							value={filters.to}
							min={filters.from || undefined}
							onChange={(event) => go({ to: event.target.value })}
						/>
					</div>
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

	.search {
		position: relative;
		display: flex;
		align-items: center;
		width: 100%;
		max-width: 36rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		background: ${({ theme }) => theme.color.background};
		transition: border-color 0.2s ease;

		/* 포커스 표시는 칸 전체에 한 번만 (안쪽 입력칸의 테두리와 겹치지 않게) */
		&:has(input:focus-visible) {
			outline: 2px solid ${({ theme }) => theme.color.primary};
			outline-offset: 2px;
		}

		&:focus-within {
			border-color: ${({ theme }) => theme.color.primary};
		}

		.search-icon {
			position: absolute;
			left: 0.875rem;
			width: 1.125rem;
			height: 1.125rem;
			color: ${({ theme }) => theme.color.subText};
		}

		input {
			flex: 1;
			min-width: 0;
			height: 2.75rem;
			padding: 0 0.5rem 0 2.5rem;
			border: none;
			background: transparent;
			font-size: ${({ theme }) => theme.fontSize.small};
			color: ${({ theme }) => theme.color.text};

			&::-webkit-search-cancel-button {
				display: none;
			}

			&:focus-visible {
				outline: none;
			}
		}

		.clear {
			display: flex;
			padding: 0.5rem;
			color: ${({ theme }) => theme.color.subText};
			cursor: pointer;
		}

		.submit {
			align-self: stretch;
			padding: 0 1.125rem;
			background: ${({ theme }) => theme.color.primary};
			color: #ffffff;
			font-size: ${({ theme }) => theme.fontSize.small};
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};
			cursor: pointer;
		}
	}

	.error {
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.error};
	}

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

	.dates {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		color: ${({ theme }) => theme.color.subText};

		input {
			height: 2.25rem;
			padding: 0 0.5rem;
			border: 1px solid ${({ theme }) => theme.color.border};
			background: ${({ theme }) => theme.color.background};
			font-size: ${({ theme }) => theme.fontSize.small};
			color: ${({ theme }) => theme.color.text};
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
