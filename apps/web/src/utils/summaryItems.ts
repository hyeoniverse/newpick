/**
 * 'AI 요약'을 소식별 목록으로 (뉴스레터 상세): 요약은 소식마다 한두 문장을 이어 쓴 글이라 문장 · 줄바꿈으로 나눈다.
 * 소수점(51.76%) · 말줄임처럼 마침표 뒤에 띄어쓰기가 없으면 나누지 않는다. 문장이 하나면 그대로 한 항목
 */
export function summaryItems(text: string): string[] {
	return text
		.split(/\n+/)
		.flatMap((paragraph) => paragraph.split(/(?<=[.!?。…]["”’'」)]?)\s+(?=\S)/))
		.map((sentence) => sentence.trim())
		.filter(Boolean);
}
