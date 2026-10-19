import { Injectable, Logger } from '@nestjs/common';
import { JSDOM } from 'jsdom';
import PQueue from '@esm2cjs/p-queue';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1',
];

const REQUEST_TIMEOUT = 30_000;

/**
 * 크롤링에 필요한 HTTP 요청과 HTML 파싱.
 * 네이버 뉴스 섹션·기사 페이지는 필요한 내용이 서버에서 렌더링된 HTML에 들어 있어
 * 브라우저(puppeteer) 없이 fetch + jsdom으로 읽습니다.
 */
@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);

  private readonly queue = new PQueue({ concurrency: 5 });
  // 크롤링 큐 설정
  async setQueue<T>(tasks: Array<() => Promise<T>>): Promise<T[]> {
    return Promise.all(tasks.map((task) => this.queue.add(task)));
  }
  // 지연 시간 설정
  async setDelay(min: number = 1000, max: number = 3000) {
    const randomTime = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise((resolve) => setTimeout(resolve, randomTime));
  }
  // 페이지를 받아 DOM으로 파싱
  async fetchDocument(url: string): Promise<Document> {
    const userAgent =
      USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    const response = await fetch(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept-Language': 'ko-KR,ko;q=0.9',
        Referer: 'https://news.naver.com',
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${url}`);
    }
    const html = await response.text();
    this.logger.debug(`Fetched ${url} (${html.length} chars)`);
    return new JSDOM(html, { url }).window.document;
  }
}
