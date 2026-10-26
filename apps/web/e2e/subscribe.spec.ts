import { test, expect, userId } from './support/fixtures';
import { authHeaders, logIn } from './support/auth';
import { E2E } from './support/env.mjs';
import { resetUser } from './support/db.mjs';

test.beforeEach(async ({ context }) => {
	// 구독 상태가 남아 있으면 '처음 구독'이 아니게 되므로 사용자를 새로 만들어 로그인한다
	process.env.E2E_USER_ID = String(await resetUser());
	await logIn(context, userId());
});

test('홈의 빠른 구독: 관심사를 고르고 약관에 동의하면 구독이 시작된다', async ({ page, request }) => {
	await page.goto('/');
	const form = page.locator('.subscription-form');
	await form.scrollIntoViewIfNeeded();

	// 카드 순서: 전체, IT, 정치, … → IT를 고른다
	await page.getByRole('button', { name: 'Select' }).nth(1).click();
	await form.getByRole('checkbox').check({ force: true });
	await form.getByRole('button', { name: '구독 신청' }).click();

	await expect(page.getByText('구독 설정이 완료되었습니다')).toBeVisible();

	const status = await request.get(`${E2E.apiUrl}/subscribers/status`, { headers: authHeaders(userId()) });
	expect((await status.json()).status).toBe('active');
	const interests = await request.get(`${E2E.apiUrl}/mypage/interests`, { headers: authHeaders(userId()) });
	// 관심사는 카테고리 id로 저장된다 (IT = 1)
	expect(await interests.json()).toEqual(expect.arrayContaining([1]));
});
