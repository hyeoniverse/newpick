import type { Story } from './newsletterWriter.service';

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * 뉴스레터 본문 HTML. 예전에는 모델이 인라인 스타일까지 매번 다르게 만들었습니다 (#43).
 * 이제 구조만 만들고, 모양은 웹이 사이트 테마(색·글꼴·다크 모드)로 입힙니다.
 */
export function renderNewsletterHtml(stories: Story[]): string {
  const sections = stories.map((story) => {
    const paragraphs = story.body
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p>${escapeHtml(p)}</p>`)
      .join('');
    return `<section class="story"><h2>${escapeHtml(story.heading)}</h2>${paragraphs}</section>`;
  });
  return `<div class="newsletter">${sections.join('')}</div>`;
}
