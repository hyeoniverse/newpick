/**
 * 뉴스레터 본문 HTML을 사람이 읽기 좋게 펼치고(formatHtml), 저장할 때 다시 붙인다(compactHtml) (관리자 뉴스레터 고치기 #31).
 * prettier처럼 한 줄 너비(WIDTH)를 넘으면 나눈다:
 * - 블록 태그는 한 줄에 하나, 깊이만큼 들여쓰기
 * - 안의 글이 길면 여는 태그 / 글(낱말 사이에서 줄바꿈) / 닫는 태그
 * - 여는 태그가 길면 속성을 한 줄에 하나씩
 * 줄은 공백이 있던 자리에서만 나누므로, 다시 붙일 때 공백 하나로 돌려놓으면 원래 HTML과 같다
 */
export const INDENT = '  ';

/** 한 줄 너비 (고치기 화면 편집 칸에 맞춤). 한글은 두 칸으로 센다 */
const WIDTH = 50;

/** 글 안에 들어가는 태그: 블록처럼 줄을 나누지 않는다 */
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
const VOID = new Set(['img', 'br', 'hr']);

const columns = (text: string) => {
	let n = 0;
	for (const ch of text) n += /[ᄀ-ᇿ　-鿿가-힯＀-￯]/.test(ch) ? 2 : 1;
	return n;
};

const escapeAttr = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const attrs = (el: Element) => Array.from(el.attributes).map((a) => `${a.name}="${escapeAttr(a.value)}"`);
const tagName = (el: Element) => el.tagName.toLowerCase();

const isBlock = (node: Node) => node.nodeType === Node.ELEMENT_NODE && !INLINE.has(tagName(node as Element));

/**
 * 한 줄에 이어진 글 · 인라인 태그를 나눌 수 있는 조각으로 자른다. 줄은 두 군데에서만 나눈다:
 * - 글의 낱말 사이 공백 (태그 바로 앞뒤 공백은 빼고) → 붙일 때 공백 하나
 * - 닫힌 태그 바로 뒤에 새 태그가 붙어 시작하는 곳 (`</span><strong>`) → 붙일 때 그대로
 * 태그 속은 나누지 않는다 (붙일 때 '>' 뒤 · '<' 앞은 공백 없이 붙이므로 위 두 경우만 원래대로 돌아온다)
 */
function pieces(html: string): string[] {
	const out: string[] = [];
	let afterClose = false;
	for (const part of html.match(/<[^>]*>|[^<]+/g) ?? []) {
		if (part.startsWith('<')) {
			const opening = !part.startsWith('</');
			if ((opening && afterClose) || !out.length) out.push(part);
			else out[out.length - 1] = (out.at(-1) ?? '') + part;
			afterClose =
				!opening ||
				VOID.has(
					part
						.slice(1)
						.split(/[\s>/]/)[0]
						.toLowerCase(),
				);
			continue;
		}
		part.split(' ').forEach((word, i) => {
			const last = out.at(-1) ?? '';
			if (i > 0 && word && last && !last.endsWith('>')) out.push(word);
			else out[out.length ? out.length - 1 : 0] = last + (i > 0 ? ' ' : '') + word;
		});
		afterClose = false;
	}
	return out;
}

/** 조각을 너비만큼 줄에 채운다. 앞 조각이 태그로 끝나면 공백 없이, 아니면 공백 하나로 잇는다 */
function wrap(html: string, pad: string, out: string[]) {
	const room = WIDTH - columns(pad);
	let line = '';
	for (const piece of pieces(html)) {
		const next = line + (line && !line.endsWith('>') ? ' ' : '') + piece;
		if (line && columns(next) > room) {
			out.push(pad + line);
			line = piece;
		} else {
			line = next;
		}
	}
	if (line) out.push(pad + line);
}

/** 여는 태그. 너비를 넘으면 속성을 한 줄에 하나씩 (마지막 속성 뒤에 '>') */
function openTag(el: Element, pad: string, out: string[]) {
	const list = attrs(el);
	const one = `<${tagName(el)}${list.map((a) => ` ${a}`).join('')}>`;
	if (!list.length || columns(pad + one) <= WIDTH) {
		out.push(pad + one);
		return;
	}
	out.push(`${pad}<${tagName(el)}`);
	list.forEach((a, i) => out.push(`${pad}${INDENT}${a}${i === list.length - 1 ? '>' : ''}`));
}

function lines(node: Node, depth: number, out: string[]) {
	const pad = INDENT.repeat(depth);
	if (node.nodeType === Node.TEXT_NODE) {
		const text = node.textContent?.replace(/\s+/g, ' ').trim();
		if (text) wrap(text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'), pad, out);
		return;
	}
	if (node.nodeType !== Node.ELEMENT_NODE) return;
	const el = node as Element;
	const children = Array.from(el.childNodes);

	// 안에 블록이 없으면 (제목 · 문단 · 목록 줄 · 사진): 한 줄에 들어가면 한 줄, 아니면 펼친다
	if (!children.some(isBlock)) {
		const whole = el.outerHTML.replace(/\s+/g, ' ');
		if (columns(pad + whole) <= WIDTH) {
			out.push(pad + whole);
			return;
		}
		openTag(el, pad, out);
		if (VOID.has(tagName(el))) return;
		const inner = el.innerHTML.replace(/\s+/g, ' ').trim();
		if (inner) wrap(inner, pad + INDENT, out);
		out.push(`${pad}</${tagName(el)}>`);
		return;
	}
	openTag(el, pad, out);
	children.forEach((child) => lines(child, depth + 1, out));
	out.push(`${pad}</${tagName(el)}>`);
}

export function formatHtml(html: string): string {
	if (typeof document === 'undefined' || !html.trim()) return html;
	const template = document.createElement('template');
	template.innerHTML = compactHtml(html);
	const out: string[] = [];
	Array.from(template.content.childNodes).forEach((child) => lines(child, 0, out));
	return out.join('\n');
}

/**
 * 줄을 다시 붙여 저장한다 (저장 본문에 줄바꿈 · 들여쓰기 공백이 늘지 않게).
 * 태그와 태그 · 태그와 글 사이는 그냥 붙이고, 글 · 속성이 이어지는 자리는 공백 하나로 (나눈 자리에 있던 공백)
 */
export const compactHtml = (html: string) =>
	html
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean)
		.reduce(
			(joined, line) => (!joined || joined.endsWith('>') || line.startsWith('<') ? joined + line : `${joined} ${line}`),
			'',
		);
