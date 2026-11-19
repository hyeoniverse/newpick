import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useNearViewport } from '@/hooks/useNearViewport';

type Callback = (entries: { isIntersecting: boolean }[]) => void;
let callback: Callback = () => {};
const observe = vi.fn();
const disconnect = vi.fn();

class FakeObserver {
	constructor(
		cb: Callback,
		public options: { rootMargin?: string },
	) {
		callback = cb;
		lastOptions = options;
	}
	observe = observe;
	disconnect = disconnect;
}
let lastOptions: { rootMargin?: string } = {};

afterEach(() => {
	vi.unstubAllGlobals();
	vi.clearAllMocks();
});

const ref = { current: document.createElement('div') };

describe('useNearViewport', () => {
	it('화면 margin 안으로 들어오면 true, 그 뒤로는 지켜보지 않는다', () => {
		vi.stubGlobal('IntersectionObserver', FakeObserver);
		const { result } = renderHook(() => useNearViewport(ref, { margin: '300px' }));
		expect(result.current).toBe(false);
		expect(lastOptions.rootMargin).toBe('300px');
		act(() => callback([{ isIntersecting: true }]));
		expect(result.current).toBe(true);
		expect(disconnect).toHaveBeenCalled();
	});

	it('enabled가 false면 처음부터 true (지켜보지 않음)', () => {
		vi.stubGlobal('IntersectionObserver', FakeObserver);
		const { result } = renderHook(() => useNearViewport(ref, { enabled: false }));
		expect(result.current).toBe(true);
		expect(observe).not.toHaveBeenCalled();
	});

	it('IntersectionObserver가 없는 브라우저는 바로 true', () => {
		vi.stubGlobal('IntersectionObserver', undefined);
		// 'in window'로 확인하므로 아예 없앤다
		delete (window as unknown as Record<string, unknown>).IntersectionObserver;
		const { result } = renderHook(() => useNearViewport(ref));
		expect(result.current).toBe(true);
	});
});
