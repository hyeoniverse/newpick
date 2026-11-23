'use client';

import type { ViewerImage } from '@/components/common/ImageViewer';
import { cx } from '@/styles/tw';

/** 대표 사진 모자이크 칸 하나 = 본문 소식 사진 하나 */
export interface CoverPhoto {
	src: string;
	alt: string;
	/** 사진 아래 표기 (본문 figcaption): '사진' + 언론사, 또는 '자료 사진 · Photo:' + 작가 */
	caption?: ViewerImage['caption'];
}

/** 모자이크에 넣는 사진 수. 더 많으면 중요한 순으로 자른다 */
export const MAX_COVER_PHOTOS = 4;

const ENTITIES: Record<string, string> = { amp: '&', quot: '"', lt: '<', gt: '>', '#39': "'", '#x27': "'" };
const decode = (text: string) => text.replace(/&(amp|quot|lt|gt|#39|#x27);/g, (_, name: string) => ENTITIES[name]);
const textOf = (html: string) => decode(html.replace(/<[^>]*>/g, '')).trim();

function captionOf(html: string | undefined): CoverPhoto['caption'] {
	if (!html) return undefined;
	const link = html.match(/<a\b[^>]*\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/);
	if (!link) return textOf(html) ? { source: textOf(html) } : undefined;
	const label = textOf(html.slice(0, link.index))
		.replace(/[·:]\s*$/, '')
		.trim();
	return { label: label || undefined, source: textOf(link[2]), href: decode(link[1]) };
}

/**
 * 본문 HTML(정리한 것)에서 소식 사진을 중요한 순(data-importance가 높은 순, 같거나 없으면 실린 순)으로 최대 4장.
 * 서버가 그린 첫 HTML에도 같은 모자이크가 나오게 DOM 없이 문자열로 읽는다
 */
export function coverPhotos(html: string, max = MAX_COVER_PHOTOS): CoverPhoto[] {
	const found: (CoverPhoto & { importance: number; order: number })[] = [];
	for (const story of html.matchAll(/<article class="story[^"]*"([^>]*)>([\s\S]*?)<\/article>/g)) {
		const figure = story[2].match(
			/<figure class="story-image"[^>]*>\s*<img\b([^>]*)>(?:[\s\S]*?<figcaption>([\s\S]*?)<\/figcaption>)?/,
		);
		const src = figure?.[1].match(/\bsrc="([^"]*)"/)?.[1];
		if (!figure || !src) continue;
		const importance = Number(story[1].match(/\bdata-importance="(\d+)"/)?.[1] ?? 3);
		found.push({
			src: decode(src),
			alt: decode(figure[1].match(/\balt="([^"]*)"/)?.[1] ?? ''),
			caption: captionOf(figure[2]),
			importance,
			order: found.length,
		});
	}
	return found
		.sort((a, b) => b.importance - a.importance || a.order - b.order)
		.slice(0, max)
		.map(({ src, alt, caption }) => ({ src, alt, caption }));
}

/** 장 수마다 칸 배치: 1장 통째 · 2장 반반 · 3장 왼쪽 큰 것 하나 + 오른쪽 둘 · 4장 2×2 */
const LAYOUT: Record<number, string> = {
	1: 'grid-cols-1',
	2: 'grid-cols-2',
	3: 'grid-cols-2 grid-rows-2 [&>*:first-child]:row-span-2',
	4: 'grid-cols-2 grid-rows-2',
};

/**
 * 상세 화면 맨 위 대표 사진: 소식 사진들을 중요한 순으로 합친 모자이크.
 * 예전에는 쓴 기사 가운데 사진이 있는 첫 기사의 첫 사진 한 장이라 제목 · 내용과 동떨어진 일이 많았고 출처도 없었다.
 * 칸마다 출처(언론사)를 붙이고, 누르면 그 사진을 크게 본다
 */
export default function CoverMosaic({
	photos,
	onOpen,
}: {
	photos: CoverPhoto[];
	onOpen: (photo: CoverPhoto, img: HTMLImageElement) => void;
}) {
	return (
		<div
			className={cx(
				'grid aspect-[16/9] w-full gap-1 overflow-hidden rounded-surface',
				LAYOUT[photos.length] ?? LAYOUT[4],
			)}
		>
			{photos.map((photo, i) => (
				<button
					key={photo.src}
					type="button"
					aria-label={`${photo.alt || '사진'} 크게 보기`}
					className="relative block h-full min-h-0 w-full cursor-zoom-in overflow-hidden border-0 bg-transparent p-0"
					onClick={(e) => {
						const img = e.currentTarget.querySelector('img');
						if (img) onOpen(photo, img);
					}}
				>
					{/* 본문 소식 사진과 같은 주소라 한 번만 받는다. 맨 위라 바로 받는다 (첫 화면의 가장 큰 그림) */}
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={photo.src}
						alt={photo.alt}
						fetchPriority={i === 0 ? 'high' : undefined}
						className="block h-full w-full object-cover object-center"
					/>
					{photo.caption?.source && (
						<span className="absolute right-0 bottom-0 bg-black/55 px-2 py-0.5 text-[0.75rem] leading-normal text-white">
							{photo.caption.source}
						</span>
					)}
				</button>
			))}
		</div>
	);
}
