import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CalendarLayer from './CalendarLayer';

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

describe('CalendarLayer (#313)', () => {
	it('달력이 있으면 화면 전체 층을 top layer에 올리고, 없어지면 내린다', async () => {
		let open = false;
		const show = vi.fn(() => (open = true));
		const hide = vi.fn(() => (open = false));
		Object.assign(HTMLElement.prototype, { showPopover: show, hidePopover: hide });
		const matches = HTMLElement.prototype.matches;
		vi.spyOn(HTMLElement.prototype, 'matches').mockImplementation(function (this: HTMLElement, selector: string) {
			return selector === ':popover-open' ? open : matches.call(this, selector);
		});

		const { rerender } = render(<CalendarLayer>달력</CalendarLayer>);
		await act(async () => {});
		const layer = document.querySelector('.np-calendar-layer');
		expect(layer?.getAttribute('popover')).toBe('manual');
		expect(layer?.parentElement).toBe(document.body);
		expect(show).toHaveBeenCalledOnce();

		rerender(<CalendarLayer />);
		expect(hide).toHaveBeenCalledOnce();
		expect(document.querySelector('.np-calendar-layer')).toBeNull();
		delete (HTMLElement.prototype as Partial<HTMLElement>).showPopover;
		delete (HTMLElement.prototype as Partial<HTMLElement>).hidePopover;
	});
});
