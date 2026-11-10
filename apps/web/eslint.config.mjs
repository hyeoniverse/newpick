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
  // E2E 시드·설정 · 화면 비교 도구는 브라우저가 아니라 Node에서 도는 스크립트
  { files: ["e2e/**", "visual/**"], rules: { "no-console": "off" } },
  /*
   * 구조 규칙 잠그기 (#197). 정리한 규칙이 다시 흐트러지지 않게 lint가 막는다
   * - api 요청은 src/api/ 모듈에서만 (화면 · 훅은 그 함수를 부른다)
   * - 환경 변수는 constants/ (설정) · app/api/ (서버 경로)에서만
   * - fetch는 api/client.ts에서만. middleware(토큰 갱신)와 Tracker(페이지를 떠날 때 keepalive 전송)는 apiFetch를 쓸 수 없어 예외
   * - 화면 경로는 constants/routes.ts의 ROUTES로, React Query 열쇠는 api/queryKeys.ts로
   */
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/api/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        { paths: [{ name: "@/api/client", importNames: ["apiFetch"], message: "api 요청은 src/api/ 모듈에 함수로 두고 그 함수를 부르세요." }] },
      ],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/constants/**", "src/app/api/**", "src/**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-properties": [
        "error",
        { object: "process", property: "env", message: "환경 변수는 src/constants/의 설정 값으로 읽으세요." },
      ],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/api/client.ts", "src/middleware.ts", "src/components/common/analytics/Tracker.tsx", "src/**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-globals": ["error", { name: "fetch", message: "요청은 src/api/ 모듈 (apiFetch)로 보내세요." }],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/constants/routes.ts",
      "src/api/queryKeys.ts",
      "src/app/(protected)/admin/_lib/trafficLabels.ts",
      "src/**/*.test.{ts,tsx}",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/^\\x2F(articles|mypage|admin|about|tags|terms|privacy|unsubscribe|login-popup)(\\x2F|\\?|#|$)/]",
          message: "화면 경로는 constants/routes.ts의 ROUTES로 만드세요.",
        },
        {
          selector: "TemplateLiteral > TemplateElement:first-child[value.raw=/^\\x2F(articles|mypage|admin|about|tags|terms|privacy|unsubscribe|login-popup)(\\x2F|\\?|#|$)/]",
          message: "화면 경로는 constants/routes.ts의 ROUTES로 만드세요.",
        },
        {
          selector: "Property[key.name='queryKey'] > ArrayExpression",
          message: "React Query 열쇠는 api/queryKeys.ts의 queryKeys로 만드세요.",
        },
      ],
    },
  },
];

export default eslintConfig;
