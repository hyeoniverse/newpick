import { test as base, expect } from '@playwright/test';

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

export { expect };
