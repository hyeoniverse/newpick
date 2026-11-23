import { createElement, type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAdminList } from './AdminList';

const set = vi.fn();
let page = 3;
vi.mock('./period', () => ({ useAdminQuery: () => ({ from: '2026-11-01', to: '2026-11-23', page, set }) }));
vi.mock('./HeaderFilter', () => ({ useSortQuery: () => ({}) }));

function setup(total: number) {
	const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children);
	return renderHook(
		() => useAdminList({ queryKey: (q) => ['t', q], fetch: async () => ({ total, items: [] }), pageSize: 20 }),
		{ wrapper },
	);
}

beforeEach(() => {
	set.mockClear();
	page = 3;
});

describe('useAdminList: 쪽 맞추기 (#340)', () => {
	it('지금 쪽이 마지막 쪽보다 뒤면 마지막 쪽으로 (마지막 쪽의 마지막 줄을 지운 뒤)', async () => {
		const { result } = setup(25);
		await waitFor(() => expect(result.current.data).toBeDefined());
		expect(set).toHaveBeenCalledWith({ page: 2 });
	});

	it('하나도 없으면 1쪽으로', async () => {
		const { result } = setup(0);
		await waitFor(() => expect(result.current.data).toBeDefined());
		expect(set).toHaveBeenCalledWith({ page: 1 });
	});

	it('쪽 안에 줄이 있으면 그대로', async () => {
		const { result } = setup(45);
		await waitFor(() => expect(result.current.data).toBeDefined());
		expect(set).not.toHaveBeenCalled();
	});
});
