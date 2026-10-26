import { test, expect, userId } from './support/fixtures';
import { authHeaders, logIn } from './support/auth';
import { E2E } from './support/env.mjs';
import { SEEDED_NEWSLETTERS, newsletterIdByTitle } from './support/db.mjs';

test.beforeEach(async ({ context }) => {
	await logIn(context, userId());
});

test.describe('로그인 후', () => {
	// #29: 정적 HTML이라도 첫 화면부터 로그인 상태로 그린다 (로그인 버튼이 보였다 사라지지 않음)
	test('헤더에 로그인 버튼 대신 프로필이 보인다', async ({ page }) => {
		await page.goto('/');

		await expect(page.locator('html')).toHaveAttribute('data-auth', 'in');
		await expect(page.locator('.auth')).toBeVisible();
		await expect(page.getByRole('button', { name: '로그인' })).toBeHidden();
	});

	test('마이페이지에 들어갈 수 있다', async ({ page }) => {
		await page.goto('/mypage');

		await expect(page).toHaveURL(/\/mypage$/);
		// 헤더 드롭다운에도 '마이페이지' 메뉴가 숨어 있으므로, 화면에 보이는 프로필로 확인한다
		await expect(page.getByText(E2E.userEmail)).toBeVisible();
	});

	test('기사 상세에서 북마크를 추가하고 해제한다', async ({ page, request }) => {
		const title = SEEDED_NEWSLETTERS[1].title;
		const id = await newsletterIdByTitle(title);
		const bookmarkedIds = async () => {
			const res = await request.get(`${E2E.apiUrl}/mypage/bookmarks`, { headers: authHeaders(userId()) });
			if (res.status() === 404) return []; // 북마크가 없으면 404 (#17에서 빈 목록으로 바꿀 예정)
			const body = await res.json();
			return (body.data ?? body).map((b: { id: number }) => b.id);
		};

		await page.goto(`/articles/detail/${id}`);
		await expect(page.getByRole('heading', { name: title })).toBeVisible();
		const button = page.getByRole('button', { name: '북마크', exact: true }).first();

		await button.click();
		await expect(page.getByRole('button', { name: '북마크 해제' }).first()).toHaveAttribute('aria-pressed', 'true');
		await expect.poll(bookmarkedIds).toContain(id);

		await page.getByRole('button', { name: '북마크 해제' }).first().click();
		await expect.poll(bookmarkedIds).not.toContain(id);
	});
});
