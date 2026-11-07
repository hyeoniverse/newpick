import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cssVarTheme, darkTheme, lightTheme, tokensCss } from '@/styles/theme';

const file = join(__dirname, 'tokens.css');

describe('styles/tokens.css', () => {
	it('theme.ts에서 만든 내용과 같다 (어긋나면 npm run tokens)', () => {
		if (process.env.UPDATE_TOKENS) writeFileSync(file, tokensCss());
		expect(readFileSync(file, 'utf8')).toBe(tokensCss());
	});

	it('컴포넌트가 쓰는 테마 값(var(--np-…))은 모두 파일에 선언돼 있다', () => {
		const css = readFileSync(file, 'utf8');
		const refs = JSON.stringify(cssVarTheme).match(/var\(--np-[a-z0-9-]+\)/g) ?? [];
		const missing = [...new Set(refs)].map((r) => r.slice(4, -1)).filter((name) => !css.includes(`${name}:`));
		expect(missing).toEqual([]);
	});

	it('다크 색은 다크 블록에만, 라이트 색과 다르다', () => {
		const css = readFileSync(file, 'utf8');
		expect(css).toContain(`--np-color-primary: ${lightTheme.color.primary};`);
		expect(css).toContain(`--np-color-primary: ${darkTheme.color.primary};`);
	});
});
