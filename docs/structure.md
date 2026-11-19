# 구조와 규칙

리팩토링 2차(#202)에서 정한 폴더 · 타입 · 상수 · 요청 · 스타일 · 모듈 규칙을 한곳에 모은 문서입니다. 규칙마다 **어디서 막는지**(lint · 검사 스크립트 · 테스트)를 같이 적었습니다. 막는 장치가 있는 규칙은 어기면 CI가 실패합니다.

- 설치 · 실행: [루트 README](../README.md)
- 배포 · 서버: [deployment.md](deployment.md)
- api 오류 응답: [api-errors.md](api-errors.md)
- 바꾸기 전 · 후 비교 도구: [visual-diff.md](visual-diff.md) (화면) · [api-snapshot.md](api-snapshot.md) (api 응답)
- 측정값: [baseline.md](baseline.md) · 모바일 성능 [performance.md](performance.md)

## 저장소

npm workspaces 모노레포입니다. 잠금 파일은 루트 `package-lock.json` 하나입니다.

| 경로 | 내용 |
| --- | --- |
| `apps/web` | 프론트엔드 (Next.js 15 App Router, React 19, Tailwind v4) · Vercel 배포 |
| `apps/api` | 백엔드 (NestJS 10, Prisma · MySQL, Mongoose · MongoDB) · Oracle VM의 Docker 배포 |
| `packages/shared` | 두 앱이 같이 쓰는 타입 · 상수 (`@newpick/shared`) |
| `scripts/` | 두 앱이 같이 쓰는 검사 스크립트 (`check-cycles.mjs`, `cycles-allow.json`) |
| `docs/` | 문서 |

### 루트에서 정하는 것

| 무엇 | 자리 | 왜 |
| --- | --- | --- |
| 코드 모양 | 루트 `.prettierrc` (탭 · 120자 · 작은따옴표 · 쉼표 모두) | 두 앱이 같은 모양. 모양만 바꾼 커밋은 `.git-blame-ignore-revs`에 (로컬: `git config blame.ignoreRevsFile .git-blame-ignore-revs`) |
| `devDependencies.jsdom` (30) | 루트 `package.json` | coverage 패키지 때문에 vitest가 루트에 깔리는데, jsdom이 앱 안에만 있으면 루트의 vitest가 못 찾는다. web과 같은 판을 루트에 둔다 (#291) |
| `overrides.isomorphic-dompurify.jsdom` (26.1.0) | 루트 `package.json` | 상세 본문을 서버에서 정리하는 jsdom 30이 ESM 전용 패키지를 `require()`해 **Vercel 런타임에서 실패**한다. 서버 정리용만 CommonJS로 도는 26으로 (#293) |

## 공유 패키지 (`packages/shared`)

- api 응답 모양 · 오류 code · 분야 목록 · 예약 작업 값처럼 **두 앱이 같은 값을 알아야 하는 것**만 둡니다. 런타임 의존성은 두지 않습니다.
- 두 앱은 빌드된 `dist`를 씁니다. 고친 뒤에는 `npm run build -w @newpick/shared` (설치하면 `postinstall`이 빌드).
- api 응답과 공유 타입이 어긋나면 api 타입 검사가 실패합니다: `apps/api/src/contracts.ts` (실행되지 않는 타입 검사 파일).

## web (`apps/web`)

### 폴더

| 폴더 | 두는 것 |
| --- | --- |
| `src/app/` | 화면 (App Router). 화면에서만 쓰는 것은 그 화면 폴더 안 `_components/` · `_lib/`(순수 계산 + 테스트) · `_hooks/`에 |
| `src/components/common` · `layout` · `providers` | 두 화면 이상이 쓰는 부품 · 머리글 · 바닥글 · Provider |
| `src/api/` | **모든 api 요청**. `client.ts`의 `apiFetch`와 화면별 요청 함수, React Query 열쇠(`queryKeys.ts`) |
| `src/constants/` | 설정 · 상수 (환경 변수, 경로 `routes.ts`, 숫자, 저장소 키 등) |
| `src/copy/` | 화면 문구 (문장). 짧은 단추 · 라벨은 공통 `ACTIONS` |
| `src/content/` | 문서 내용 (약관 · 소개처럼 긴 글) |
| `src/hooks/` · `src/stores/` | 공통 훅 · 전역 상태 (zustand) |
| `src/types/` | 웹에서만 쓰는 타입. api 응답 타입은 `@newpick/shared` |
| `src/utils/` | 공통 순수 함수 (+ 테스트) |
| `src/styles/` | 공통 부품 CSS · 화면 CSS(`pages/`) · 토큰(`tokens/`) |

- 큰 파일은 줄 수가 아니라 **하는 일 단위**로 나눕니다 (값 계산 · 훅 · 그리기 · 바뀌는 이유가 다른 것). 길어도 한 가지 일이면 그대로 둡니다 (#198).

### 규칙과 막는 곳

| 규칙 | 막는 곳 |
| --- | --- |
| api 요청은 `src/api/` 모듈 함수로만. 화면 · 훅은 그 함수를 부른다 (`apiFetch` 직접 금지) | ESLint `no-restricted-imports` |
| `fetch`는 `api/client.ts`에서만 (토큰 갱신 middleware · 페이지 떠날 때 보내는 Tracker는 예외) | ESLint `no-restricted-globals` |
| 환경 변수는 `src/constants/`(설정) · `src/app/api/`(서버 경로)에서만 | ESLint `no-restricted-properties` |
| 화면 경로는 `ROUTES`로 (`'/articles'`처럼 직접 적지 않음) | ESLint `no-restricted-syntax` |
| React Query 열쇠는 `queryKeys`로 | ESLint `no-restricted-syntax` |
| 화면 문구(문장)는 `src/copy/`에. 문체는 "~합니다" | ESLint `no-restricted-syntax` (문장 끝 모양으로 찾음) |
| 디버그 `console.log` 금지 (`console.error`만, 서버 로그 · 오류 경계) | ESLint `no-console` |
| 순환 import 금지 | `npm run cycles` |

### 스타일 (Tailwind v4 · CSS 층)

- 층 순서 `theme → base → components → utilities` (`src/app/global.css`). **유틸리티 클래스가 언제나 이깁니다.**
- 부품 · 화면 CSS는 모두 `@layer components`. 공통 부품이 스스로 붙이는 기본 모양은 `styles/parts.css` (components 층 맨 앞, 화면 CSS가 덮어쓸 수 있게).
- 라이브러리 CSS(Swiper 등)는 화면 CSS보다 아래 층(base)에 **한 번만** 불러옵니다.
- 색 · 글자 크기는 `styles/tokens/tokens.css`의 `var(--np-…)` (라이트 · 다크 · 화면 폭에 따라 바뀌는 값이 한곳에서 나옴).
- 테두리 · 밑줄에 점선은 쓰지 않습니다 (실선 또는 바탕색).
- **겹치는 층(z-index)**: 페이지 전체에서 겹치는 것은 숫자 대신 이름 붙인 층 `var(--np-z-…)`를 씁니다 (`styles/tokens/theme.ts`의 `Z_LAYERS` → `tokens.css`). 아래일수록 위에 그립니다: `sticky`(뒤로 가기 막대) < `float`(구석 단추) < `header` < `scrim`(시트 뒤 막) < `modal`(시트) < `popover`(시간 · 날짜 · select · 메뉴, 시트 안에서도 보이게) < `toast` < `skip-link`. Tailwind는 `z-(--np-z-header)`. 부품 안에서만 겹치는 것(글자 뒤 형광펜 띠 `-1`, 표의 고정 열 `1 · 2` 등)만 작은 숫자로 둡니다.

### 테스트 · 비교 도구

| 명령 | 내용 |
| --- | --- |
| `npm test` · `npm run test:cov` | vitest (jsdom). coverage는 보고만 (기준치 없음) |
| `npm run e2e` | Playwright (CI에서 빌드한 web + 시드 api로) |
| `npm run visual:shots -- <이름>` · `visual:diff` | 23화면 × 라이트 · 다크 · 휴대폰 + 열린 상태 화면 비교 ([visual-diff.md](visual-diff.md)) |

## api (`apps/api`)

### 모듈

`src/` 바로 아래 폴더 하나가 모듈 하나입니다. 큰 서비스는 하는 일 단위로 나눴습니다 (#199).

| 모듈 | 하는 일 |
| --- | --- |
| `config` | 환경 변수 읽기 (`env.ts`) · 시작할 때 검사 (`env.validation.ts`) |
| `prisma` | MySQL 클라이언트 (`MysqlPrismaService`, 전역) |
| `llm` | 모델 호출: Claude · 오픈 모델(Workers AI) · 가격 계산 |
| `ai` | 공급자 고르기 (오픈 모델 → 안 되면 Claude, 하루 상한) |
| `ai-summary` | 뉴스레터 쓰기 (`writer/` 아래 프롬프트 · 스키마 · 고르기 · 정리), 뉴스레터 HTML 만들기 · 읽기 |
| `crawling` · `category` | 기사 수집 (MongoDB) · 분야와 분야 고르기 |
| `scheduler` | 예약 작업 조립 · AI 요약 작업 · 구독 메일 작업 · 실행 기록 · 예약 시각 · 대시보드 |
| `admin-stats` | 관리자 통계 (경로는 `/scheduler/stats/*` 그대로) |
| `edition` · `recommend` · `taste` · `follows` | 하루 편집 · 맞춤 메일 · 추천 기사 · 취향 · 후속 지켜보기 |
| `newsletter` · `mypage` · `subscriber` · `auth` · `admin` · … | 각 화면의 api |
| `common` | 여러 모듈이 같이 쓰는 것 (KST 시간 · cron 식 · 요청 제한 · 오류 · DTO 등) |

- `src/` 맨 위 파일(`main.ts` · `app.module.ts` · `instruments.ts` · `contracts.ts`)은 모듈을 엮는 자리입니다. 모듈이 거꾸로 가져다 쓰지 않습니다.

### 규칙과 막는 곳

| 규칙 | 막는 곳 |
| --- | --- |
| 환경 변수는 `config/env.ts`의 `env`로만 읽는다. 필수 값 · 형식은 시작할 때 검사 (틀리면 시작 안 함) | ESLint `no-restricted-properties` · `env.validation.ts` |
| 파일 단위 순환 import 금지 | `npm run cycles` (madge, 허용 목록 0개) |
| **모듈끼리 서로 import 금지** (`a/x → b/y`, `b/z → a/w`) | `npm run cycles` |
| import 방식: 같은 모듈 안은 상대 경로(`./x`), 다른 모듈은 `src/모듈/…` | `npm run cycles` |
| TypeScript `strict: true`, `any` 금지 | tsconfig · ESLint `no-explicit-any` |
| `catch`의 값은 `errorMessage(error)`로 글자로 (`unknown`) | `strict` (`useUnknownInCatchVariables`) |
| 로그는 클래스마다 `new Logger(클래스.name)`. 디버그 `console.log` 금지 | ESLint `no-console` |
| 오류는 `AppException('CODE')` (code는 `@newpick/shared`의 오류 이름) | 타입 검사 ([api-errors.md](api-errors.md)) |
| 라우트는 기본 로그인 필요. 공개는 `@Public()`, 관리자는 `@AdminOnly()` | `auth/__tests__/route-policy.spec.ts` (모든 경로의 정책 표) |
| 시간대 · cron 식 · 요청 제한은 `common/kst` · `common/cron` · `common/throttle`의 이름 있는 값으로 | 코드 리뷰 |

### 테스트 · 비교 도구

| 명령 | 내용 |
| --- | --- |
| `npm test` | jest |
| `npm run snap:take -- <이름>` · `snap:diff` | 같은 요청의 api 응답을 저장해 바꾸기 전 · 후 비교 ([api-snapshot.md](api-snapshot.md)) |

## 검사 (CI)

PR마다 앱별로 같은 순서로 돕니다 (`.github/workflows/ci.yml`). 로컬에서도 앱 폴더에서 같은 명령을 씁니다.

```bash
npm run typecheck   # tsc
npm run lint        # ESLint 9 (두 앱 같은 판), Prettier 검사 포함(api)
npm run cycles      # 순환 import (+ api: 모듈 단위 · import 방식)
npm test
npm run build
```

- web은 e2e, api는 Docker 이미지 빌드가 더 돕니다. main에 들어간 api 변경은 이미지로 만들어 서버에 배포합니다.

## 진행 방식 (리팩토링 PR)

- PR마다 main에서 새로 시작합니다 (쌓는 PR 없음).
- 바꾸기 전 · 후를 비교합니다: web은 화면 비교, api는 응답 비교, 출력이 중요한 곳(뉴스레터 쓰기 등)은 가짜 Claude로 출력 비교.
- 리팩토링 중 찾은 버그는 따로 고치는 PR로 냅니다.
