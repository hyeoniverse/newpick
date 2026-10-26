import { defineConfig, devices } from '@playwright/test';
import { E2E } from './e2e/support/env.mjs';

const CI = !!process.env.CI;

/**
 * E2E는 실제 api(docker compose: api + MySQL + MongoDB)에 붙습니다. 실행 순서:
 *   1. apps/api: docker compose up -d (JWT_SECRET = E2E_JWT_SECRET)
 *   2. apps/web: npm run e2e:seed → npm run build → npm run e2e
 */
export default defineConfig({
	testDir: 'e2e',
	globalSetup: './e2e/global-setup.ts',
	// 테스트 사용자 하나를 함께 쓰므로 순서대로 실행한다
	workers: 1,
	fullyParallel: false,
	retries: CI ? 1 : 0,
	reporter: CI ? [['github'], ['html', { open: 'never' }]] : 'list',
	use: {
		baseURL: E2E.webUrl,
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
	},
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
		// Safari 엔진에서만 생기던 문제(#28)와 기본 탐색만 WebKit으로 한 번 더
		{ name: 'webkit', use: { ...devices['Desktop Safari'] }, testMatch: /(public|trial)\.spec\.ts/ },
	],
	webServer: {
		command: `npm run start -- -p ${new URL(E2E.webUrl).port}`,
		url: E2E.webUrl,
		reuseExistingServer: !CI,
		env: { API_URL: E2E.apiUrl },
	},
});
