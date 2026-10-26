import { JSDOM } from 'jsdom';

/**
 * 저장된 뉴스레터 본문 HTML(newsletterHtml.ts가 만든 것)을 다시 구조로 읽는다 (#55).
 * 메일은 사이트 CSS를 쓸 수 없어 인라인 스타일로 다시 그려야 하고, 편집 단계는 글자만 필요하다.
 * 구조를 따로 저장하지 않아도 지난 뉴스레터까지 그대로 쓸 수 있다.
 *
 * 글자는 모두 textContent로 꺼내 다시 이스케이프한다. 강조(<mark>)와 링크(http/https)만 살린다
 */

/** 글자 조각. mark: 형광펜 강조 (#51) */
export type Run = { text: string; mark?: boolean };
export type Link = { text: string; url?: string };

export type Block =
  | { type: 'body'; paragraphs: Run[][] }
  | { type: 'analysis'; label: string; paragraphs: Run[][] }
  | { type: 'stats'; rows: { label: string; value: string; note: string }[] }
  | { type: 'timeline'; rows: { when: string; what: string }[] }
  | { type: 'qa'; rows: { q: string; a: Run[] }[] }
  | { type: 'quote'; text: string; by: string };

export type ParsedStory = {
  kicker: string;
  heading: string;
  lead: string;
  image?: { url: string; alt: string; caption: Link[] };
  blocks: Block[];
  sources: Link[];
};

export type ParsedNewsletter = {
  briefing: string;
  stories: ParsedStory[];
  watch: string[];
};

const isWebUrl = (url?: string | null) => !!url && /^https?:\/\//i.test(url);

const text = (el?: Element | null) =>
  (el?.textContent ?? '').replace(/\s+/g, ' ').trim();

/** 문단 안의 글자와 강조만 */
const runs = (el: Element): Run[] =>
  [...el.childNodes]
    .map((node) => ({
      text: (node.textContent ?? '').replace(/\s+/g, ' '),
      mark: node.nodeName === 'MARK' || undefined,
    }))
    .filter((r) => r.text.trim());

const paragraphs = (el: Element) =>
  [...el.querySelectorAll(':scope > p')].map(runs).filter((p) => p.length);

/** 글자와 링크가 섞인 줄 (사진 설명·출처) */
const links = (el: Element): Link[] =>
  [...el.childNodes]
    .map((node) => {
      const href =
        node.nodeName === 'A' ? (node as Element).getAttribute('href') : null;
      return {
        text: (node.textContent ?? '').replace(/\s+/g, ' '),
        url: isWebUrl(href) ? href! : undefined,
      };
    })
    .filter((l) => l.text);

function parseBlocks(article: Element): Block[] {
  const blocks: Block[] = [];
  for (const el of article.children) {
    if (el.matches('div.body')) {
      blocks.push({ type: 'body', paragraphs: paragraphs(el) });
    } else if (el.matches('div.analysis')) {
      blocks.push({
        type: 'analysis',
        label: text(el.querySelector('h3')) || '시사점',
        paragraphs: paragraphs(el),
      });
    } else if (el.matches('div.stats')) {
      blocks.push({
        type: 'stats',
        rows: [...el.querySelectorAll('.stat')].map((s) => ({
          label: text(s.querySelector('.label')),
          value: text(s.querySelector('.value')),
          note: text(s.querySelector('.note')),
        })),
      });
    } else if (el.matches('ol.timeline')) {
      blocks.push({
        type: 'timeline',
        rows: [...el.querySelectorAll('li')].map((li) => ({
          when: text(li.querySelector('time')),
          what: text(li.querySelector('span')),
        })),
      });
    } else if (el.matches('dl.qa')) {
      const answers = [...el.querySelectorAll('dd')];
      blocks.push({
        type: 'qa',
        rows: [...el.querySelectorAll('dt')].map((dt, i) => ({
          q: text(dt),
          a: answers[i] ? runs(answers[i]) : [],
        })),
      });
    } else if (el.matches('blockquote.quote')) {
      blocks.push({
        type: 'quote',
        text: text(el.querySelector('p')),
        by: text(el.querySelector('cite')),
      });
    }
  }
  return blocks;
}

function parseStory(article: Element): ParsedStory {
  const kicker = article.querySelector('.kicker');
  kicker?.querySelector('.index')?.remove();
  const img = article.querySelector('figure.story-image img');
  const caption = article.querySelector('figure.story-image figcaption');
  const credit = article.querySelector('p.credit');
  const src = img?.getAttribute('src');
  return {
    kicker: text(kicker),
    heading: text(article.querySelector('h2')),
    lead: text(article.querySelector('p.lead')),
    image: isWebUrl(src)
      ? {
          url: src!,
          alt: img!.getAttribute('alt') ?? '',
          caption: caption ? links(caption) : [],
        }
      : undefined,
    blocks: parseBlocks(article),
    sources: credit ? sourceLinks(credit) : [],
  };
}

/** "출처 <a>KBS</a> · 연합뉴스" → 언론사마다 하나. 머리말과 " · "는 그릴 때 다시 붙인다 */
const sourceLinks = (credit: Element): Link[] =>
  links(credit).flatMap((l) =>
    l.url
      ? [{ text: l.text.trim(), url: l.url }]
      : l.text
          .replace(/^\s*출처/, '')
          .split('·')
          .map((name) => name.trim())
          .filter(Boolean)
          .map((name) => ({ text: name })),
  );

/** 구조가 없는 예전 뉴스레터(#43 이전)는 소식이 빈 채로 돌려준다. 메일은 제목·요약만 쓴다 */
export function parseNewsletterHtml(html?: string | null): ParsedNewsletter {
  const empty = { briefing: '', stories: [], watch: [] };
  if (!html) return empty;
  const root = new JSDOM(html).window.document.querySelector('.newsletter');
  if (!root) return empty;
  const briefing = root.querySelector('section.briefing');
  briefing?.querySelector('h3')?.remove();
  return {
    briefing: text(briefing),
    stories: [...root.querySelectorAll('article.story')]
      .map(parseStory)
      .filter((s) => s.heading),
    watch: [...root.querySelectorAll('section.watch li')]
      .map((li) => text(li))
      .filter(Boolean),
  };
}

/** 편집 단계에 보낼 글자 (본문 앞부분) */
export const storyText = (story: ParsedStory, max = 300) => {
  const body = story.blocks
    .flatMap((b) => (b.type === 'body' ? b.paragraphs : []))
    .map((p) => p.map((r) => r.text).join(''))
    .join(' ');
  return body.length > max ? `${body.slice(0, max)}…` : body;
};
