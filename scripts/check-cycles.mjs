#!/usr/bin/env node
/**
 * 순환 import 검사 (#229). 앱 폴더에서 `npm run cycles`로 돈다.
 * madge는 버전을 고정해 npx로 받는다 (앱 의존성에 넣으면 설치 배치가 바뀌어 웹 테스트의 jsdom을 못 찾게 된다).
 * 지금 있는 순환은 scripts/cycles-allow.json에 적어 두고(#199에서 없앤다), 그 밖의 순환이 새로 생기면 실패한다.
 * 허용 목록의 순환이 없어졌으면 목록에서 지우라고 알려 준다 (목록이 실제보다 느슨해지지 않게)
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = basename(process.cwd());
const allow = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'cycles-allow.json'), 'utf8'))[app] ?? [];
const extensions = app === 'web' ? 'ts,tsx' : 'ts';
// madge는 순환이 있으면 종료 코드 1로 끝난다. 결과(JSON)는 그때도 stdout에 있다
let out;
try {
	out = execFileSync(
		'npx',
		['-y', 'madge@8.0.0', '--circular', '--json', '--extensions', extensions, '--ts-config', 'tsconfig.json', 'src'],
		{ encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
	);
} catch (error) {
	if (!error.stdout) throw error;
	out = error.stdout;
}
const key = (cycle) => cycle.join(' > ');
const found = JSON.parse(out).map(key);
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
