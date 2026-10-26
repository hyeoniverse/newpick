import { test, expect } from './support/fixtures';

// #33: 목록을 더 불러오다 실패하면 화면 끝에 닿을 때마다 다시 요청해, 6초에 253번 요청했다
test('목록 불러오기가 실패하면 한 번 알리고 다시 요청하지 않는다', async ({ page }) => {
	let requests = 0;
	await page.route(/\/api\/newsletters(\?|$)/, (route) => {
		requests += 1;
		return route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"e2e"}' });
	});

	await page.goto('/articles');
	await expect(page.getByText('뉴스레터를 더 불러오지 못했습니다.')).toBeVisible();

	for (let i = 0; i < 5; i += 1) {
		await page.mouse.wheel(0, 3000);
		await page.waitForTimeout(300);
		await page.mouse.wheel(0, -500);
		await page.waitForTimeout(300);
	}

	expect(requests).toBe(1);
});
