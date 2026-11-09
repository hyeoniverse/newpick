/** 모델이 본문을 ```html … ```로 감싸 보낸 예전 뉴스레터에서 감싼 줄을 뗀다. 본문이 없으면(null) 빈 문자열 */
export function stripCodeFence(content: string | null = '', language: string = 'html'): string {
	if (content == null) return '';
	const codeFenceStart = `\`\`\`${language}`;
	const codeFenceEnd = '```';

	if (content.startsWith(codeFenceStart) && content.endsWith(codeFenceEnd)) {
		return content.slice(codeFenceStart.length, -codeFenceEnd.length).trim();
	}

	return content;
}
