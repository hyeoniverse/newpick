import type { WrittenNewsletter } from './newsletterWriter.service';

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

/**
 * 뉴스레터 본문 HTML. 예전에는 모델이 인라인 스타일까지 매번 다르게 만들었습니다 (#43).
 * 구조와 class만 만들고, 모양은 웹이 사이트 테마(색·글꼴·다크 모드)로 입힙니다.
 *
 * 에디터 브리핑 → 소식(꼬리표 · 헤드라인 · 리드 · 본문 · 핵심 사실 · 시사점 · 출처) → 관전 포인트
 *
 * articles: 원래 기사 목록. 소식의 sources(1부터)로 출처 언론사를 찾는다
 */
export function renderNewsletterHtml(
  newsletter: Pick<WrittenNewsletter, 'briefing' | 'stories' | 'watch'>,
  articles: { source?: string }[] = [],
): string {
  const stories = newsletter.stories.map((story, i) => {
    const outlets = [
      ...new Set(
        story.sources.map((n) => articles[n - 1]?.source).filter(Boolean),
      ),
    ] as string[];
    const index = String(i + 1).padStart(2, '0');
    return [
      '<article class="story">',
      `<p class="kicker"><span class="index">${index}</span>${escapeHtml(story.kicker)}</p>`,
      `<h2>${escapeHtml(story.heading)}</h2>`,
      story.lead ? `<p class="lead">${escapeHtml(story.lead)}</p>` : '',
      story.body ? `<div class="body">${paragraphs(story.body)}</div>` : '',
      story.facts.length
        ? `<aside class="facts"><h3>핵심 사실</h3><ul>${items(story.facts)}</ul></aside>`
        : '',
      story.analysis
        ? `<div class="analysis"><h3>시사점</h3>${paragraphs(story.analysis)}</div>`
        : '',
      outlets.length
        ? `<p class="credit">출처 ${outlets.map(escapeHtml).join(' · ')}</p>`
        : '',
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
