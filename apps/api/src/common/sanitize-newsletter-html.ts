import { JSDOM } from 'jsdom';

/** 뉴스레터 템플릿(newsletterHtml.ts)이 쓰는 태그만 */
const ALLOWED_TAGS = new Set([
  'article',
  'section',
  'div',
  'span',
  'p',
  'h2',
  'h3',
  'h4',
  'ul',
  'ol',
  'li',
  'strong',
  'em',
  'mark',
  'blockquote',
  'cite',
  'figure',
  'figcaption',
  'img',
  'a',
  'dl',
  'dt',
  'dd',
  'time',
  'br',
]);

/** 태그마다 남길 속성 (모든 태그는 class) */
const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ['href', 'target', 'rel'],
  img: ['src', 'alt', 'loading'],
  time: ['datetime'],
};

/** 통째로 지울 태그 (안의 글자까지) */
const DROP_WITH_CONTENT = new Set([
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'noscript',
  'template',
]);

const safeUrl = (value: string, tag: string) => {
  const url = value.trim().toLowerCase();
  if (tag === 'img') return url.startsWith('https://');
  return /^(https?:|mailto:|\/|#)/.test(url);
};

/**
 * 관리자가 고친 뉴스레터 본문 HTML 정리 (#31, #6 XSS 기준). 허용 목록 밖의 태그는 껍데기만 벗기고(글자는 남김),
 * script · style 같은 건 통째로 지운다. on* 속성 · javascript: 링크 · https가 아닌 사진은 지우고, 새 창 링크엔 noopener
 */
export function sanitizeNewsletterHtml(html: string): string {
  const { document } = new JSDOM('').window;
  const root = document.createElement('div');
  root.innerHTML = html;

  const clean = (node: Element) => {
    for (const child of Array.from(node.children)) {
      const tag = child.tagName.toLowerCase();
      if (DROP_WITH_CONTENT.has(tag)) {
        child.remove();
        continue;
      }
      clean(child);
      if (!ALLOWED_TAGS.has(tag)) {
        child.replaceWith(...Array.from(child.childNodes));
        continue;
      }
      for (const attr of Array.from(child.attributes)) {
        const name = attr.name.toLowerCase();
        const allowed =
          name === 'class' || (ALLOWED_ATTRS[tag] ?? []).includes(name);
        if (
          !allowed ||
          ((name === 'href' || name === 'src') && !safeUrl(attr.value, tag))
        ) {
          child.removeAttribute(attr.name);
        }
      }
      if (tag === 'a' && child.getAttribute('target') === '_blank') {
        child.setAttribute('rel', 'noopener noreferrer');
      }
    }
  };
  clean(root);
  // 주석도 지운다
  const walker = document.createTreeWalker(
    root,
    128 /* NodeFilter.SHOW_COMMENT */,
  );
  const comments: Node[] = [];
  while (walker.nextNode()) comments.push(walker.currentNode);
  comments.forEach((c) => c.parentNode?.removeChild(c));
  return root.innerHTML;
}
