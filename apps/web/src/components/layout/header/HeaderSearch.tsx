'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { LuSearch, LuX } from 'react-icons/lu';
import styled from 'styled-components';
import { readFilters, toPageHref } from '@/utils/newsletterSearch';

/**
 * 헤더 검색 (#20). 어느 화면에서나 지난 뉴스레터를 찾는다.
 * PC는 헤더 안의 작은 칸, 모바일은 돋보기를 누르면 헤더 아래로 한 줄이 펼쳐진다.
 * 목록(/articles)에서 찾으면 고른 관심사 · 기간 · 정렬은 그대로 두고 검색어만 바꾼다
 */
export default function HeaderSearch() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const onList = pathname === '/articles';
	// 태그로 거르는 중이면 칸에 '#태그'를 보여 준다
	const current = onList
		? (searchParams.get('q') ?? (searchParams.get('keyword') ? `#${searchParams.get('keyword')}` : ''))
		: '';

	const [q, setQ] = useState(current);
	const [error, setError] = useState('');
	const [open, setOpen] = useState(false); // 모바일에서 펼쳤는지
	const inputRef = useRef<HTMLInputElement>(null);

	// 다른 화면으로 가거나 뒤로 가면 입력칸도 주소를 따라간다
	useEffect(() => setQ(current), [current]);
	useEffect(() => setOpen(false), [pathname]);

	const submit = (event: React.FormEvent) => {
		event.preventDefault();
		const value = q.trim();
		if (value && !value.startsWith('#') && [...value.replace(/\s/g, '')].length < 2) {
			setError('2글자 이상 입력해 주세요');
			return;
		}
		setError('');
		const base = onList ? readFilters(searchParams) : readFilters(new URLSearchParams());
		// '#코스피'처럼 #로 시작하면 태그(키워드)로 거른다
		if (value.startsWith('#')) {
			const keyword = value.replace(/^#+/, '').trim();
			if (keyword) {
				router.push(toPageHref({ ...base, q: '', keyword }));
				inputRef.current?.blur();
				return;
			}
		}
		router.push(toPageHref({ ...base, q: value }));
		inputRef.current?.blur();
	};

	const toggle = () => setOpen((prev) => !prev);

	// 펼치면 바로 입력할 수 있게 (보이게 바뀐 뒤에 포커스)
	useEffect(() => {
		if (open) inputRef.current?.focus();
	}, [open]);

	return (
		<StyledHeaderSearch className={open ? 'open' : ''}>
			<button
				type="button"
				className="search-toggle"
				aria-label={open ? '검색 닫기' : '검색'}
				aria-expanded={open}
				aria-controls="header-search"
				onClick={toggle}
			>
				{open ? <LuX aria-hidden /> : <LuSearch aria-hidden />}
			</button>
			<form id="header-search" role="search" className="search" onSubmit={submit}>
				<LuSearch className="search-icon" aria-hidden />
				<input
					ref={inputRef}
					type="search"
					name="q"
					value={q}
					onChange={(event) => {
						setQ(event.target.value);
						setError('');
					}}
					placeholder={error || '검색어 또는 #태그'}
					aria-label="뉴스레터 검색어"
					aria-invalid={Boolean(error) || undefined}
					maxLength={50}
					className={error ? 'invalid' : ''}
				/>
				{error && (
					<span className="sr-only" role="alert">
						{error}
					</span>
				)}
			</form>
		</StyledHeaderSearch>
	);
}

const StyledHeaderSearch = styled.div`
	display: flex;
	align-items: center;

	.search-toggle {
		display: none;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		color: ${({ theme }) => theme.color.text};
		cursor: pointer;

		svg {
			width: 1.25rem;
			height: 1.25rem;
		}
	}

	.search {
		position: relative;
		display: flex;
		align-items: center;
		width: 14rem;
		height: 2.125rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		background: ${({ theme }) => theme.color.surface};
		transition:
			border-color 0.2s ease,
			width 0.2s ease;

		&:focus-within {
			width: 18rem;
			border-color: ${({ theme }) => theme.color.primary};
			background: ${({ theme }) => theme.color.background};
		}

		/* 포커스 표시는 칸 전체에 한 번만 */
		&:has(input:focus-visible) {
			outline: 2px solid ${({ theme }) => theme.color.primary};
			outline-offset: 2px;
		}

		.search-icon {
			position: absolute;
			left: 0.625rem;
			width: 1rem;
			height: 1rem;
			color: ${({ theme }) => theme.color.subText};
			pointer-events: none;
		}

		input {
			width: 100%;
			height: 100%;
			padding: 0 0.75rem 0 2.125rem;
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

			&.invalid::placeholder {
				color: ${({ theme }) => theme.color.error};
			}
		}
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}

	/* 태블릿 이하: 돋보기만, 누르면 헤더 아래로 검색 줄 */
	@media ${({ theme }) => theme.mediaQuery.tablet} {
		.search-toggle {
			display: flex;
		}

		/* 헤더(높이 3rem, 화면 위에 고정) 바로 아래에 붙는 한 줄 */
		.search {
			position: fixed;
			top: 3rem;
			left: 0;
			right: 0;
			width: 100%;
			height: 3rem;
			padding: 0 1rem;
			border: none;
			border-bottom: 1px solid ${({ theme }) => theme.color.border};
			background: ${({ theme }) => theme.color.background};
			visibility: hidden;
			opacity: 0;
			transform: translateY(-0.5rem);
			transition:
				opacity 0.2s ease,
				transform 0.2s ease,
				visibility 0.2s;

			&:focus-within {
				width: 100%;
			}

			/* 헤더 선과 겹치지 않게 포커스 테두리는 안쪽에 */
			&:has(input:focus-visible) {
				outline-offset: -2px;
			}

			.search-icon {
				left: 1.625rem;
			}

			input {
				padding-left: 2rem;
				font-size: 1rem; /* iOS에서 확대되지 않게 16px */
			}
		}

		/* 펼칠 때는 바로 보이게(visibility는 기다리지 않음): 그래야 곧바로 입력칸에 포커스가 간다 */
		&.open .search {
			visibility: visible;
			opacity: 1;
			transform: none;
			transition:
				opacity 0.2s ease,
				transform 0.2s ease;
		}
	}
`;

/**
 * 주소를 읽기 전(첫 HTML)에 보여 줄 같은 모양의 검색 칸. 자바스크립트 없이도 /articles?q= 로 보낸다
 */
export function HeaderSearchFallback() {
	return (
		<StyledHeaderSearch>
			<button type="button" className="search-toggle" aria-label="검색" disabled>
				<LuSearch aria-hidden />
			</button>
			<form role="search" className="search" action="/articles" method="get">
				<LuSearch className="search-icon" aria-hidden />
				<input type="search" name="q" placeholder="뉴스레터 검색" aria-label="뉴스레터 검색어" maxLength={50} />
			</form>
		</StyledHeaderSearch>
	);
}
