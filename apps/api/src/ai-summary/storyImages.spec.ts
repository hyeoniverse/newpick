import type { Story } from './newsletterWriter.service';
import { articleImage, StoryImageService } from './storyImages';
import { renderNewsletterHtml } from './newsletterHtml';

const story = (overrides: Partial<Story> = {}): Story => ({
  template: 'analysis',
  kicker: '증시',
  heading: '코스피 7개월 만에 최저',
  lead: '리드',
  body: '본문',
  analysis: '',
  stats: [],
  timeline: [],
  qa: [],
  quote: { text: '', by: '' },
  sources: [1],
  imageQuery: 'stock market screen',
  ...overrides,
});

const articles = [
  {
    images: ['https://img/hero.jpg', 'https://img/second.jpg'],
    source: '연합뉴스',
    link: 'https://news/1',
  },
  { images: [], source: 'KBS', link: 'https://news/2' },
];

const keys = ['PEXELS_API_KEY', 'UNSPLASH_ACCESS_KEY'] as const;
const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
afterEach(() => {
  for (const k of keys) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

const pexelsPhoto = {
  photos: [
    {
      url: 'https://www.pexels.com/photo/1',
      alt: 'Stock chart',
      photographer: 'Kim',
      photographer_url: 'https://www.pexels.com/@kim',
      src: { landscape: 'https://images.pexels.com/1.jpeg' },
    },
  ],
};

const unsplashPhoto = {
  results: [
    {
      alt_description: 'farmland',
      urls: { regular: 'https://images.unsplash.com/1' },
      user: { name: 'Lee', links: { html: 'https://unsplash.com/@lee' } },
      links: {
        html: 'https://unsplash.com/photos/1',
        download_location: 'https://api.unsplash.com/photos/1/download',
      },
    },
  ],
};

describe('원출처 사진', () => {
  it('근거 기사의 사진 중 아직 쓰지 않은 것을 언론사·원문 링크와 함께', () => {
    const image = articleImage(
      story(),
      articles,
      new Set(['https://img/hero.jpg']),
    );
    expect(image).toEqual({
      url: 'https://img/second.jpg',
      alt: '코스피 7개월 만에 최저',
      credit: '연합뉴스',
      creditUrl: 'https://news/1',
      provider: 'article',
    });
  });

  it('근거 기사에 쓸 사진이 없으면 없음', () => {
    expect(
      articleImage(story({ sources: [2] }), articles, new Set()),
    ).toBeUndefined();
  });
});

describe('StoryImageService.attach', () => {
  it('대표 이미지와 겹치지 않게 원출처 사진, 없으면 Pexels, 단신은 사진 없음', async () => {
    process.env.PEXELS_API_KEY = 'pexels-key';
    const service = new StoryImageService();
    service.fetcher = jest.fn(async () => json(pexelsPhoto));

    const [first, second, brief] = await service.attach(
      [story(), story({ sources: [2] }), story({ template: 'brief' })],
      articles,
      'https://img/hero.jpg',
    );

    expect(first.image?.url).toBe('https://img/second.jpg');
    expect(second.image).toMatchObject({
      url: 'https://images.pexels.com/1.jpeg',
      credit: 'Kim',
      provider: 'pexels',
    });
    expect(brief.image).toBeUndefined();
    const [url, init] = (service.fetcher as jest.Mock).mock.calls[0];
    expect(url).toContain('query=stock+market+screen');
    expect(init.headers).toEqual({ Authorization: 'pexels-key' });
  });

  it('Pexels가 실패하면 Unsplash, 쓴 사진은 다운로드 알림을 보낸다 (이용 규칙)', async () => {
    process.env.PEXELS_API_KEY = 'pexels-key';
    process.env.UNSPLASH_ACCESS_KEY = 'unsplash-key';
    const service = new StoryImageService();
    const fetcher = jest.fn(async (url: string) =>
      url.includes('pexels') ? json({}, 500) : json(unsplashPhoto),
    );
    service.fetcher = fetcher as never;

    const [result] = await service.attach([story({ sources: [] })], articles);

    expect(result.image).toMatchObject({
      url: 'https://images.unsplash.com/1',
      credit: 'Lee',
      creditUrl:
        'https://unsplash.com/@lee?utm_source=newpick&utm_medium=referral',
      provider: 'unsplash',
    });
    expect(fetcher).toHaveBeenCalledWith(
      'https://api.unsplash.com/photos/1/download',
      { headers: { Authorization: 'Client-ID unsplash-key' } },
    );
  });

  it('키가 없으면 검색하지 않고 사진 없이 넘어간다', async () => {
    delete process.env.PEXELS_API_KEY;
    delete process.env.UNSPLASH_ACCESS_KEY;
    const service = new StoryImageService();
    service.fetcher = jest.fn();

    const [result] = await service.attach([story({ sources: [] })], articles);

    expect(result.image).toBeUndefined();
    expect(service.fetcher).not.toHaveBeenCalled();
  });
});

describe('사진 렌더링', () => {
  const render = (image: Story['image']) =>
    renderNewsletterHtml({
      briefing: '',
      watch: [],
      stories: [story({ image })],
    });

  it('리드 아래에 사진과 출처를 넣는다', () => {
    const html = render({
      url: 'https://img/1.jpg',
      alt: '코스피',
      credit: '연합뉴스',
      creditUrl: 'https://news/1',
      provider: 'article',
    });
    expect(html).toContain(
      '<p class="lead">리드</p><figure class="story-image"><img src="https://img/1.jpg" alt="코스피" loading="lazy"><figcaption>사진 <a href="https://news/1" target="_blank" rel="noopener noreferrer">연합뉴스</a></figcaption></figure>',
    );
  });

  it('Unsplash는 "Photo by 작가 on Unsplash" 형식', () => {
    const html = render({
      url: 'https://images.unsplash.com/1',
      alt: 'x',
      credit: 'Lee',
      creditUrl: 'https://unsplash.com/@lee',
      provider: 'unsplash',
      providerUrl: 'https://unsplash.com/photos/1',
    });
    expect(html).toMatch(
      /Photo by <a [^>]+>Lee<\/a> on <a [^>]+>Unsplash<\/a>/,
    );
  });

  it('http(s)가 아닌 사진 주소는 그리지 않는다', () => {
    expect(
      render({
        url: 'javascript:alert(1)',
        alt: 'x',
        credit: 'x',
        provider: 'article',
      }),
    ).not.toContain('<figure');
  });
});
