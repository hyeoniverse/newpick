import type { ComposedEdition, ComposedStory } from './compose';
import type { Block, Link, Run } from './parse';

/**
 * 구독 메일 HTML (#55). 메일 앱은 사이트 CSS·<style>을 제대로 쓰지 못해 모든 모양을 인라인 스타일로 준다.
 * 체험하기 미리보기도 이 HTML을 그대로 보여 준다 (실제 메일과 같은 모양)
 */

const C = {
  primary: '#3610e1',
  tint: '#f4f1ff',
  mark: '#e3dcfd',
  text: '#111111',
  sub: '#5f5f66',
  muted: '#8a8a92',
  border: '#e6e6ea',
  page: '#f4f4f6',
};
const FONT =
  "-apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Pretendard', 'Malgun Gothic', sans-serif";

const esc = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const isWebUrl = (url?: string) => !!url && /^https?:\/\//i.test(url);

const a = (text: string, url?: string, style = `color:${C.sub};`) =>
  isWebUrl(url)
    ? `<a href="${esc(url!)}" target="_blank" rel="noopener noreferrer" style="${style}text-decoration:underline;">${esc(text)}</a>`
    : esc(text);

const runs = (list: Run[]) =>
  list
    .map((r) =>
      r.mark
        ? `<span style="background:${C.mark};padding:0 2px;">${esc(r.text)}</span>`
        : esc(r.text),
    )
    .join('')
    .trim();

const P = `margin:0 0 14px;font-size:15px;line-height:1.75;color:${C.text};`;

const paragraphs = (list: Run[][]) =>
  list.map((p) => `<p style="${P}">${runs(p)}</p>`).join('');

const label = (text: string) =>
  `<p style="margin:0 0 6px;font-size:13px;font-weight:700;color:${C.primary};">${esc(text)}</p>`;

function block(b: Block): string {
  switch (b.type) {
    case 'body':
      return paragraphs(b.paragraphs);
    case 'analysis':
      return `<div style="margin:4px 0 16px;padding:14px 16px;background:${C.tint};border-radius:8px;">${label(b.label)}${paragraphs(b.paragraphs).replace(/margin:0 0 14px/g, 'margin:0 0 8px')}</div>`;
    case 'stats':
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border-collapse:collapse;">${b.rows
        .map(
          (r) =>
            `<tr><td style="padding:8px 0;border-bottom:1px solid ${C.border};font-size:13px;color:${C.sub};">${esc(r.label)}</td><td style="padding:8px 0;border-bottom:1px solid ${C.border};font-size:15px;font-weight:700;color:${C.text};text-align:right;white-space:nowrap;">${esc(r.value)}</td><td style="padding:8px 0 8px 10px;border-bottom:1px solid ${C.border};font-size:12px;color:${C.muted};text-align:right;">${esc(r.note)}</td></tr>`,
        )
        .join('')}</table>`;
    case 'timeline':
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border-collapse:collapse;">${b.rows
        .map(
          (r) =>
            `<tr><td style="padding:6px 12px 6px 0;vertical-align:top;font-size:13px;font-weight:700;color:${C.primary};white-space:nowrap;">${esc(r.when)}</td><td style="padding:6px 0;font-size:14px;line-height:1.6;color:${C.text};">${esc(r.what)}</td></tr>`,
        )
        .join('')}</table>`;
    case 'qa':
      return b.rows
        .map(
          (r) =>
            `<p style="margin:0 0 4px;font-size:14px;font-weight:700;color:${C.text};">Q. ${esc(r.q)}</p><p style="${P}">${runs(r.a)}</p>`,
        )
        .join('');
    case 'quote':
      return `<blockquote style="margin:0 0 16px;padding:4px 0 4px 14px;border-left:3px solid ${C.primary};"><p style="margin:0 0 4px;font-size:16px;line-height:1.6;font-weight:600;color:${C.text};">“${esc(b.text)}”</p><p style="margin:0;font-size:13px;color:${C.muted};">${esc(b.by)}</p></blockquote>`;
  }
}

const caption = (links: Link[]) =>
  links.map((l) => a(l.text, l.url, `color:${C.muted};`)).join('');

function story({ story: s, alsoIn }: ComposedStory, first: boolean): string {
  return [
    `<div style="${first ? '' : `margin-top:28px;padding-top:24px;border-top:1px solid ${C.border};`}">`,
    s.kicker
      ? `<p style="margin:0 0 6px;font-size:12px;font-weight:700;color:${C.primary};letter-spacing:0.02em;">${esc(s.kicker)}</p>`
      : '',
    `<h2 style="margin:0 0 8px;font-size:21px;line-height:1.4;font-weight:800;color:${C.text};">${esc(s.heading)}</h2>`,
    s.lead
      ? `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;font-weight:600;color:${C.sub};">${esc(s.lead)}</p>`
      : '',
    s.image
      ? `<img src="${esc(s.image.url)}" alt="${esc(s.image.alt)}" width="536" style="display:block;width:100%;max-width:536px;height:auto;border-radius:8px;margin:0 0 6px;">` +
        `<p style="margin:0 0 16px;font-size:11px;color:${C.muted};">${caption(s.image.caption)}</p>`
      : '',
    s.blocks.map(block).join(''),
    s.sources.length
      ? `<p style="margin:0;font-size:12px;color:${C.muted};">출처 ${s.sources.map((l) => a(l.text, l.url, `color:${C.muted};`)).join(' · ')}</p>`
      : '',
    alsoIn.length
      ? `<p style="margin:6px 0 0;font-size:12px;color:${C.muted};">${esc(alsoIn.join('·'))} 뉴스레터에도 실린 소식입니다</p>`
      : '',
    '</div>',
  ].join('');
}

const tag = (text: string) =>
  `<span style="display:inline-block;margin-right:6px;font-size:12px;font-weight:700;color:${C.primary};">${esc(text)}</span>`;

const heading = (text: string) =>
  `<h3 style="margin:0 0 14px;font-size:13px;font-weight:800;letter-spacing:0.04em;color:${C.muted};">${esc(text)}</h3>`;

const card = (inner: string) =>
  `<tr><td style="padding:26px 24px;background:#ffffff;border-radius:12px;">${inner}</td></tr><tr><td style="height:12px;line-height:12px;font-size:0;">&nbsp;</td></tr>`;

export function renderEditionMail(
  edition: ComposedEdition,
  frontendUrl: string,
  /** 문의처: 메일을 보내는 주소 (답장도 여기로 온다) */
  contactEmail = '',
): string {
  const base = frontendUrl.replace(/\/$/, '');

  const header = card(
    [
      `<p style="margin:0 0 4px;font-size:20px;font-weight:900;color:${C.primary};">NewPick</p>`,
      `<p style="margin:0 0 22px;font-size:13px;color:${C.muted};">${esc(edition.dateLabel)} · ${esc(edition.categories.join(' · '))}</p>`,
      heading('오늘 한눈에'),
      edition.top
        .map(
          (t, i) =>
            `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr><td style="width:26px;padding:0 0 14px;vertical-align:top;font-size:15px;font-weight:800;color:${C.primary};">${i + 1}</td><td style="padding:0 0 14px;vertical-align:top;">${tag(t.category)}<span style="font-size:15px;font-weight:700;line-height:1.5;color:${C.text};">${esc(t.heading)}</span><p style="margin:3px 0 0;font-size:14px;line-height:1.6;color:${C.sub};">${esc(t.line)}</p></td></tr></table>`,
        )
        .join(''),
    ].join(''),
  );

  const threads = edition.threads.length
    ? card(
        heading('분야를 넘는 흐름') +
          edition.threads
            .map(
              (t, i) =>
                `<div style="${i ? 'margin-top:12px;' : ''}padding:16px 18px;background:${C.tint};border-radius:8px;"><p style="margin:0 0 6px;font-size:12px;font-weight:700;color:${C.primary};">${esc(t.categories.join(' × '))}</p><p style="margin:0 0 6px;font-size:16px;font-weight:800;line-height:1.45;color:${C.text};">${esc(t.title)}</p><p style="margin:0;font-size:14px;line-height:1.7;color:${C.text};">${esc(t.text)}</p></div>`,
            )
            .join(''),
      )
    : '';

  const sections = edition.sections
    .map((section) =>
      card(
        [
          `<p style="margin:0 0 18px;padding-bottom:10px;border-bottom:2px solid ${C.primary};font-size:15px;font-weight:900;color:${C.primary};">${esc(section.category)}</p>`,
          section.fallback
            ? `<h2 style="margin:0 0 8px;font-size:21px;line-height:1.4;font-weight:800;color:${C.text};">${esc(section.title)}</h2>` +
              (section.fallback.subtitle
                ? `<p style="margin:0 0 12px;font-size:15px;font-weight:600;color:${C.sub};">${esc(section.fallback.subtitle)}</p>`
                : '') +
              `<p style="${P}">${esc(section.fallback.summary)}</p>`
            : section.stories.map((s, i) => story(s, i === 0)).join(''),
          `<p style="margin:22px 0 0;"><a href="${esc(`${base}/articles/detail/${section.newsletterId}`)}" target="_blank" rel="noopener noreferrer" style="font-size:14px;font-weight:700;color:${C.primary};text-decoration:none;">${esc(section.category)} 뉴스레터 전문 보기 →</a></p>`,
        ].join(''),
      ),
    )
    .join('');

  const watch = edition.watch.length
    ? card(
        heading('관전 포인트') +
          `<ul style="margin:0;padding:0 0 0 18px;">${edition.watch
            .map(
              (w) =>
                `<li style="margin:0 0 8px;font-size:14px;line-height:1.65;color:${C.text};">${esc(w)}</li>`,
            )
            .join('')}</ul>`,
      )
    : '';

  // 문의처·약관·수신 거부(구독 관리) 링크 (정보통신망법 제50조: 수신 거부 방법 안내)
  const footerLink = (text: string, href: string) =>
    `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer" style="color:${C.muted};text-decoration:underline;">${esc(text)}</a>`;
  const footer = `<tr><td style="padding:8px 24px 0;font-size:12px;line-height:1.8;color:${C.muted};text-align:center;">뉴픽은 AI가 여러 언론사 기사를 모아 정리한 뉴스레터입니다. 수치·발언은 출처 기사를 함께 확인하세요.<br>${[
    footerLink('관심 분야 바꾸기', `${base}/mypage?tab=settings`),
    footerLink('수신 거부', `${base}/mypage?tab=settings`),
    footerLink('뉴픽 홈', `${base}/`),
    footerLink('이용약관', `${base}/terms`),
    footerLink('개인정보처리방침', `${base}/privacy`),
  ].join(' · ')}${
    contactEmail
      ? `<br>문의 ${footerLink(contactEmail, `mailto:${contactEmail}`)}`
      : ''
  }</td></tr>`;

  // 받은편지함 목록에 보이는 미리보기 글 (본문에는 보이지 않음)
  const preheader = edition.top[0]?.line
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(edition.top[0].line)}</div>`
    : '';

  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(edition.subject)}</title></head><body style="margin:0;padding:0;background:${C.page};">${preheader}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.page};font-family:${FONT};"><tr><td align="center" style="padding:20px 8px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;border-collapse:separate;">${header}${threads}${sections}${watch}${footer}</table></td></tr></table></body></html>`;
}
