import { describe as group, expect, it } from 'vitest';
import type { Schedule } from '@newpick/shared';
import { JOB_LABEL, clock, describe, scheduleText } from './jobs';

const schedule: Schedule = {
	crawl: { hour: 0, minute: 5 },
	summary: { hour: 8, minute: 30 },
	mail: { hour: 8, minute: 40, day: 7 },
};

group('clock · describe', () => {
	it("두 자리 시각, 7은 '매일', 0~6은 '매주 ○요일'", () => {
		expect(clock({ hour: 8, minute: 5 })).toBe('08:05');
		expect(describe({ hour: 8, minute: 40 })).toBe('매일 08:40');
		expect(describe({ hour: 8, minute: 40 }, 1)).toBe('매주 월요일 08:40');
		expect(describe({ hour: 9, minute: 0 }, 0)).toBe('매주 일요일 09:00');
	});
});

group('scheduleText', () => {
	it("기사 수집은 '매시 MM분', AI 요약은 매일, 구독 메일은 요일까지", () => {
		expect(scheduleText('crawling', schedule)).toBe('매시 05분');
		expect(scheduleText('summary', schedule)).toBe('매일 08:30');
		expect(scheduleText('mail', schedule)).toBe('매일 08:40');
		expect(scheduleText('mail', { ...schedule, mail: { hour: 8, minute: 40, day: 1 } })).toBe('매주 월요일 08:40');
	});

	it('작업 이름은 화면 순서대로 셋', () => {
		expect(Object.values(JOB_LABEL)).toEqual(['기사 수집', 'AI 요약', '구독 메일']);
	});
});
