import { test as base, expect, type Page } from '@playwright/test';

/** global-setup이 만든 테스트 사용자 id */
export const userId = () => Number(process.env.E2E_USER_ID);

export const test = base.extend<{ pageErrors: Error[] }>({
	// 처리되지 않은 오류가 나면 테스트를 실패시킨다
	pageErrors: [
		async ({ page }, use) => {
			const errors: Error[] = [];
			page.on('pageerror', (error) => errors.push(error));
			await use(errors);
			expect(errors.map((e) => e.message)).toEqual([]);
		},
		{ auto: true },
	],
});

/**
 * 화면이 다 붙을(하이드레이션) 때까지 기다린다. 그 전에 누른 단추 · Enter는 React가 놓칠 수 있다.
 * networkidle은 쓰지 않는다: Next 링크 미리 받기가 Chrome에서 30초 가까이 열려 있어 새로 고침마다 30초를 날리고, CI에서는 그래도 빠듯했다
 */
export async function waitForHydration(page: Page) {
	await page.locator('html[data-hydrated]').waitFor({ state: 'attached' });
}

/** 헤더 검색 칸이 붙을 때까지 (Suspense 안이라 페이지보다 늦게 붙을 수 있다) */
export async function waitForSearch(page: Page) {
	await page.locator('form#header-search[data-ready]').waitFor({ state: 'attached' });
}

export { expect };
