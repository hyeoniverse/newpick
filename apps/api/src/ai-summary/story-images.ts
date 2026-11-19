import { Injectable, Logger } from '@nestjs/common';
import type { Story, StoryImage } from './writer/types';
import { env } from 'src/config/env';
import { errorMessage } from 'src/common/error-message';

/**
 * 소식마다 사진 한 장 (#49)
 * 1. 원출처: 소식이 근거로 쓴 기사의 사진 중 아직 쓰지 않은 것 (대표 이미지·다른 소식과 겹치지 않게)
 * 2. 없으면 Pexels → Unsplash에서 imageQuery로 검색 (키가 없으면 건너뜀)
 * 단신(brief)에는 붙이지 않는다
 */

export type ArticleImages = {
	images?: string[];
	source?: string;
	link?: string;
};

type Fetch = typeof fetch;

/** Unsplash 이용 규칙: 사진 페이지·작가 링크에 출처 파라미터를 붙인다 */
const UTM = 'utm_source=newpick&utm_medium=referral';
const withUtm = (url: string) => `${url}${url.includes('?') ? '&' : '?'}${UTM}`;

const isWebUrl = (url?: string) => !!url && /^https?:\/\//i.test(url);

/**
 * Pexels 사진을 Pexels가 직접 줄인 크기(가로 800 · 16:9)로. 사이트는 이 사진을 사진 최적화를 거치지 않고 그대로 쓴다
 * (최적화가 실패할 때 대신 보이는 사진이라, 같은 길로 받으면 같이 깨진다)
 */
export const pexelsSized = (url: string) =>
	`${url.split('?')[0]}?${new URLSearchParams({ auto: 'compress', cs: 'tinysrgb', fit: 'crop', w: '800', h: '450' })}`;

/** 소식의 근거 기사에서 아직 쓰지 않은 첫 사진 */
export function articleImage(story: Story, articles: ArticleImages[], used: Set<string>): StoryImage | undefined {
	for (const n of story.sources) {
		const article = articles[n - 1];
		const url = article?.images?.find((u) => isWebUrl(u) && !used.has(u));
		if (url) {
			return {
				url,
				alt: story.heading,
				credit: article.source || '원문',
				creditUrl: isWebUrl(article.link) ? article.link : undefined,
				provider: 'article',
			};
		}
	}
	return undefined;
}

@Injectable()
export class StoryImageService {
	private readonly logger = new Logger(StoryImageService.name);
	/** 시험에서 바꿔 끼울 수 있게 */
	fetcher: Fetch = (input, init) => fetch(input, init);

	/** Pexels 검색. PEXELS_API_KEY가 없거나 결과가 없으면 undefined */
	async pexels(query: string): Promise<StoryImage | undefined> {
		const key = env.pexelsApiKey;
		if (!key || !query) return undefined;
		const res = await this.fetcher(
			`https://api.pexels.com/v1/search?${new URLSearchParams({ query, per_page: '1', orientation: 'landscape' })}`,
			{ headers: { Authorization: key }, signal: AbortSignal.timeout(5000) },
		);
		if (!res.ok) throw new Error(`Pexels ${res.status}`);
		const [photo] = (await res.json()).photos ?? [];
		if (!photo) return undefined;
		return {
			url: photo.src.landscape ?? photo.src.large,
			alt: photo.alt || query,
			credit: photo.photographer,
			creditUrl: photo.photographer_url,
			provider: 'pexels',
			providerUrl: photo.url,
		};
	}

	/**
	 * 뉴스레터 대체 사진: 사진이 깨질 때(원문 사진이 지워짐 · 사진 최적화 실패) 카드 · 띠 · 상세에서 대신 보인다.
	 * Pexels만 쓴다: Unsplash는 사진 옆에 작가를 밝혀야 하는데, 카드 · 띠처럼 작은 자리에서는 지키기 어렵다.
	 * page로 같은 검색어에서도 다른 사진을 고른다. 키가 없거나 결과가 없으면 undefined
	 */
	async fallbackImage(query: string, page = 1): Promise<string | undefined> {
		const key = env.pexelsApiKey;
		if (!key || !query) return undefined;
		const res = await this.fetcher(
			`https://api.pexels.com/v1/search?${new URLSearchParams({ query, per_page: '1', page: String(page), orientation: 'landscape' })}`,
			{ headers: { Authorization: key }, signal: AbortSignal.timeout(5000) },
		);
		if (!res.ok) throw new Error(`Pexels ${res.status}`);
		const [photo] = (await res.json()).photos ?? [];
		return photo ? pexelsSized(photo.src.original) : undefined;
	}

	/** Unsplash 검색. UNSPLASH_ACCESS_KEY가 없거나 결과가 없으면 undefined */
	async unsplash(query: string): Promise<StoryImage | undefined> {
		const key = env.unsplashAccessKey;
		if (!key || !query) return undefined;
		const headers = { Authorization: `Client-ID ${key}` };
		const res = await this.fetcher(
			`https://api.unsplash.com/search/photos?${new URLSearchParams({ query, per_page: '1', orientation: 'landscape' })}`,
			{ headers, signal: AbortSignal.timeout(5000) },
		);
		if (!res.ok) throw new Error(`Unsplash ${res.status}`);
		const [photo] = (await res.json()).results ?? [];
		if (!photo) return undefined;
		// 이용 규칙: 사진을 쓰면 download_location을 호출해 다운로드로 집계한다
		this.fetcher(photo.links.download_location, { headers }).catch(() => {});
		return {
			url: photo.urls.regular,
			alt: photo.alt_description || query,
			credit: photo.user.name,
			creditUrl: withUtm(photo.user.links.html),
			provider: 'unsplash',
			providerUrl: withUtm(photo.links.html),
		};
	}

	/** 검색 실패는 사진 없이 넘어간다 (뉴스레터 생성을 막지 않게) */
	async stock(query: string): Promise<StoryImage | undefined> {
		for (const search of [this.pexels, this.unsplash]) {
			try {
				const image = await search.call(this, query);
				if (image) return image;
			} catch (error) {
				this.logger.warn(`사진 검색 실패 (${query}): ${errorMessage(error)}`);
			}
		}
		return undefined;
	}

	/**
	 * 소식마다 사진을 붙인다. hero: 상세 화면 맨 위 대표 이미지 (같은 사진을 또 쓰지 않게)
	 * 소식 순서대로 정해 앞 소식이 원출처 사진을 먼저 가져간다
	 */
	async attach(stories: Story[], articles: ArticleImages[], hero?: string): Promise<Story[]> {
		const used = new Set<string>(hero ? [hero] : []);
		const result: Story[] = [];
		for (const story of stories) {
			if (story.template === 'brief') {
				result.push(story);
				continue;
			}
			const image = articleImage(story, articles, used) ?? (await this.stock(story.imageQuery));
			if (image) used.add(image.url);
			result.push(image ? { ...story, image } : story);
		}
		return result;
	}
}
