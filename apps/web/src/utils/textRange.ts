/**
 * 본문에서 글자로 Range 찾기 (#123 스크랩 형광펜).
 * 고를 때(selection.toString())와 DOM 글자 사이의 공백 · 줄바꿈이 달라(문단 사이 등) 공백을 모두 빼고 비교한다
 */
export function findTextRange(root: Node, text: string): Range | null {
	const target = text.replace(/\s+/g, '');
	if (!target) return null;
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
	const positions: [Text, number][] = [];
	let stripped = '';
	for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
		const value = node.nodeValue ?? '';
		for (let i = 0; i < value.length; i++) {
			if (/\s/.test(value[i])) continue;
			stripped += value[i];
			positions.push([node, i]);
		}
	}
	const start = stripped.indexOf(target);
	if (start < 0) return null;
	const [startNode, startOffset] = positions[start];
	const [endNode, endOffset] = positions[start + target.length - 1];
	const range = document.createRange();
	range.setStart(startNode, startOffset);
	range.setEnd(endNode, endOffset + 1);
	return range;
}
