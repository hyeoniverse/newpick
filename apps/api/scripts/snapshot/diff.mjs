#!/usr/bin/env node
/**
 * API 응답 전 · 후 비교 (#229): npm run snap:diff -- <전 이름> <후 이름>
 * 상태 코드와 응답 본문을 비교한다. 순서까지 본다 (목록 순서가 바뀌면 화면 순서도 바뀐다).
 * targets.mjs의 VOLATILE_KEYS는 뺀다. 다르면 처음 다른 곳(경로)을 몇 개 보이고 종료 코드 1
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VOLATILE_KEYS } from './targets.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '.snap');
const [a, b] = process.argv.slice(2);
if (!a || !b) {
  console.error('사용법: npm run snap:diff -- <전 이름> <후 이름>');
  process.exit(1);
}
const skip = new Set(VOLATILE_KEYS);

/** 다른 곳의 경로들 (최대 limit개) */
function differences(x, y, path = '', out = [], limit = 5) {
  if (out.length >= limit) return out;
  if (Object.is(x, y)) return out;
  const tx = Array.isArray(x) ? 'array' : x === null ? 'null' : typeof x;
  const ty = Array.isArray(y) ? 'array' : y === null ? 'null' : typeof y;
  if (tx !== ty || (tx !== 'object' && tx !== 'array')) {
    out.push(
      `${path || '(전체)'}: ${JSON.stringify(x)?.slice(0, 80)} → ${JSON.stringify(y)?.slice(0, 80)}`,
    );
    return out;
  }
  if (tx === 'array') {
    if (x.length !== y.length)
      out.push(`${path}: 길이 ${x.length} → ${y.length}`);
    for (let i = 0; i < Math.min(x.length, y.length); i++)
      differences(x[i], y[i], `${path}[${i}]`, out, limit);
    return out;
  }
  const keys = new Set([...Object.keys(x), ...Object.keys(y)]);
  for (const k of keys) {
    if (skip.has(k)) continue;
    if (!(k in x)) out.push(`${path}.${k}: (없음) → 생김`);
    else if (!(k in y)) out.push(`${path}.${k}: 없어짐`);
    else differences(x[k], y[k], `${path}.${k}`, out, limit);
    if (out.length >= limit) break;
  }
  return out;
}

const files = readdirSync(join(root, a)).filter((f) => f.endsWith('.json'));
let changed = 0;
for (const f of files) {
  const fb = join(root, b, f);
  if (!existsSync(fb)) {
    console.log(`!  ${f}  후 응답 없음`);
    changed++;
    continue;
  }
  const d = differences(
    JSON.parse(readFileSync(join(root, a, f), 'utf8')),
    JSON.parse(readFileSync(fb, 'utf8')),
  );
  if (!d.length) {
    console.log(`=  ${f}`);
    continue;
  }
  changed++;
  console.log(`≠  ${f}`);
  for (const line of d) console.log(`     ${line}`);
}
console.log(`\n${files.length}개 중 ${changed}개 다름`);
process.exit(changed ? 1 : 0);
