import { test, expect } from './support/fixtures';
import { SEEDED_NEWSLETTERS, newsletterIdByTitle, viewCount } from './support/db.mjs';

const first = SEEDED_NEWSLETTERS[0];

test.describe('비로그인 탐색', () => {
	test('홈: 로그인 버튼과 오늘의 트렌드', async ({ page }) => {
		await page.goto('/');

		await expect(page.getByRole('button', { name: '로그인' })).toBeVisible();
		await expect(page.getByText(first.title).first()).toBeVisible();
	});

	test('로그인을 누르면 구글로 넘어가기 전에 약관 안내를 보여 준다 (#66)', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('button', { name: '로그인' }).click();

		const sheet = page.getByRole('dialog');
		await expect(sheet.getByRole('heading', { name: '뉴픽 로그인' })).toBeVisible();
		await expect(sheet.getByRole('button', { name: '구글로 계속하기' })).toBeVisible();
		await expect(sheet.getByRole('link', { name: '이용약관' })).toHaveAttribute('href', '/terms');
		await expect(sheet.getByRole('link', { name: '개인정보 처리방침' })).toHaveAttribute('href', '/privacy');
		await expect(sheet.getByRole('link', { name: '이용약관' })).toHaveAttribute('target', '_blank');
	});

	test('뉴스레터 목록을 브라우저에서 불러온다', async ({ page }) => {
		await page.goto('/articles');

		await expect(page.getByText(first.title).first()).toBeVisible();
	});

	// #32: 서버 렌더링 중에 조회수를 올리면 봇·서버 요청에도 늘고, 실패하면 페이지가 500이었다
	test('기사 상세: 서버 요청으로는 조회수가 오르지 않고, 브라우저에서 열면 1 오른다', async ({ page, request }) => {
		const id = await newsletterIdByTitle(first.title);
		const before = await viewCount(id);

		const serverOnly = await request.get(`/articles/detail/${id}`);
		expect(serverOnly.status()).toBe(200);
		expect(await viewCount(id)).toBe(before);

		await page.goto(`/articles/detail/${id}`);
		await expect(page.getByRole('heading', { name: first.title })).toBeVisible();
		await expect.poll(() => viewCount(id)).toBe(before + 1);
	});

	test('로그인하지 않고 마이페이지에 가면 홈으로 보낸다', async ({ page }) => {
		await page.goto('/mypage');

		await expect(page).toHaveURL(/\/\?login=required$/);
	});
});
