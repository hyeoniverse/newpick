#!/usr/bin/env node
/**
 * API 응답 저장 (#229): npm run snap:take -- <이름> [--only <경로 일부>]
 * 켜 둔 api(SNAP_BASE_URL, 기본 http://localhost:3001)에 targets.mjs의 조회를 보내 apps/api/.snap/<이름>/ 에 JSON으로.
 * 로그인은 apps/api/.env의 JWT_SECRET으로 시험 토큰 (로컬 전용), 사용자 id는 SNAP_USER_ID (기본 1)
 */
import { createHmac } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TARGETS } from './targets.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const label = args.find((a) => !a.startsWith('--'));
const oi = args.indexOf('--only');
const only = oi >= 0 ? args[oi + 1] : undefined;
if (!label) {
  console.error('사용법: npm run snap:take -- <이름> [--only <경로 일부>]');
  process.exit(1);
}
const BASE = process.env.SNAP_BASE_URL ?? 'http://localhost:3001';
const USER_ID = Number(process.env.SNAP_USER_ID ?? 1);
const env = readFileSync(join(here, '..', '..', '.env'), 'utf8');
const secret = env
  .match(/^JWT_SECRET=(.*)$/m)?.[1]
  .trim()
  .replace(/^"|"$/g, '');
const b64 = (v) => Buffer.from(v).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const head = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
const body = b64(JSON.stringify({ sub: USER_ID, iat: now, exp: now + 3600 }));
const token = `${head}.${body}.${createHmac('sha256', secret).update(`${head}.${body}`).digest('base64url')}`;

const out = join(here, '..', '..', '.snap', label);
mkdirSync(out, { recursive: true });
export const fileOf = (auth, path) =>
  `${auth}${path.replace(/[^a-z0-9]+/gi, '_')}.json`;

let failed = 0;
for (const [auth, path] of TARGETS.filter(
  ([, p]) => !only || p.includes(only),
)) {
  const res = await fetch(`${BASE}${path}`, {
    headers: auth === 'public' ? {} : { Cookie: `access_token=${token}` },
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { nonJson: text.slice(0, 200) };
  }
  writeFileSync(
    join(out, fileOf(auth, path)),
    JSON.stringify({ status: res.status, body: json }, null, 2),
  );
  if (res.status >= 400) failed++;
  console.log(`${res.status}  ${auth.padEnd(6)} ${path}`);
}
if (
  TARGETS.some(([auth]) => auth === 'admin') &&
  failed &&
  !process.env.SNAP_USER_ID
)
  console.log('관리자 응답이 403이면 SNAP_USER_ID에 관리자 계정 id를 주세요');
console.log(
  `\n→ ${out}${failed ? ` (오류 응답 ${failed}개: 그대로 저장, 전 · 후가 같은지만 본다)` : ''}`,
);
