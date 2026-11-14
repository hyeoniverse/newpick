import { createElement, type ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { uniqueItems, useBidirectionalPages } from './useBidirectionalPages';

/** 0~(total-1) 순번을 그대로 돌려주는 가짜 서버 */
const server = (total: number) =>
	vi.fn(async (offset: number, limit: number) => ({
		items: Array.from({ length: Math.max(0, Math.min(limit, total - offset)) }, (_, i) => offset + i),
		total,
	}));

function setup(fetchPage: ReturnType<typeof server>, startOffset: number) {
	const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children);
	return renderHook(
		() => useBidirectionalPages({ queryKey: ['t', startOffset], fetchPage, pageSize: 10, startOffset }),
		{
			wrapper,
		},
	);
}

describe('useBidirectionalPages', () => {
	it('startOffset부터 받고, 아래로 다음 묶음 · 끝이면 더 없음', async () => {
		const fetchPage = server(25);
		const { result } = setup(fetchPage, 0);
		await waitFor(() => expect(result.current.data?.pages).toHaveLength(1));
		expect(fetchPage).toHaveBeenLastCalledWith(0, 10);
		expect(result.current.hasPreviousPage).toBe(false);

		await act(() => result.current.fetchNextPage());
		await act(() => result.current.fetchNextPage());
		expect(fetchPage).toHaveBeenLastCalledWith(20, 10);
		await waitFor(() => expect(result.current.hasNextPage).toBe(false));
		expect(result.current.data?.pages.flatMap((p) => p.items)).toHaveLength(25);
	});

	it('달로 건너뛰면(startOffset 15) 위로는 앞 묶음 5부터, 그다음 0부터', async () => {
		const fetchPage = server(40);
		const { result } = setup(fetchPage, 15);
		await waitFor(() => expect(result.current.data?.pages).toHaveLength(1));
		expect(result.current.hasPreviousPage).toBe(true);

		await act(() => result.current.fetchPreviousPage());
		expect(fetchPage).toHaveBeenLastCalledWith(5, 10);
		await act(() => result.current.fetchPreviousPage());
		expect(fetchPage).toHaveBeenLastCalledWith(0, 10);
		await waitFor(() => expect(result.current.hasPreviousPage).toBe(false));
		expect(result.current.data?.pages.map((p) => p.offset)).toEqual([0, 5, 15]);
	});
});

describe('uniqueItems', () => {
	it('묶음 끝이 겹치면 한 번만, 순서는 그대로', () => {
		const pages = [{ items: [0, 1, 2, 3] }, { items: [3, 4, 5] }];
		expect(uniqueItems(pages, (n) => n)).toEqual([0, 1, 2, 3, 4, 5]);
		expect(uniqueItems(undefined, (n: number) => n)).toEqual([]);
	});
});
