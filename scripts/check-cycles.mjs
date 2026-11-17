#!/usr/bin/env node
/**
 * 순환 import 검사 (#229). 앱 폴더에서 `npm run cycles`로 돈다.
 * madge는 버전을 고정해 npx로 받는다 (앱 의존성에 넣으면 설치 배치가 바뀌어 웹 테스트의 jsdom을 못 찾게 된다).
 * 지금 있는 순환은 scripts/cycles-allow.json에 적어 두고(#199에서 없앤다), 그 밖의 순환이 새로 생기면 실패한다.
 * 허용 목록의 순환이 없어졌으면 목록에서 지우라고 알려 준다 (목록이 실제보다 느슨해지지 않게).
 * api는 모듈(src/ 바로 아래 폴더)끼리 서로 import하는지도 본다 (#199)
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = basename(process.cwd());
const allow = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'cycles-allow.json'), 'utf8'))[app] ?? [];
const extensions = app === 'web' ? 'ts,tsx' : 'ts';
// madge는 순환이 있으면 종료 코드 1로 끝난다. 결과(JSON)는 그때도 stdout에 있다
const madge = (...flags) => {
	try {
		return JSON.parse(
			execFileSync(
				'npx',
				['-y', 'madge@8.0.0', ...flags, '--json', '--extensions', extensions, '--ts-config', 'tsconfig.json', 'src'],
				{ encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
			),
		);
	} catch (error) {
		if (!error.stdout) throw error;
		return JSON.parse(error.stdout);
	}
};
const key = (cycle) => cycle.join(' > ');
const found = madge('--circular').map(key);
const allowed = new Set(allow.map(key));
const added = found.filter((c) => !allowed.has(c));
const gone = [...allowed].filter((c) => !found.includes(c));

for (const c of gone) console.log(`없어진 순환 (cycles-allow.json에서 지우세요): ${c}`);
if (added.length) {
	for (const c of added) console.error(`새 순환 import: ${c}`);
	console.error(`\n${app}: 순환 import ${added.length}개. 모듈 사이 방향을 한쪽으로 정리하세요.`);
	process.exit(1);
}
console.log(`${app}: 새 순환 import 없음 (허용 목록 ${allowed.size}개)`);

/**
 * api 모듈 단위 (#199): src/ 바로 아래 폴더를 모듈로 보고, 두 모듈이 서로를 import하면 실패한다.
 * 파일 순환이 없어도 a/x → b/y, b/z → a/w처럼 모듈끼리 물리면 한쪽만 떼어 보거나 바꾸기 어렵다.
 * 테스트 파일은 여러 모듈을 엮어 보므로 뺀다. src/ 맨 위 파일(main · app.module · contracts 등)은 모듈이 아니라 조립하는 자리라 뺀다
 */
if (app === 'api') {
	const isTest = (file) => /\.spec\.ts$|(^|\/)__tests__\//.test(file);
	const moduleOf = (file) => (file.includes('/') ? file.split('/')[0] : null);
	const uses = new Map();
	for (const [file, deps] of Object.entries(madge())) {
		const from = moduleOf(file);
		if (!from || isTest(file)) continue;
		for (const dep of deps) {
			const to = moduleOf(dep);
			if (!to || to === from || dep.startsWith('..') || isTest(dep)) continue;
			if (!uses.has(from)) uses.set(from, new Map());
			if (!uses.get(from).has(to)) uses.get(from).set(to, `${file} → ${dep}`);
		}
	}
	const pairs = [];
	for (const [a, targets] of uses) {
		for (const [b, example] of targets) {
			if (a < b && uses.get(b)?.has(a)) pairs.push(`${a} ↔ ${b}\n    ${example}\n    ${uses.get(b).get(a)}`);
		}
	}
	if (pairs.length) {
		for (const p of pairs) console.error(`서로 import하는 모듈: ${p}`);
		console.error(`\napi: 서로 import하는 모듈 ${pairs.length}쌍. 같이 쓰는 것을 한쪽(또는 아래 모듈)으로 옮기세요.`);
		process.exit(1);
	}
	console.log('api: 서로 import하는 모듈 없음');
}
