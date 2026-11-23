import { createElement, type ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { queryKeys } from '@/api/queryKeys';
import { useMarkMail } from '@/hooks/useMails';
import * as mailsApi from '@/api/mails';

vi.mock('@/hooks/useToast', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('@/api/mails', async (original) => ({ ...(await original<typeof mailsApi>()), markMail: vi.fn() }));

const page = (starred: boolean) => ({
	pages: [{ items: [{ sentAt: 's1', starred }], total: 1, counts: { all: 1, starred: 0, unfiled: 1 }, offset: 0 }],
	pageParams: [0],
});

describe('useMarkMail', () => {
	it('중요 표시는 응답 전에 화면 값부터 바꾼다 (#340: 두 번 누르면 같은 값을 또 보내 꺼지지 않았다)', async () => {
		// 응답이 오지 않은 상태로 둔다
		vi.mocked(mailsApi.markMail).mockReturnValue(new Promise(() => {}));
		const client = new QueryClient();
		const key = queryKeys.mails.page(1, '', 0);
		client.setQueryData(key, page(false));
		const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children);
		const { result } = renderHook(() => useMarkMail(), { wrapper });

		await act(async () => {
			result.current.mutate({ sentAt: 's1', starred: true });
		});

		expect(client.getQueryData<ReturnType<typeof page>>(key)?.pages[0].items[0].starred).toBe(true);
	});
});
