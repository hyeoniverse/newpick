import type {
  Story,
  StoryImage,
  WrittenNewsletter,
} from './newsletterWriter.service';

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const paragraphs = (text: string) =>
  text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join('');

const items = (list: string[]) =>
  list.map((item) => `<li>${escapeHtml(item)}</li>`).join('');

const isWebUrl = (url?: string) => !!url && /^https?:\/\//i.test(url);

/** 근거 기사마다 언론사 이름으로 원문 링크 (새 탭). 같은 기사는 한 번만 */
const credit = (story: Story, articles: SourceRef[]) => {
  const seen = new Set<string>();
  const links = story.sources
    .map((n) => articles[n - 1])
    .filter((a): a is SourceRef => Boolean(a?.source || a?.link))
    .filter((a) => {
      const key = a.link || a.source || '';
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((a) => link(a.source || '원문', a.link));
  return links.length ? `<p class="credit">출처 ${links.join(' · ')}</p>` : '';
};

export type SourceRef = { source?: string; link?: string };

const link = (text: string, url?: string) =>
  isWebUrl(url)
    ? `<a href="${escapeHtml(url!)}" target="_blank" rel="noopener noreferrer">${escapeHtml(text)}</a>`
    : escapeHtml(text);

/** 사진 출처 표기. Unsplash는 "Photo by 작가 on Unsplash" 형식이 이용 규칙이다 (#49) */
const imageCaption = (image: StoryImage) => {
  switch (image.provider) {
    // 검색으로 찾은 사진은 기사 속 인물·장소가 아님을 밝힌다
    case 'pexels':
      return `자료 사진 · Photo: ${link(image.credit, image.creditUrl)} / ${link('Pexels', image.providerUrl)}`;
    case 'unsplash':
      return `자료 사진 · Photo by ${link(image.credit, image.creditUrl)} on ${link('Unsplash', image.providerUrl)}`;
    default:
      return `사진 ${link(image.credit, image.creditUrl)}`;
  }
};

const figure = (story: Story) =>
  story.image && isWebUrl(story.image.url)
    ? `<figure class="story-image"><img src="${escapeHtml(story.image.url)}" alt="${escapeHtml(story.image.alt)}" loading="lazy"><figcaption>${imageCaption(story.image)}</figcaption></figure>`
    : '';

const body = (story: Story) =>
  story.body ? `<div class="body">${paragraphs(story.body)}</div>` : '';

const analysis = (story: Story, label = '시사점') =>
  story.analysis
    ? `<div class="analysis"><h3>${label}</h3>${paragraphs(story.analysis)}</div>`
    : '';

/**
 * 템플릿마다 고유 요소와 순서가 다르다 (#48).
 * 꼬리표·헤드라인·리드·출처는 공통이고, 그 사이를 템플릿이 채운다
 */
const TEMPLATE_PARTS: Record<Story['template'], (story: Story) => string[]> = {
  // 지표 카드 → 본문 → 시사점
  numbers: (s) => [
    `<div class="stats">${s.stats
      .map(
        (stat) =>
          `<div class="stat"><span class="label">${escapeHtml(stat.label)}</span><strong class="value">${escapeHtml(stat.value)}</strong><span class="note">${escapeHtml(stat.note)}</span></div>`,
      )
      .join('')}</div>`,
    body(s),
    analysis(s),
  ],
  // 날짜별 경과 → 본문 → 전망
  timeline: (s) => [
    `<ol class="timeline">${s.timeline
      .map(
        (m) =>
          `<li><time>${escapeHtml(m.when)}</time><span>${escapeHtml(m.what)}</span></li>`,
      )
      .join('')}</ol>`,
    body(s),
    analysis(s, '전망'),
  ],
  // 본문 → 문답 → 시사점
  qa: (s) => [
    body(s),
    `<dl class="qa">${s.qa
      .map((x) => `<dt>${escapeHtml(x.q)}</dt><dd>${escapeHtml(x.a)}</dd>`)
      .join('')}</dl>`,
    analysis(s),
  ],
  // 인용문 → 맥락 → 시사점
  quote: (s) => [
    `<blockquote class="quote"><p>${escapeHtml(s.quote.text)}</p><cite>${escapeHtml(s.quote.by)}</cite></blockquote>`,
    body(s),
    analysis(s),
  ],
  analysis: (s) => [body(s), analysis(s)],
  brief: (s) => [body(s)],
};

/**
 * 뉴스레터 본문 HTML. 예전에는 모델이 인라인 스타일까지 매번 다르게 만들었습니다 (#43).
 * 구조와 class만 만들고, 모양은 웹이 사이트 테마(색·글꼴·다크 모드)로 입힙니다.
 *
 * 에디터 브리핑 → 소식(템플릿별) → 관전 포인트
 *
 * articles: 원래 기사 목록. 소식의 sources(1부터)로 출처 언론사와 원문 링크를 찾는다
 */
export function renderNewsletterHtml(
  newsletter: Pick<WrittenNewsletter, 'briefing' | 'stories' | 'watch'>,
  articles: SourceRef[] = [],
): string {
  const stories = newsletter.stories.map((story, i) => {
    const index = String(i + 1).padStart(2, '0');
    return [
      `<article class="story story-${story.template}">`,
      `<p class="kicker"><span class="index">${index}</span>${escapeHtml(story.kicker)}</p>`,
      `<h2>${escapeHtml(story.heading)}</h2>`,
      story.lead ? `<p class="lead">${escapeHtml(story.lead)}</p>` : '',
      figure(story),
      ...TEMPLATE_PARTS[story.template](story),
      credit(story, articles),
      '</article>',
    ].join('');
  });
  return [
    '<div class="newsletter">',
    newsletter.briefing
      ? `<section class="briefing"><h3>에디터 브리핑</h3>${paragraphs(newsletter.briefing)}</section>`
      : '',
    stories.join(''),
    newsletter.watch.length
      ? `<section class="watch"><h3>관전 포인트</h3><ul>${items(newsletter.watch)}</ul></section>`
      : '',
    '</div>',
  ].join('');
}
