import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import CalendarLayer from './CalendarLayer';

afterEach(cleanup);

describe('CalendarLayer (#313)', () => {
	it('달력이 있으면 화면 전체 층을 top layer에 올리고, 없어지면 내린다', async () => {
		const { rerender } = render(<CalendarLayer>달력</CalendarLayer>);
		await act(async () => {});
		const layer = document.querySelector<HTMLElement>('.np-calendar-layer');
		expect(layer?.getAttribute('popover')).toBe('manual');
		expect(layer?.parentElement).toBe(document.body);
		expect(layer?.matches(':popover-open')).toBe(true);

		rerender(<CalendarLayer />);
		expect(layer?.matches(':popover-open')).toBe(false);
		expect(document.querySelector('.np-calendar-layer')).toBeNull();
	});
});
