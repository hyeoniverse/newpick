import { Injectable, Logger } from '@nestjs/common';
import type { Story, StoryImage } from './newsletterWriter.service';

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

/** 소식의 근거 기사에서 아직 쓰지 않은 첫 사진 */
export function articleImage(
  story: Story,
  articles: ArticleImages[],
  used: Set<string>,
): StoryImage | undefined {
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
    const key = process.env.PEXELS_API_KEY;
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

  /** Unsplash 검색. UNSPLASH_ACCESS_KEY가 없거나 결과가 없으면 undefined */
  async unsplash(query: string): Promise<StoryImage | undefined> {
    const key = process.env.UNSPLASH_ACCESS_KEY;
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
        this.logger.warn(`사진 검색 실패 (${query}): ${error.message}`);
      }
    }
    return undefined;
  }

  /**
   * 소식마다 사진을 붙인다. hero: 상세 화면 맨 위 대표 이미지 (같은 사진을 또 쓰지 않게)
   * 소식 순서대로 정해 앞 소식이 원출처 사진을 먼저 가져간다
   */
  async attach(
    stories: Story[],
    articles: ArticleImages[],
    hero?: string,
  ): Promise<Story[]> {
    const used = new Set<string>(hero ? [hero] : []);
    const result: Story[] = [];
    for (const story of stories) {
      if (story.template === 'brief') {
        result.push(story);
        continue;
      }
      const image =
        articleImage(story, articles, used) ??
        (await this.stock(story.imageQuery));
      if (image) used.add(image.url);
      result.push(image ? { ...story, image } : story);
    }
    return result;
  }
}
