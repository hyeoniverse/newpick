// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { compile } from 'tailwindcss';
import { describe, expect, it } from 'vitest';

/**
 * styled-components에서 쓰던 클래스 이름이 Tailwind 유틸리티 이름과 겹치지 않는지 본다 (#10 전환 중).
 * 겹치면 Tailwind가 그 이름으로 스타일을 만들어 엉뚱한 효과가 붙는다.
 * 예: 떠 있는 북마크 단추의 'blur' → filter: blur(8px)로 흐릿, 약관 표 상자의 'table' → display: table로 가로 스크롤이 막힘
 */

const SRC = resolve(__dirname, '..');
const require = createRequire(import.meta.url);

// Tailwind와 뜻이 같아 일부러 같은 이름을 쓰는 것
const ALLOWED = new Set(['sr-only']);

function files(dir: string): string[] {
	return readdirSync(dir).flatMap((name) => {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) return files(path);
		return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
	});
}

/** className={…} · className="…" 안의 문자열에 든 이름 */
function classNameTokens(code: string): string[] {
	const out: string[] = [];
	for (const m of code.matchAll(/className=/g)) {
		let i = m.index + 'className='.length;
		let expr: string;
		if (code[i] === '"') expr = code.slice(i, code.indexOf('"', i + 1) + 1);
		else if (code[i] === '{') {
			let depth = 0;
			const start = i;
			for (; i < code.length; i++) {
				if (code[i] === '{') depth++;
				else if (code[i] === '}' && --depth === 0) break;
			}
			expr = code.slice(start, i + 1);
		} else continue;
		for (const s of expr.matchAll(/(["'`])((?:(?!\1)[^\\]|\\.)*)\1/g)) {
			out.push(...s[2].replace(/\$\{[^}]*\}/g, ' ').split(/\s+/));
		}
	}
	return out;
}

/** styled`…` · css`…` 안에서 선택자로 쓴 이름 (.name, &.name) */
function selectorTokens(code: string): string[] {
	const out: string[] = [];
	for (const m of code.matchAll(/(?:styled(?:\.\w+|\([^)]*\))(?:\.attrs\([^`]*?\))?|css|keyframes|createGlobalStyle)`([^`]*)`/g)) {
		for (const s of m[1].matchAll(/(?<![\w$.\-)\]])\.([a-zA-Z][\w-]*)/g)) out.push(s[1]);
	}
	return out;
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
	it('styled-components를 쓰는 파일의 클래스 이름은 Tailwind가 스타일을 만들지 않는다', async () => {
		const tokens = new Map<string, string>();
		for (const file of files(SRC)) {
			const code = readFileSync(file, 'utf8');
			if (!code.includes("from 'styled-components'")) continue;
			for (const t of [...classNameTokens(code), ...selectorTokens(code)]) {
				if (/^[a-z][\w-]*$/.test(t) && !ALLOWED.has(t) && !tokens.has(t)) tokens.set(t, file.slice(SRC.length + 1));
			}
		}

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
