'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { BreakingNotice } from '@newpick/shared';
import { LuChevronDown, LuX } from 'react-icons/lu';
import { queryKeys } from '@/api/queryKeys';
import { fetchBreakingLatest } from '@/api/edition';
import Image from '@/components/common/Image';
import { HOME } from '@/copy';
import { cx } from '@/styles/tw';
import { beginAutoScroll } from '@/utils/autoScroll';

const COPY = HOME.breaking;
const MINUTE = 60 * 1000;
/** 펼치고 접는 시간 (아래 duration-300) + 여유 */
const TOGGLE_MS = 450;

/** 나간 속보 가운데 가장 최근 것 (띠와 큰 칸이 같은 요청을 나눠 쓴다). 홈 화면은 10분마다 새로 만들어지므로 브라우저에서 1분마다 따로 확인한다 */
function useBreaking() {
	return useQuery({
		queryKey: queryKeys.breakingLatest,
		queryFn: fetchBreakingLatest,
		refetchInterval: MINUTE,
		staleTime: MINUTE / 2,
	}).data;
}

/** 닫은 속보 id (localStorage, 이 브라우저에만). 저장소를 못 쓰면 닫기는 이번 화면에서만 */
const DISMISSED_KEY = 'np-breaking-dismissed';
const DISMISSED_KEEP = 20;
const readDismissed = (): number[] => {
	try {
		const value = JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? '[]');
		return Array.isArray(value) ? value.filter((v): v is number => typeof v === 'number') : [];
	} catch {
		return [];
	}
};
const writeDismissed = (ids: number[]) => {
	try {
		localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids));
	} catch {
		// 저장소를 못 쓰면 이번 화면에서만 닫힌다
	}
};

const minutesSince = (iso: string) => Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / MINUTE));

/** '속보' 표시: 빨강은 천천히 깜빡이는 점에만 (띠 · 칸 전체를 빨갛게 하면 사이트 색과 따로 논다) */
function Label({ minutes }: { minutes?: number }) {
	return (
		<span className="flex shrink-0 items-center gap-2.5 text-small font-bold">
			<span className="np-breaking-dot size-2 rounded-full bg-error" aria-hidden />
			{COPY.label}
			{minutes !== undefined && <span className="font-regular opacity-75">· {COPY.ago(minutes)}</span>}
		</span>
	);
}

function Articles({ notice }: { notice: BreakingNotice }) {
	return (
		<ul className="m-0 flex list-none flex-col gap-1 p-0 text-small">
			{notice.articles.map((article) => (
				<li key={article.link}>
					<a href={article.link} target="_blank" rel="noreferrer" className="text-inherit underline">
						{article.title}
					</a>{' '}
					<span className="opacity-75">· {article.source}</span>
				</li>
			))}
		</ul>
	);
}

/**
 * 홈 큰 속보 칸 (체험하기 칸 바로 아래): 사진 · 속보 · 몇 분 전 · 큰 제목 · 이유 · 관련 기사.
 * 사진은 관련 기사의 대표 사진, 없으면 글만 크게. 나간 속보가 없으면 그리지 않는다
 */
export function BreakingCard() {
	const data = useBreaking();
	if (!data) return null;
	const first = data.articles[0];
	return (
		<section
			data-track-section="home-breaking"
			aria-label={COPY.label}
			className={cx(
				'mb-12 grid items-center gap-8 tablet:grid-cols-1 tablet:gap-5',
				data.image ? 'grid-cols-[1.15fr_1fr]' : 'grid-cols-1',
			)}
		>
			{data.image && (
				<a href={first?.link} target="_blank" rel="noreferrer" className="block" tabIndex={-1} aria-hidden>
					<Image
						src={data.image}
						alt=""
						ratio="wide"
						sizes="(max-width: 1023px) 100vw, 560px"
						className="w-full rounded-surface"
					/>
				</a>
			)}
			<div className="flex min-w-0 flex-col gap-3">
				<Label minutes={minutesSince(data.detectedAt)} />
				<h2 className="m-0 text-[2rem] leading-tight font-bold break-keep mobile:text-[1.5rem]">{data.headline}</h2>
				{data.reason && <p className="m-0 leading-relaxed text-sub-text">{data.reason}</p>}
				<Articles notice={data} />
			</div>
		</section>
	);
}

/**
 * 속보 띠. 메인(closable 없음): 맨 위에 늘 보이고 머리글 아래에 붙어 있다(머리글이 숨으면 맨 위, 같은 빠르기로 따라 움직인다).
 * 다른 페이지(closable, MainLayout): 같은 자리에 붙고 닫을 수 있다. 닫은 속보는 이 브라우저에서 다시 보이지 않는다 (메인에서는 늘 보인다).
 * 페이지 안에서 자리를 차지하며 붙어서(sticky) 첫 화면을 가리지 않는다. 글자색 바탕에 바탕색 글씨라 라이트 테마는 검정, 다크 테마는 밝은 띠.
 * 누르면 이유와 관련 기사가 아코디언으로 펼쳐진다. 나간 속보가 없으면 그리지 않는다
 */
export default function BreakingBand({ closable = false }: { closable?: boolean }) {
	const [open, setOpen] = useState(false);
	// 다른 페이지에서 닫은 속보 (이 브라우저에만 기억). 메인에서는 닫을 수 없어 늘 보인다
	const [dismissed, setDismissed] = useState<number[]>(() => (closable ? readDismissed() : []));
	const data = useBreaking();
	const row = useRef<HTMLButtonElement>(null);

	// 접힌 띠의 높이를 페이지에 알린다: 메인 첫 화면 패널은 그만큼 줄어 제목 · 설명이 밀려 내려가지 않고 (home.css),
	// 위에 붙는 '목록으로' 막대는 띠 아래에 붙는다 (back-bar.css).
	// 펼친 내용은 넣지 않는다 (띠를 펼칠 때 패널까지 덜컹거리지 않게)
	useEffect(() => {
		const el = row.current;
		if (!el) return;
		const root = document.documentElement;
		const set = () => root.style.setProperty('--np-breaking-band', `${el.offsetHeight}px`);
		set();
		const observer = 'ResizeObserver' in window ? new ResizeObserver(set) : null;
		observer?.observe(el);
		return () => {
			observer?.disconnect();
			root.style.removeProperty('--np-breaking-band');
		};
	}, [data?.id, dismissed]);

	if (!data || dismissed.includes(data.id)) return null;
	const minutes = minutesSince(data.detectedAt);
	const close = () => {
		const next = [...dismissed, data.id].slice(-DISMISSED_KEEP);
		setDismissed(next);
		writeDismissed(next);
	};
	// 띠가 길어지고 짧아지는 동안 브라우저가 화면 자리를 맞추려 스크롤을 옮기는데, 머리글이 이를 '아래로 스크롤'로 읽어 닫혔다.
	// 그동안은 코드가 스크롤하는 것으로 알려 머리글이 방향에 반응하지 않게 한다
	const toggle = () => {
		setOpen((v) => !v);
		const end = beginAutoScroll();
		window.setTimeout(end, TOGGLE_MS);
	};

	return (
		<div
			className={cx(
				// 띠는 내용 너비 그대로 두고 바탕색만 양옆 화면 끝까지 칠한다 (100vw로 펼치면 스크롤 막대 폭만큼 밀린다)
				'sticky top-(--header-height,0px) z-(--np-z-sticky) bg-text text-background [transition:top_0.3s_ease]',
				'shadow-[0_0_0_100vmax_var(--color-text)] [clip-path:inset(0_-100vmax)]',
			)}
			data-track-section="home-breaking-band"
		>
			<div className="flex flex-col">
				<div className="flex items-center gap-2">
					<button
						ref={row}
						type="button"
						aria-expanded={open}
						onClick={toggle}
						className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 border-0 bg-transparent py-3 text-left text-medium text-inherit"
					>
						<Label />
						<strong className="min-w-0 flex-1 truncate font-bold">{data.headline}</strong>
						<span className="shrink-0 text-small opacity-75">{COPY.ago(minutes)}</span>
						<span className="flex shrink-0 items-center gap-1 text-small font-semi-bold">
							<span className="mobile:hidden">{open ? COPY.less : COPY.more}</span>
							<LuChevronDown aria-hidden className={cx('transition-transform duration-300', open && 'rotate-180')} />
						</span>
					</button>
					{closable && (
						<button
							type="button"
							onClick={close}
							aria-label={COPY.close}
							className="flex shrink-0 cursor-pointer items-center border-0 bg-transparent p-1 text-medium text-inherit opacity-75 hover:opacity-100"
						>
							<LuX aria-hidden />
						</button>
					)}
				</div>
				{/* 아코디언: 높이를 0fr ↔ 1fr로 바꿔 내용 높이만큼 부드럽게, 내용은 함께 서서히 (접혀 있을 때는 화면 읽기 · 키보드에서 빠진다) */}
				<div
					className={cx(
						'grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none',
						open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
					)}
					inert={!open}
				>
					<div className="min-h-0 overflow-hidden">
						<div className="flex flex-col gap-2 pb-4 text-small">
							{data.reason && <p className="m-0 leading-relaxed opacity-85">{data.reason}</p>}
							<Articles notice={data} />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
