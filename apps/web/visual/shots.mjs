#!/usr/bin/env node
/**
 * 화면 사진 찍기 (#229): npm run visual:shots -- <이름> [--modes desk-light,mobile] [--only /admin]
 * 사진은 apps/web/.visual/<이름>/ 에 쌓인다 (git에 올리지 않음). 전 · 후를 각각 찍고 visual:diff로 비교한다.
 *
 * - 대상 웹: VISUAL_BASE_URL (기본 http://localhost:3000). dev 서버를 켜 둔 채로 쓴다
 * - 로그인: apps/api/.env의 JWT_SECRET으로 시험용 토큰을 만든다 (로컬 전용). 사용자 id는 VISUAL_USER_ID (기본 1)
 *   관리자 · 마이페이지를 찍으려면 그 사용자가 관리자여야 한다
 */
import { chromium } from '@playwright/test';
import { createHmac } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MODES, OPEN_STATES, PAGES } from './targets.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const label = args.find((a) => !a.startsWith('--'));
const flag = (name) => {
	const i = args.indexOf(`--${name}`);
	return i >= 0 ? args[i + 1] : undefined;
};
if (!label) {
	console.error('사용법: npm run visual:shots -- <이름> [--modes desk-light,desk-dark,mobile] [--only <경로 일부>]');
	process.exit(1);
}
const BASE = process.env.VISUAL_BASE_URL ?? 'http://localhost:3000';
const USER_ID = Number(process.env.VISUAL_USER_ID ?? 1);
const modes = (flag('modes') ?? Object.keys(MODES).join(',')).split(',');
const only = flag('only');
const out = join(here, '..', '.visual', label);
mkdirSync(out, { recursive: true });

function jwtSecret() {
	if (process.env.VISUAL_JWT_SECRET) return process.env.VISUAL_JWT_SECRET;
	const env = join(here, '..', '..', 'api', '.env');
	if (!existsSync(env)) return null;
	const m = readFileSync(env, 'utf8').match(/^JWT_SECRET=(.*)$/m);
	return m ? m[1].trim().replace(/^"|"$/g, '') : null;
}
function token(secret) {
	const b64 = (v) => Buffer.from(v).toString('base64url');
	const now = Math.floor(Date.now() / 1000);
	const h = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
	const p = b64(JSON.stringify({ sub: USER_ID, iat: now, exp: now + 3 * 3600 }));
	return `${h}.${p}.${createHmac('sha256', secret).update(`${h}.${p}`).digest('base64url')}`;
}
const secret = jwtSecret();
if (!secret) console.warn('JWT_SECRET을 찾지 못해 로그인 없이 찍습니다 (관리자 · 마이페이지는 로그인 화면으로 찍힘)');

const fileName = (mode, path, state) => `${mode}__${path.replace(/[^a-z0-9]+/gi, '_')}${state ? `__${state}` : ''}.png`;

/** 찍을 때마다 달라지는 것을 멈춘다: 애니메이션 · 차트 캔버스 · 개발 도구 표시 · 형광펜 팝업 */
async function settle(page) {
	await page.waitForTimeout(1200);
	await page.evaluate(() => {
		document.querySelector('nextjs-portal')?.remove();
		document.documentElement.style.scrollBehavior = 'auto';
		for (const e of document.querySelectorAll('[data-highlight-popover], canvas')) e.remove();
		// 자동으로 넘어가는 슬라이더(Swiper)는 멈추고 첫 자리로
		for (const el of document.querySelectorAll('.swiper')) {
			const swiper = el.swiper;
			swiper?.autoplay?.stop();
			swiper?.slideTo?.(0, 0);
		}
		const style = document.createElement('style');
		style.textContent =
			'*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }';
		document.head.appendChild(style);
	});
	await page.waitForTimeout(300);
}

const browser = await chromium.launch();
let count = 0;
const failed = [];
for (const mode of modes) {
	const { width, theme } = MODES[mode];
	for (const auth of [true, false]) {
		const jobs = [
			...(auth ? PAGES.map((path) => ({ path })) : []),
			...OPEN_STATES.filter((s) => (s.auth ?? true) === auth && s.modes.includes(mode)),
		].filter((j) => !only || j.path.includes(only));
		if (!jobs.length) continue;
		const ctx = await browser.newContext({
			viewport: { width, height: 900 },
			deviceScaleFactor: 1,
			reducedMotion: 'reduce',
		});
		if (auth && secret)
			await ctx.addCookies([
				{ name: 'access_token', value: token(secret), url: BASE, httpOnly: true },
				{ name: 'logged_in', value: '1', url: BASE },
			]);
		// 찍는 동안 조회수 · 방문 기록을 남기지 않는다 (남기면 다음 찍을 때 숫자가 달라져 차이로 잡힌다)
		await ctx.route(/\/newsletters\/viewcount\/|\/analytics\/collect/, (route) =>
			route.fulfill({ status: 200, contentType: 'application/json', body: '{"data":0}' }),
		);
		await ctx.addInitScript((t) => {
			try {
				localStorage.setItem('newpick_theme', t);
			} catch {}
			document.documentElement.dataset.theme = t;
		}, theme);
		const page = await ctx.newPage();
		for (const job of jobs) {
			const name = fileName(mode, job.path, job.name);
			try {
				await page.goto(`${BASE}${job.path}`, { waitUntil: 'networkidle', timeout: 90_000 });
				if (job.run) {
					await page.waitForTimeout(600);
					await job.run(page);
				}
				await settle(page);
				await page.screenshot({ path: join(out, name), fullPage: !job.run });
				count++;
			} catch (error) {
				// 하나가 실패해도 나머지는 찍는다. 빠진 사진은 diff에서 '사진 없음'으로 드러난다
				failed.push(`${name}: ${error.message.split('\n')[0]}`);
			}
		}
		await ctx.close();
	}
}
await browser.close();
console.log(`${count}장 → ${out}`);
for (const f of failed) console.error(`못 찍음 ${f}`);
if (failed.length) process.exitCode = 1;
