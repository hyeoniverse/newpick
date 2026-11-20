import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTopLayer } from '@/hooks/useTopLayer';

/** jsdom은 popover를 몰라서, 필요한 것만 흉내 낸 띄울 요소 */
function fakePanel(width: number, height: number) {
	let open = false;
	const panel = document.createElement('div');
	Object.assign(panel, {
		showPopover: vi.fn(() => (open = true)),
		hidePopover: vi.fn(() => (open = false)),
	});
	panel.matches = (selector: string) => (selector === ':popover-open' ? open : false);
	Object.defineProperty(panel, 'offsetWidth', { value: width });
	Object.defineProperty(panel, 'offsetHeight', { value: height });
	return panel as unknown as HTMLElement & {
		showPopover: ReturnType<typeof vi.fn>;
		hidePopover: ReturnType<typeof vi.fn>;
	};
}

function anchorAt(rect: { top: number; left: number; width: number; height: number }) {
	const anchor = document.createElement('button');
	anchor.getBoundingClientRect = () =>
		({ ...rect, bottom: rect.top + rect.height, right: rect.left + rect.width, x: rect.left, y: rect.top }) as DOMRect;
	return anchor;
}

beforeEach(() => {
	Object.defineProperty(window, 'innerWidth', { value: 400, configurable: true });
	Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
});
afterEach(() => vi.restoreAllMocks());

describe('useTopLayer (#313)', () => {
	it('열면 top layer에 올리고 기준 바로 아래에 붙인다, 닫으면 내린다', () => {
		const panel = fakePanel(120, 200);
		const anchorRef = { current: anchorAt({ top: 100, left: 50, width: 80, height: 40 }) };
		const panelRef = { current: panel };
		const { rerender } = renderHook(({ open }) => useTopLayer({ open, anchorRef, panelRef, width: 'exact' }), {
			initialProps: { open: true },
		});
		expect(panel.showPopover).toHaveBeenCalledOnce();
		expect(panel.style.top).toBe('144px');
		expect(panel.style.left).toBe('50px');
		expect(panel.style.width).toBe('80px');
		expect(panel.dataset.side).toBe('bottom');
		rerender({ open: false });
		expect(panel.hidePopover).toHaveBeenCalledOnce();
	});

	it('아래 자리가 모자라면 위로 연다', () => {
		const panel = fakePanel(120, 200);
		renderHook(() =>
			useTopLayer({
				open: true,
				anchorRef: { current: anchorAt({ top: 700, left: 50, width: 80, height: 40 }) },
				panelRef: { current: panel },
			}),
		);
		expect(panel.style.top).toBe(`${700 - 4 - 200}px`);
		expect(panel.dataset.side).toBe('top');
	});

	it("align 'end'는 기준 오른쪽 끝에 맞추고, 화면 밖으로 나가지 않게 가장자리 8px 안으로", () => {
		const panel = fakePanel(150, 100);
		renderHook(() =>
			useTopLayer({
				open: true,
				anchorRef: { current: anchorAt({ top: 100, left: 300, width: 90, height: 30 }) },
				panelRef: { current: panel },
				align: 'end',
			}),
		);
		expect(panel.style.left).toBe(`${390 - 150}px`);

		const wide = fakePanel(300, 100);
		renderHook(() =>
			useTopLayer({
				open: true,
				anchorRef: { current: anchorAt({ top: 100, left: 250, width: 40, height: 30 }) },
				panelRef: { current: wide },
			}),
		);
		expect(wide.style.left).toBe(`${400 - 300 - 8}px`);
	});

	it('popover를 모르는 브라우저에서는 아무것도 하지 않는다 (제자리에 그림)', () => {
		const panel = document.createElement('div');
		renderHook(() =>
			useTopLayer({
				open: true,
				anchorRef: { current: anchorAt({ top: 100, left: 50, width: 80, height: 40 }) },
				panelRef: { current: panel },
			}),
		);
		expect(panel.style.top).toBe('');
	});
});
