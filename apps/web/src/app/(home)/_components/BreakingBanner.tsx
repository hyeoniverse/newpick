'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { BreakingNotice } from '@newpick/shared';
import { LuChevronDown } from 'react-icons/lu';
import { queryKeys } from '@/api/queryKeys';
import { fetchBreakingLatest } from '@/api/edition';
import Image from '@/components/common/Image';
import { HOME } from '@/copy';
import { cx } from '@/styles/tw';

const COPY = HOME.breaking;
const MINUTE = 60 * 1000;

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
 * 홈 속보: 나간 속보 가운데 가장 최근 것 (취소할 시간이 지났거나 발송함, 24시간 안). 없으면 그리지 않는다.
 * - 맨 위에 사진을 쓴 큰 칸 (속보는 가장 눈에 띄어야 한다). 사진은 관련 기사의 대표 사진, 없으면 글만 크게
 * - 큰 칸이 화면 위로 지나가면 얇은 띠가 머리글 아래에 붙어 계속 보인다 (머리글이 숨으면 맨 위). 띠를 누르면 이유와 관련 기사가 아코디언으로 펼쳐진다.
 *   띠는 글자색 바탕에 바탕색 글씨라 라이트 테마는 검정, 다크 테마는 밝은 띠
 * 홈 화면은 10분마다 새로 만들어지므로 속보는 브라우저에서 1분마다 따로 확인한다 (늦게 뜨지 않게)
 */
export default function BreakingBanner() {
	const [open, setOpen] = useState(false);
	const [heroGone, setHeroGone] = useState(false);
	const hero = useRef<HTMLElement>(null);
	const { data } = useQuery({
		queryKey: queryKeys.breakingLatest,
		queryFn: fetchBreakingLatest,
		refetchInterval: MINUTE,
		staleTime: MINUTE / 2,
	});

	// 큰 칸이 화면 위로 다 지나갔는지 (아래에 있을 때는 띠를 띄우지 않는다)
	useEffect(() => {
		const el = hero.current;
		if (!el || !('IntersectionObserver' in window)) return;
		const observer = new IntersectionObserver(([entry]) =>
			setHeroGone(!entry.isIntersecting && entry.boundingClientRect.top < 0),
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, [data?.id]);

	if (!data) return null;
	const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(data.detectedAt)) / MINUTE));
	const first = data.articles[0];

	return (
		<>
			<section
				ref={hero}
				data-track-section="home-breaking"
				aria-label={COPY.label}
				className={cx(
					'mt-8 mb-2 grid items-center gap-8 tablet:grid-cols-1 tablet:gap-5 mobile:mt-5',
					data.image ? 'grid-cols-[1.15fr_1fr]' : 'grid-cols-1',
				)}
			>
				{data.image && (
					<a href={first?.link} target="_blank" rel="noreferrer" className="block" tabIndex={-1} aria-hidden>
						<Image
							src={data.image}
							alt=""
							ratio="wide"
							priority
							sizes="(max-width: 1023px) 100vw, 560px"
							className="w-full rounded-surface"
						/>
					</a>
				)}
				<div className="flex min-w-0 flex-col gap-3">
					<Label minutes={minutes} />
					<h2 className="m-0 text-[2rem] leading-tight font-bold break-keep mobile:text-[1.5rem]">{data.headline}</h2>
					{data.reason && <p className="m-0 leading-relaxed text-sub-text">{data.reason}</p>}
					<Articles notice={data} />
				</div>
			</section>

			{/* 큰 칸이 지나간 뒤 계속 보이는 얇은 띠 (머리글 아래, 머리글과 같은 빠르기로 따라 움직인다) */}
			<div
				className={cx(
					'fixed inset-x-0 top-(--header-height,0px) z-(--np-z-sticky) bg-text text-background',
					'[transition:top_0.3s_ease,transform_0.3s_ease,opacity_0.3s_ease] motion-reduce:transition-none',
					heroGone ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-full opacity-0',
				)}
				inert={!heroGone}
				data-track-section="home-breaking-band"
			>
				<div className="mx-auto flex max-w-[calc(1024px+5rem)] flex-col px-10 mobile:px-4">
					<button
						type="button"
						aria-expanded={open}
						onClick={() => setOpen((v) => !v)}
						className="flex w-full cursor-pointer items-center gap-3 border-0 bg-transparent py-3 text-left text-medium text-inherit"
					>
						<Label />
						<strong className="min-w-0 flex-1 truncate font-bold">{data.headline}</strong>
						<span className="shrink-0 text-small opacity-75">{COPY.ago(minutes)}</span>
						<span className="flex shrink-0 items-center gap-1 text-small font-semi-bold">
							<span className="mobile:hidden">{open ? COPY.less : COPY.more}</span>
							<LuChevronDown aria-hidden className={cx('transition-transform duration-300', open && 'rotate-180')} />
						</span>
					</button>
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
		</>
	);
}
