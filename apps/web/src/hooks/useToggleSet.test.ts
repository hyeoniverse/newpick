import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useToggleSet } from './useToggleSet';

const items = (set: Set<number>) => [...set].sort((a, b) => a - b);

describe('useToggleSet', () => {
	it('toggle: 없으면 넣고 있으면 뺀다', () => {
		const { result } = renderHook(() => useToggleSet<number>());
		act(() => result.current.toggle(1));
		act(() => result.current.toggle(2));
		expect(items(result.current.set)).toEqual([1, 2]);
		act(() => result.current.toggle(1));
		expect(items(result.current.set)).toEqual([2]);
	});

	it('add는 이미 있으면 그대로 · setMany로 한꺼번에 넣고 빼기 · clear', () => {
		const { result } = renderHook(() => useToggleSet<number>());
		act(() => result.current.add(3));
		const before = result.current.set;
		act(() => result.current.add(3));
		expect(result.current.set).toBe(before);

		act(() => result.current.setMany([1, 2, 3, 4], true));
		expect(items(result.current.set)).toEqual([1, 2, 3, 4]);
		act(() => result.current.setMany([2, 4], false));
		expect(items(result.current.set)).toEqual([1, 3]);
		act(() => result.current.clear());
		expect(result.current.set.size).toBe(0);
	});

	it('바뀔 때마다 새 Set (화면이 다시 그려지게)', () => {
		const { result } = renderHook(() => useToggleSet<number>());
		const first = result.current.set;
		act(() => result.current.toggle(1));
		expect(result.current.set).not.toBe(first);
	});
});
