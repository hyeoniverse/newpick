// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { compile } from 'tailwindcss';
import { describe, expect, it } from 'vitest';

/**
 * CSS 파일(styles 폴더 아래 .css)에서 쓰는 클래스 이름이 Tailwind 유틸리티 이름과 겹치지 않는지 본다 (#10).
 * 겹치면 Tailwind가 그 이름으로 스타일을 만들어 엉뚱한 효과가 붙는다.
 * 예: 떠 있는 북마크 단추의 'blur' → filter: blur(8px)로 흐릿, 약관 표 상자의 'table' → display: table로 가로 스크롤이 막힘
 */

const SRC = resolve(__dirname, '..');
const require = createRequire(import.meta.url);

// Tailwind와 뜻이 같아 일부러 같은 이름을 쓰는 것
const ALLOWED = new Set(['sr-only']);

/** styles/ 아래 CSS 파일 (토큰 파일 제외) */
function cssFiles(dir: string): string[] {
	return readdirSync(dir).flatMap((name) => {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) return cssFiles(path);
		return name.endsWith('.css') && name !== 'tokens.css' ? [path] : [];
	});
}

/** CSS 선택자에 쓴 클래스 이름 (.name). 주석 · 0.5rem 같은 숫자는 뺀다 */
function selectorTokens(css: string): string[] {
	const code = css.replace(/\/\*[\s\S]*?\*\//g, '');
	return [...code.matchAll(/(?<![\w$.\-)\]])\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]);
}

async function tailwind() {
	const entry = join(SRC, 'app/global.css');
	return compile(readFileSync(entry, 'utf8'), {
		base: dirname(entry),
		async loadStylesheet(id: string, base: string) {
			const path = id.startsWith('.') ? resolve(base, id) : require.resolve(id, { paths: [base] });
			return { path, base: dirname(path), content: readFileSync(path, 'utf8') };
		},
	});
}

describe('Tailwind 유틸리티와 겹치는 클래스 이름', () => {
	it('CSS 파일에서 쓰는 클래스 이름은 Tailwind가 스타일을 만들지 않는다', async () => {
		const tokens = new Map<string, string>();
		for (const file of cssFiles(SRC)) {
			for (const t of selectorTokens(readFileSync(file, 'utf8'))) {
				if (/^[a-z][\w-]*$/.test(t) && !ALLOWED.has(t) && !tokens.has(t)) tokens.set(t, file.slice(SRC.length + 1));
			}
		}
		expect(tokens.size).toBeGreaterThan(100);

		const tw = await tailwind();
		let size = tw.build([]).length;
		const hits: string[] = [];
		for (const [t, file] of tokens) {
			const next = tw.build([t]).length;
			if (next > size) hits.push(`${t} (${file})`);
			size = next;
		}
		expect(hits).toEqual([]);
	});
});
