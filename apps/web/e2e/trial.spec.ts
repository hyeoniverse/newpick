import { test, expect } from './support/fixtures';

// #28: 로캘 날짜 문자열을 다시 파싱해서 Safari(WebKit)에서는 "Invalid Date"가 전송되고 api가 400을 돌려줬다.
// chromium과 webkit 두 프로젝트에서 모두 실행된다.
test('무료 체험은 브라우저와 관계없이 YYYY-MM-DD 날짜로 요청한다', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'AI 뉴스레터 체험하기' }).first().click();

	const [request] = await Promise.all([
		page.waitForRequest((r) => r.url().endsWith('/api/ai-summary/summarize')),
		page.getByRole('button', { name: '생성하기' }).click(),
	]);
	const body = request.postDataJSON();
	const response = await request.response();

	expect(body.dateStart).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	expect(body.dateEnd).toBe(body.dateStart);
	// 테스트 환경에는 크롤링 원문이 없어 404가 정상. 400(날짜 검증 실패)만 아니면 된다
	expect(response?.status()).not.toBe(400);
});
