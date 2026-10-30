// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * styled-components CSS의 중괄호 짝 검사.
 * 짝 없는 `}`가 하나라도 있으면 개발 모드에서는 멀쩡하다가 production 빌드에서만 뒤 규칙이 바깥 요소 전체에 붙어 화면이 깨진다
 * (관리자 하위 페이지가 회색 상자 · 보라 굵은 글자로 깨졌던 일)
 */
const SRC = join(__dirname, '..');

const sourceFiles = (dir: string): string[] =>
	readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) return entry.name === 'legacy' ? [] : sourceFiles(path);
		return /\.tsx?$/.test(entry.name) && !entry.name.endsWith('.test.ts') ? [path] : [];
	});

/** `${…}` 끼워 넣기를 건너뛰며 템플릿이 끝나는 위치 (`${…}` 안의 템플릿 · 괄호도 짝을 맞춘다) */
function skipInterpolation(text: string, from: number): number {
	let depth = 1;
	let i = from;
	while (i < text.length && depth > 0) {
		const ch = text[i];
		if (ch === '{') depth += 1;
		else if (ch === '}') depth -= 1;
		else if (ch === '`') i = templateEnd(text, i + 1);
		i += 1;
	}
	return i;
}

function templateEnd(text: string, from: number): number {
	let i = from;
	while (i < text.length && text[i] !== '`') {
		i = text.startsWith('${', i) ? skipInterpolation(text, i + 2) : i + 1;
	}
	return i;
}

/** 템플릿 안 CSS의 중괄호 짝이 틀린 곳: 짝 없는 `}`의 줄, 또는 안 닫힌 `{` */
function braceProblems(text: string, name: string): string[] {
	const problems: string[] = [];
	const start = /(?:styled(?:\.\w+|\([^)]*\))(?:\.attrs\([^`]*?\))?(?:<[^`>]*>)?|\bcss|createGlobalStyle|keyframes)`/g;
	for (const match of text.matchAll(start)) {
		const begin = match.index + match[0].length;
		let css = '';
		const end = templateEnd(text, begin);
		for (let i = begin; i < end; ) {
			if (text.startsWith('${', i)) {
				i = skipInterpolation(text, i + 2);
				css += 'X';
			} else css += text[i++];
		}
		css = css.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '));
		const line = text.slice(0, begin).split('\n').length;
		let depth = 0;
		[...css].forEach((ch, k) => {
			if (ch === '{') depth += 1;
			if (ch !== '}') return;
			depth -= 1;
			if (depth < 0) {
				problems.push(`${name}:${line + css.slice(0, k).split('\n').length - 1} 짝 없는 }`);
				depth = 0;
			}
		});
		if (depth > 0) problems.push(`${name}:${line} 안 닫힌 { ${depth}개`);
	}
	return problems;
}

describe('styled-components CSS 중괄호', () => {
	it('모든 파일에서 짝이 맞는다', () => {
		const problems = sourceFiles(SRC).flatMap((file) => braceProblems(readFileSync(file, 'utf8'), relative(SRC, file)));
		expect(problems).toEqual([]);
	});

	it('짝 없는 } · 안 닫힌 {를 찾아낸다 (끼워 넣기 ${…} 안의 괄호는 세지 않음)', () => {
		const extra = 'const A = styled.div`\n\t.a { color: ${({ theme }) => theme.x}; }\n\t}\n\t.b { width: 1rem; }\n`;';
		const open = 'const B = css`\n\t.a { .b { color: red; }\n`;';
		expect(braceProblems(extra, 'a.tsx')).toEqual(['a.tsx:3 짝 없는 }']);
		expect(braceProblems(open, 'b.tsx')).toEqual(['b.tsx:1 안 닫힌 { 1개']);
	});
});
