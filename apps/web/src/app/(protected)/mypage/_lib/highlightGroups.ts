import type { Highlight } from '@newpick/shared';
import { kstDate, kstDateOf } from '@/utils/formatter';

/** 구역 이름: 브리핑은 '에디터 브리핑', 소식은 뉴스레터 본문처럼 번호(01) + 그 소식의 제목 */
export function sectionName(highlight: Highlight) {
	if (highlight.section === 'briefing') return { index: null, name: '에디터 브리핑' };
	const story = highlight.section?.match(/^story-(\d+)$/);
	if (!story) return { index: null, name: null };
	return { index: story[1].padStart(2, '0'), name: highlight.sectionTitle || `소식 ${story[1]}` };
}

/** 고른 스크랩을 글로 복사: 문장 · 출처 · 메모 */
export function asText(items: Highlight[]) {
	return items
		.map((h) => {
			const { index, name } = sectionName(h);
			const source = [h.newsletter?.category.name, h.newsletter?.title, [index, name].filter(Boolean).join(' ')]
				.filter(Boolean)
				.join(' · ');
			return [`“${h.text}”`, `— ${source}`, h.note && `메모: ${h.note}`].filter(Boolean).join('\n');
		})
		.join('\n\n');
}

/** 날짜 머리: 오늘 · 어제 · 올해는 '10월 27일 (화)', 지난해부터는 '2025년 10월 27일 (월)' */
export function dayLabel(day: string) {
	const today = kstDate(0);
	const yesterday = kstDate(1);
	if (day === today) return '오늘';
	if (day === yesterday) return '어제';
	const date = new Date(`${day}T12:00:00+09:00`);
	// 날짜와 요일을 따로 만든다: Intl은 연도를 넣으면 요일 괄호를 빼고 '2025년 10월 27일 월'로 써서
	const ymd = new Intl.DateTimeFormat('ko-KR', {
		timeZone: 'Asia/Seoul',
		...(day.slice(0, 4) !== today.slice(0, 4) && { year: 'numeric' }),
		month: 'long',
		day: 'numeric',
	}).format(date);
	const weekday = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', weekday: 'short' }).format(date);
	return `${ymd} (${weekday})`;
}

/** 받은 순서(최근순 · 오래된순) 그대로 스크랩한 날짜별로 묶는다 */
export function byDay(items: Highlight[]) {
	const groups: { day: string; items: Highlight[] }[] = [];
	for (const item of items) {
		const day = kstDateOf(item.createdAt);
		const last = groups[groups.length - 1];
		if (last?.day === day) last.items.push(item);
		else groups.push({ day, items: [item] });
	}
	return groups;
}

export type StoryBlock = { newsletterId: number; section: string | null; items: Highlight[] };

/** 하루 안에서 이어진 같은 소식(뉴스레터 · 구역)의 스크랩을 한 블록으로: 스크랩은 소식 단위로 하므로 블록도 소식 단위 */
export function byStory(items: Highlight[]) {
	const blocks: StoryBlock[] = [];
	for (const item of items) {
		const last = blocks[blocks.length - 1];
		if (last?.newsletterId === item.newsletterId && last.section === item.section) last.items.push(item);
		else blocks.push({ newsletterId: item.newsletterId, section: item.section, items: [item] });
	}
	return blocks;
}
