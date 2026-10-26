import type { WrittenNewsletter } from './newsletterWriter.service';

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const paragraphs = (text: string, className?: string) =>
  text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p${className ? ` class="${className}"` : ''}>${escapeHtml(p)}</p>`,
    )
    .join('');

/**
 * 뉴스레터 본문 HTML. 예전에는 모델이 인라인 스타일까지 매번 다르게 만들었습니다 (#43).
 * 이제 구조와 class만 만들고, 모양은 웹이 사이트 테마(색·글꼴·다크 모드)로 입힙니다.
 *
 * 여는 말 → 소식(번호 · 소제목 · 한 줄 핵심 · 포인트 · 왜 중요할까요?) → 맺는 말
 */
export function renderNewsletterHtml(
  newsletter: Pick<WrittenNewsletter, 'intro' | 'stories' | 'outro'>,
): string {
  const stories = newsletter.stories.map((story, i) => {
    const points = story.points.length
      ? `<ul class="points">${story.points.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}</ul>`
      : '';
    const why = story.why
      ? `<div class="why"><strong>왜 중요할까요?</strong>${paragraphs(story.why)}</div>`
      : '';
    return [
      '<section class="story">',
      `<span class="story-index">${String(i + 1).padStart(2, '0')}</span>`,
      `<h2>${escapeHtml(story.heading)}</h2>`,
      story.lead ? `<p class="lead">${escapeHtml(story.lead)}</p>` : '',
      points,
      why,
      '</section>',
    ].join('');
  });
  return [
    '<div class="newsletter">',
    newsletter.intro ? paragraphs(newsletter.intro, 'intro') : '',
    stories.join(''),
    newsletter.outro ? paragraphs(newsletter.outro, 'outro') : '',
    '</div>',
  ].join('');
}
