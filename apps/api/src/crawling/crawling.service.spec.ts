import { JSDOM } from 'jsdom';
import {
  CrawlingService,
  LATEST_LIMIT,
  sectionLinks,
} from './crawling.service';

const item = (kind: string, id: number, title = `기사 ${id}`) =>
  `<li class="sa_item ${kind}"><a class="sa_text_title" href="https://n.news.naver.com/article/001/${id}"><strong class="sa_text_strong">${title}</strong></a></li>`;

const page = (body: string) =>
  new JSDOM(`<ul>${body}</ul>`, { url: 'https://news.naver.com/section/104' })
    .window.document;

describe('분야 첫 화면 기사 목록', () => {
  it('헤드라인에 더해 최신 기사 목록도 모은다 (새벽 · 주말 헤드라인이 그대로여도 새 기사가 들어오게)', () => {
    const links = sectionLinks(
      page(
        item('_SECTION_HEADLINE', 1) +
          item('_SECTION_HEADLINE', 2) +
          item('_LAZY_LOADING_WRAP', 3, '뉴욕 증시 반등') +
          item('_LAZY_LOADING_WRAP', 4),
      ),
    );
    expect(links.map((l) => l.link.split('/').pop())).toEqual([
      '1',
      '2',
      '3',
      '4',
    ]);
    expect(links[2].title).toBe('뉴욕 증시 반등');
  });

  it('최신 기사는 LATEST_LIMIT건까지, 헤드라인과 겹치는 기사는 한 번만', () => {
    const latest = Array.from({ length: LATEST_LIMIT + 10 }, (_, i) =>
      item('_LAZY_LOADING_WRAP', 100 + i),
    ).join('');
    const links = sectionLinks(page(item('_SECTION_HEADLINE', 100) + latest));
    expect(links).toHaveLength(LATEST_LIMIT);
    expect(new Set(links.map((l) => l.link)).size).toBe(links.length);
  });
});

describe('분야 고르기', () => {
  const setup = (findCategory: jest.Mock) => {
    const repository = {
      createCrawledNews: jest.fn(async (items: unknown[]) => items),
    };
    const service = new CrawlingService(
      {
        setQueue: (tasks: (() => Promise<unknown>)[]) =>
          Promise.all(tasks.map((t) => t())),
      } as never,
      repository as never,
      { findCategory } as never,
    );
    const news = (link: string, category: string[] = []) => ({
      link,
      content: `본문 ${link}`,
      category,
    });
    jest
      .spyOn(service, 'crawlingNews')
      .mockResolvedValue([news('a'), news('b'), news('c', ['경제'])] as never);
    return { service, repository };
  };

  it('고르기에 실패한 기사만 빼고 나머지는 저장한다 (예전엔 한 건 실패로 회차 전체가 실패)', async () => {
    const findCategory = jest
      .fn()
      .mockResolvedValueOnce({ categoryId: 1, categoryName: 'IT' })
      // findCategory는 실패하면 오류를 기록하고 undefined를 돌려준다
      .mockResolvedValueOnce(undefined);
    const { service, repository } = setup(findCategory);
    await service.crawling();
    const saved = repository.createCrawledNews.mock.calls[0][0] as {
      link: string;
      category: string[];
    }[];
    expect(saved.map((n) => [n.link, n.category])).toEqual([
      ['a', ['IT']],
      ['c', ['경제']],
    ]);
  });

  it('고르기가 오류를 던져도 그 기사만 뺀다', async () => {
    const findCategory = jest
      .fn()
      .mockRejectedValueOnce(new Error('overloaded'))
      .mockResolvedValueOnce({ categoryId: 2, categoryName: '정치' });
    const { service, repository } = setup(findCategory);
    await service.crawling();
    const saved = repository.createCrawledNews.mock.calls[0][0] as {
      link: string;
    }[];
    expect(saved.map((n) => n.link)).toEqual(['b', 'c']);
  });
});
