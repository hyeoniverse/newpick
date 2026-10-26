import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  { ignores: [".next/**", "node_modules/**", "public/**", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // 디버그 로그는 남기지 않습니다. console.error는 서버 로그와 에러 경계처럼 사용자에게 알릴 수 없는 곳에서만 씁니다.
  { rules: { "no-console": ["error", { allow: ["error"] }] } },
  // E2E 시드·설정은 브라우저가 아니라 Node에서 도는 스크립트
  { files: ["e2e/**"], rules: { "no-console": "off" } },
];

export default eslintConfig;
