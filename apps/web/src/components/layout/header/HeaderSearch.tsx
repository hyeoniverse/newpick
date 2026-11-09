'use client';

import { ROUTES } from '@/constants/routes';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { LuSearch, LuX } from 'react-icons/lu';
import { cx } from '@/styles/tw';
import { readFilters, toPageHref } from '@/utils/newsletterSearch';

const ROOT = 'flex items-center';
const TOGGLE =
	'search-toggle hidden size-9 cursor-pointer items-center justify-center text-text tablet:flex [&_svg]:size-5';
/*
 * PC: 헤더 안 작은 칸, 누르면 넓어진다. 포커스 표시는 칸 전체에 한 번만.
 * 태블릿 이하: 헤더(높이 3rem, 화면 위에 고정) 바로 아래 한 줄. 펼칠 때(.open)는 바로 보이게(visibility는 기다리지 않음): 그래야 곧바로 입력칸에 포커스가 간다
 */
const FORM = cx(
	'search relative flex h-[2.125rem] w-56 items-center border border-solid border-border bg-surface [transition:border-color_0.2s_ease,width_0.2s_ease]',
	'focus-within:w-72 focus-within:border-primary focus-within:bg-background has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-primary',
	'tablet:invisible tablet:fixed tablet:top-12 tablet:right-0 tablet:left-0 tablet:h-12 tablet:w-full tablet:border-0 tablet:border-b tablet:border-solid tablet:bg-background tablet:px-4 tablet:opacity-0 tablet:[transform:translateY(-0.5rem)] tablet:[transition:opacity_0.2s_ease,transform_0.2s_ease,visibility_0.2s]',
	'tablet:focus-within:w-full tablet:has-[input:focus-visible]:-outline-offset-2',
	'tablet:[.open_&]:visible tablet:[.open_&]:opacity-100 tablet:[.open_&]:[transform:none] tablet:[.open_&]:[transition:opacity_0.2s_ease,transform_0.2s_ease]',
);
const ICON = 'search-icon pointer-events-none absolute left-2.5 size-4 text-sub-text tablet:left-[1.625rem]';
/* 태블릿 이하는 16px: iOS에서 확대되지 않게 */
const INPUT =
	'size-full border-none bg-transparent py-0 pr-3 pl-[2.125rem] text-small text-text focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden tablet:pl-8 tablet:text-[1rem]';

/**
 * 헤더 검색 (#20). 어느 화면에서나 지난 뉴스레터를 찾는다.
 * PC는 헤더 안의 작은 칸, 모바일은 돋보기를 누르면 헤더 아래로 한 줄이 펼쳐진다.
 * 목록(/articles)에서 찾으면 고른 관심사 · 기간 · 정렬은 그대로 두고 검색어만 바꾼다
 */
export default function HeaderSearch() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const onList = pathname === ROUTES.articles;
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
		// 상태(q)가 아니라 칸의 실제 값: 화면이 다 붙기 전에 입력하고 Enter를 누르면, React가 제출만 나중에 다시 실행해
		// 상태에는 이전 검색어가 남아 있었다 (느린 기기 · CI에서 같은 주소로 다시 가며 검색이 안 되던 문제)
		const value = String(new FormData(event.currentTarget as HTMLFormElement).get('q') ?? q).trim();
		setQ(value);
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
				router.push(toPageHref({ ...base, q: '', keywords: [keyword] }));
				inputRef.current?.blur();
				return;
			}
		}
		router.push(toPageHref({ ...base, q: value }));
		inputRef.current?.blur();
	};

	const toggle = () => setOpen((prev) => !prev);

	// 검색 칸은 주소를 읽느라 Suspense 안에서 따로 붙는다. 붙은 뒤 표시해 E2E가 그 다음에 입력하게 한다
	const [ready, setReady] = useState(false);
	useEffect(() => setReady(true), []);

	// 펼치면 바로 입력할 수 있게 (보이게 바뀐 뒤에 포커스)
	useEffect(() => {
		if (open) inputRef.current?.focus();
	}, [open]);

	return (
		<div className={cx(ROOT, open && 'open')}>
			<button
				type="button"
				className={TOGGLE}
				aria-label={open ? '검색 닫기' : '검색'}
				aria-expanded={open}
				aria-controls="header-search"
				onClick={toggle}
			>
				{open ? <LuX aria-hidden /> : <LuSearch aria-hidden />}
			</button>
			<form id="header-search" role="search" className={FORM} onSubmit={submit} data-ready={ready || undefined}>
				<LuSearch className={ICON} aria-hidden />
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
					className={cx(INPUT, error && 'invalid placeholder:text-error')}
				/>
				{error && (
					<span className="sr-only" role="alert">
						{error}
					</span>
				)}
			</form>
		</div>
	);
}

/**
 * 주소를 읽기 전(첫 HTML)에 보여 줄 같은 모양의 검색 칸. 자바스크립트 없이도 /articles?q= 로 보낸다
 */
export function HeaderSearchFallback() {
	return (
		<div className={ROOT}>
			<button type="button" className={TOGGLE} aria-label="검색" disabled>
				<LuSearch aria-hidden />
			</button>
			<form role="search" className={FORM} action={ROUTES.articles} method="get">
				<LuSearch className={ICON} aria-hidden />
				<input
					type="search"
					name="q"
					placeholder="뉴스레터 검색"
					aria-label="뉴스레터 검색어"
					maxLength={50}
					className={INPUT}
				/>
			</form>
		</div>
	);
}
