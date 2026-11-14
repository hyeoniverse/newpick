import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DATE_PRESETS, DAY_PRESETS, presetRange } from './periods';

describe('미리 정한 기간', () => {
	// 한국 날짜 기준: UTC 11월 14일 16시 = 한국 11월 15일 새벽 1시
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-11-14T16:00:00Z'));
	});
	afterEach(() => vi.useRealTimers());

	it('끝은 오늘, 시작은 며칠 전 (어제만 하루)', () => {
		const ranges = Object.fromEntries(DATE_PRESETS.map((p) => [p.key, presetRange(p)]));
		expect(ranges).toEqual({
			today: { from: '2026-11-15', to: '2026-11-15' },
			yesterday: { from: '2026-11-14', to: '2026-11-14' },
			'7d': { from: '2026-11-09', to: '2026-11-15' },
			'30d': { from: '2026-10-17', to: '2026-11-15' },
		});
	});

	it('하루짜리는 오늘 · 어제', () => {
		expect(DAY_PRESETS.map((p) => p.label)).toEqual(['오늘', '어제']);
	});
});
