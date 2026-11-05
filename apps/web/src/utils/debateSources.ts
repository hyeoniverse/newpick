/**
 * 엇갈린 주장의 언론사를 그 기사 원문 링크로 (뉴스레터 상세).
 * 소식 끝 '출처' 줄에 언론사마다 원문 링크가 이미 있어, 같은 소식 안에서 언론사 이름이 같은 링크를 쓴다.
 * 본문 HTML 문자열에서 바꾸므로 이미 만들어진 예전 뉴스레터에도 그대로 된다. 짝이 없는 언론사는 글자 그대로
 */
export function linkDebateSources(html: string): string {
	if (!html.includes('class="debate"')) return html;
	return html.replace(/<article\b[\s\S]*?<\/article>/g, (story) => {
		const credit = /<p class="credit">([\s\S]*?)<\/p>/.exec(story)?.[1] ?? '';
		const links = new Map<string, string>();
		for (const [, href, name] of credit.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g)) {
			if (!links.has(name.trim())) links.set(name.trim(), href);
		}
		if (!links.size) return story;
		return story.replace(/<span class="source">([^<]+)<\/span>/g, (span, name: string) => {
			const href = links.get(name.trim());
			return href ? `<a class="source" href="${href}" target="_blank" rel="noopener noreferrer">${name}</a>` : span;
		});
	});
}
