/**
 * 뉴스레터 본문 HTML을 읽기 좋게 줄 · 들여쓰기로 펼친다 (관리자 뉴스레터 고치기 #31).
 * 블록 태그는 한 줄에 하나씩 깊이만큼 들여쓰고, 안에 블록이 없는 태그(제목 · 문단 · 목록 줄 등)는 한 줄로 둔다.
 * 블록 사이 공백만 늘어나므로 화면 · 메일 모양은 바뀌지 않는다
 */
export const INDENT = '  ';

/** 글 안에 들어가는 태그: 줄을 나누지 않는다 */
const INLINE = new Set([
	'span',
	'strong',
	'em',
	'mark',
	'a',
	'cite',
	'time',
	'br',
	'img',
	'b',
	'i',
	'u',
	'small',
	'sub',
	'sup',
]);

const escapeAttr = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

const openTag = (el: Element) =>
	`<${el.tagName.toLowerCase()}${Array.from(el.attributes)
		.map((a) => ` ${a.name}="${escapeAttr(a.value)}"`)
		.join('')}>`;

const isBlock = (node: Node) =>
	node.nodeType === Node.ELEMENT_NODE && !INLINE.has((node as Element).tagName.toLowerCase());

function lines(node: Node, depth: number, out: string[]) {
	const pad = INDENT.repeat(depth);
	if (node.nodeType === Node.TEXT_NODE) {
		const text = node.textContent?.replace(/\s+/g, ' ').trim();
		if (text) out.push(pad + text.replace(/&/g, '&amp;').replace(/</g, '&lt;'));
		return;
	}
	if (node.nodeType !== Node.ELEMENT_NODE) return;
	const el = node as Element;
	const children = Array.from(el.childNodes);
	// 안에 블록이 없으면 한 줄 (제목 · 문단 · 목록 줄 · 사진)
	if (!children.some(isBlock)) {
		out.push(pad + el.outerHTML.replace(/\s*\n\s*/g, ' '));
		return;
	}
	out.push(pad + openTag(el));
	children.forEach((child) => lines(child, depth + 1, out));
	out.push(`${pad}</${el.tagName.toLowerCase()}>`);
}

export function formatHtml(html: string): string {
	if (typeof document === 'undefined' || !html.trim()) return html;
	const template = document.createElement('template');
	template.innerHTML = html;
	const out: string[] = [];
	Array.from(template.content.childNodes).forEach((child) => lines(child, 0, out));
	return out.join('\n');
}

/** 줄 정리로 넣은 줄바꿈 · 들여쓰기를 걷어 내 저장한다 (저장 본문에 공백 글자가 늘지 않게) */
export const compactHtml = (html: string) =>
	html
		.split('\n')
		.map((line) => line.trim())
		.join('');
