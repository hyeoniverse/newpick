import { test, expect } from './support/fixtures';
import { SEEDED_NEWSLETTERS } from './support/db.mjs';

// #54, #55: 체험하기는 Claude로 생성하지 않고, 고른 분야로 엮은 구독 메일을 실제 메일 HTML 그대로 보여 준다.
// (#28의 Safari 날짜 문제는 체험이 날짜를 보내지 않게 되면서 사라졌다)
test('체험하기는 생성 없이 고른 분야를 한 통으로 엮은 실제 메일을 보여 준다', async ({ page }) => {
	const summarize: string[] = [];
	page.on('request', (r) => {
		if (r.url().includes('/ai-summary/')) summarize.push(r.url());
	});

	await page.goto('/');
	await page.getByRole('button', { name: 'AI 뉴스레터 체험하기' }).first().click();
	const sheet = page.getByRole('dialog');

	// 기본은 IT. 경제를 더 고르면 두 분야가 한 통의 메일로
	await sheet.getByRole('button', { name: '경제', exact: true }).click();
	const mail = sheet.frameLocator('iframe[title="구독 메일 미리보기"]');
	await expect(mail.getByText('오늘 한눈에')).toBeVisible();
	await expect(mail.getByRole('heading', { name: SEEDED_NEWSLETTERS[0].title })).toBeVisible(); // 카테고리 1 = IT
	await expect(mail.getByRole('heading', { name: SEEDED_NEWSLETTERS[2].title })).toBeVisible(); // 카테고리 3 = 경제
	await expect(mail.getByRole('heading', { name: SEEDED_NEWSLETTERS[1].title })).toHaveCount(0); // 정치는 고르지 않음
	await expect(sheet.getByRole('heading', { name: /뉴픽 · / })).toBeVisible(); // 메일 제목
	await expect(sheet.getByRole('button', { name: '이 구성으로 구독하기 (2개 분야)' })).toBeEnabled();

	expect(summarize).toEqual([]);
});

test('로그인 없이 구독하기를 누르면 로그인 안내', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'AI 뉴스레터 체험하기' }).first().click();
	await page.getByRole('button', { name: /이 구성으로 구독하기/ }).click();

	await expect(page.getByText('로그인이 필요합니다.')).toBeVisible();
});
