#!/usr/bin/env node
/**
 * 화면 전 · 후 비교 (#229): npm run visual:diff -- <전 이름> <후 이름>
 * 같은 파일 이름끼리 픽셀을 비교해 차이 비율을 표로 보이고, 다른 것은 전 · 후를 나란히 붙인 사진을
 * apps/web/.visual/diff-<전>-<후>/ 에 남긴다. 차이가 있으면 종료 코드 1 (높이가 달라도 차이로 친다).
 * --tolerance <퍼센트> (기본 0.01): 이보다 작은 차이는 글자 가장자리 같은 잡음으로 보고 '≈'로만 표시한다
 */
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '.visual');
const argv = process.argv.slice(2);
const ti = argv.indexOf('--tolerance');
const tolerance = ti >= 0 ? Number(argv[ti + 1]) : 0.01;
const [a, b] = argv.filter((x, i) => !x.startsWith('--') && argv[i - 1] !== '--tolerance');
if (!a || !b) {
	console.error('사용법: npm run visual:diff -- <전 이름> <후 이름>');
	process.exit(1);
}
const A = join(root, a),
	B = join(root, b),
	OUT = join(root, `diff-${a}-${b}`);
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const files = readdirSync(A).filter((f) => f.endsWith('.png'));

const browser = await chromium.launch();
const page = await browser.newPage();
const rows = [];
for (const f of files) {
	if (!existsSync(join(B, f))) {
		rows.push({ f, note: '후 사진 없음' });
		continue;
	}
	const [sa, sb] = [readFileSync(join(A, f)).toString('base64'), readFileSync(join(B, f)).toString('base64')];
	const r = await page.evaluate(
		async ([sa, sb]) => {
			const load = (s) =>
				new Promise((ok) => {
					const i = new Image();
					i.onload = () => ok(i);
					i.src = `data:image/png;base64,${s}`;
				});
			const [ia, ib] = await Promise.all([load(sa), load(sb)]);
			const w = Math.max(ia.width, ib.width),
				h = Math.max(ia.height, ib.height);
			const draw = (img) => {
				const c = document.createElement('canvas');
				c.width = w;
				c.height = h;
				const x = c.getContext('2d');
				x.fillStyle = '#ff00ff';
				x.fillRect(0, 0, w, h);
				x.drawImage(img, 0, 0);
				return x.getImageData(0, 0, w, h).data;
			};
			const da = draw(ia),
				db = draw(ib);
			let diff = 0,
				top = h,
				bottom = 0;
			for (let i = 0; i < da.length; i += 4) {
				if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) > 30) {
					diff++;
					const y = Math.floor(i / 4 / w);
					if (y < top) top = y;
					if (y > bottom) bottom = y;
				}
			}
			let joined = null;
			if (diff) {
				const c = document.createElement('canvas');
				c.width = ia.width + ib.width + 12;
				c.height = Math.max(ia.height, ib.height);
				const x = c.getContext('2d');
				x.fillStyle = '#888';
				x.fillRect(0, 0, c.width, c.height);
				x.drawImage(ia, 0, 0);
				x.drawImage(ib, ia.width + 12, 0);
				joined = c.toDataURL('image/png').split(',')[1];
			}
			return {
				diff,
				pct: (diff / (w * h)) * 100,
				top,
				bottom,
				size: `${ia.width}x${ia.height} → ${ib.width}x${ib.height}`,
				joined,
			};
		},
		[sa, sb],
	);
	if (r.joined) await import('node:fs').then((fs) => fs.writeFileSync(join(OUT, f), Buffer.from(r.joined, 'base64')));
	rows.push({ f, ...r });
}
await browser.close();

const noisy = (r) => !r.note && r.diff && r.pct < tolerance && r.size.split(' → ')[0] === r.size.split(' → ')[1];
const changed = rows.filter((r) => r.note || (r.diff && !noisy(r)));
for (const r of rows.sort((x, y) => (y.diff ?? 1e9) - (x.diff ?? 1e9)))
	console.log(
		r.note
			? `!  ${r.f}  ${r.note}`
			: `${!r.diff ? '=' : noisy(r) ? '≈' : '≠'}  ${r.f}  ${r.pct.toFixed(3)}%${r.diff ? `  (세로 ${r.top}~${r.bottom}px, ${r.size})` : ''}`,
	);
console.log(
	`\n${rows.length}장 중 ${changed.length}장 다름 (잡음 ≈ ${rows.filter(noisy).length}장, 기준 ${tolerance}%)${changed.length ? ` → 나란히 붙인 사진: ${OUT}` : ''}`,
);
process.exit(changed.length ? 1 : 0);
