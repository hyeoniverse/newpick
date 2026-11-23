import { test, expect } from './support/fixtures';

// #33: 목록을 더 불러오다 실패하면 화면 끝에 닿을 때마다 다시 요청해, 6초에 253번 요청했다
// #340: 첫 묶음부터 실패하면 알림만 뜨고 빈 칸이 남아, 목록 자리에 안내와 '다시 시도'를 둔다
test('목록 첫 불러오기가 실패하면 목록 자리에 안내하고, 스스로 다시 요청하지 않는다', async ({ page }) => {
	let requests = 0;
	// 목록은 검색 API로 불러온다 (#20)
	await page.route(/\/api\/newsletters\/search(\?|$)/, (route) => {
		requests += 1;
		return route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"e2e"}' });
	});

	await page.goto('/articles');
	await expect(page.getByRole('heading', { name: '일시적인 오류가 발생했습니다' })).toBeVisible();

	for (let i = 0; i < 5; i += 1) {
		await page.mouse.wheel(0, 3000);
		await page.waitForTimeout(300);
		await page.mouse.wheel(0, -500);
		await page.waitForTimeout(300);
	}
	expect(requests).toBe(1);

	// '다시 시도'를 눌렀을 때만 한 번 더
	await page.getByRole('button', { name: '다시 시도' }).click();
	await expect.poll(() => requests).toBe(2);
});
