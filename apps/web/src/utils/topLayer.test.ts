import { afterEach, describe, expect, it, vi } from 'vitest';
import { hideFromTopLayer, raiseInTopLayer, showInTopLayer } from '@/utils/topLayer';

const popover = () => {
	const el = document.createElement('div');
	el.setAttribute('popover', 'manual');
	document.body.append(el);
	return el;
};

afterEach(() => {
	document.body.innerHTML = '';
});

describe('topLayer (#313)', () => {
	it('올리고 내린다. 이미 올라가 있으면 다시 올리지 않는다', () => {
		const el = popover();
		const show = vi.spyOn(el, 'showPopover');
		showInTopLayer(el);
		showInTopLayer(el);
		expect(show).toHaveBeenCalledOnce();
		expect(el.matches(':popover-open')).toBe(true);
		hideFromTopLayer(el);
		expect(el.matches(':popover-open')).toBe(false);
	});

	it('맨 위로 다시 올릴 때(내렸다가 올림) 안에 있던 포커스를 되돌린다', () => {
		const el = popover();
		const input = document.createElement('textarea');
		el.append(input);
		showInTopLayer(el);
		input.focus();
		const hide = vi.spyOn(el, 'hidePopover').mockImplementation(() => input.blur());
		raiseInTopLayer(el);
		expect(hide).toHaveBeenCalledOnce();
		expect(document.activeElement).toBe(input);
	});

	it('null이면 아무것도 하지 않는다 (ref가 비었을 때)', () => {
		expect(() => {
			showInTopLayer(null);
			hideFromTopLayer(null);
			raiseInTopLayer(null);
		}).not.toThrow();
	});
});
