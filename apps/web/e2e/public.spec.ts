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

	test('지웠거나 없는 뉴스레터는 404와 안내 화면', async ({ page }) => {
		const response = await page.goto('/articles/detail/99999999');

		expect(response?.status()).toBe(404);
		await expect(page.getByRole('heading', { name: '삭제되었거나 없는 뉴스레터예요' })).toBeVisible();
		await page.getByRole('button', { name: '뉴스레터 둘러보기' }).click();
		await expect(page).toHaveURL(/\/articles$/);
	});

	test('뉴스레터 목록을 브라우저에서 불러온다', async ({ page }) => {
		await page.goto('/articles');

		await expect(page.getByText(first.title).first()).toBeVisible();
	});

	// #20: 검색어 + 관심사로 찾고, 주소에 남아 새로 고침해도 같은 결과
	test('뉴스레터 검색: 검색어와 관심사로 걸러 보고, 결과가 없으면 안내', async ({ page }) => {
		const third = SEEDED_NEWSLETTERS[2];
		await page.goto(`/articles?categoryId=${third.categoryId}`);
		await page.getByRole('searchbox', { name: '뉴스레터 검색어' }).fill('카테고리');
		await page.keyboard.press('Enter');

		await expect(page).toHaveURL(/q=/);
		await expect(page.getByRole('heading', { name: '‘카테고리’ 검색 결과' })).toBeVisible();
		await expect(page.getByText(third.title).first()).toBeVisible();
		await expect(page.getByText(first.title)).toHaveCount(0);

		await page.reload();
		await expect(page.getByText(third.title).first()).toBeVisible();

		await page.getByRole('searchbox', { name: '뉴스레터 검색어' }).fill('없는검색어입니다');
		await page.keyboard.press('Enter');
		await expect(page.getByText('찾는 뉴스레터가 없어요')).toBeVisible();
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

	test('로그인하지 않고 마이페이지에 가면 홈에서 로그인 창을 띄운다', async ({ page }) => {
		await page.goto('/mypage');

		// 서버는 /?login=required로 보내고, 화면이 그 값을 읽어 로그인 창을 연 뒤 주소에서 지운다.
		// 지우는 시점이 화면이 뜨는 속도에 따라 달라서, 주소의 ?login= 대신 결과(홈 + 로그인 창)를 본다
		await expect(page).toHaveURL(/\/(\?login=required)?$/);
		await expect(page.getByText('로그인이 필요한 화면이에요')).toBeVisible();
		await expect(page).toHaveURL(/\/$/);
	});
});
