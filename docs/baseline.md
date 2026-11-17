# 기준선 (v2 0단계, 2026-10-19)

리팩토링 전후를 비교하기 위한 측정값입니다. 측정 환경은 macOS, Node 23.10, npm 11.19입니다.

## web (`apps/web`)

### 빌드 결과 (`next build`)

| 경로 | 페이지 JS | First Load JS |
|---|---:|---:|
| `/` | 33.1 kB | 213 kB |
| `/about` | 5.46 kB | 176 kB |
| `/articles` | 6.18 kB | 154 kB |
| `/articles/detail/[slug]` | 12.9 kB | 182 kB |
| `/mypage` | 5.35 kB | 141 kB |
| 공통 | | 103 kB |

- 모든 페이지가 동적 렌더링(`ƒ`)입니다. 루트 layout의 `force-dynamic` 때문입니다.
- Next 15.1.3 기준(업그레이드 전) 공통 JS는 106 kB였습니다.

### 코드

| 항목 | 값 |
|---|---:|
| `.tsx` 파일 | 90 |
| `'use client'` 파일 | 65 |
| styled-components를 쓰는 파일 | 74 |
| 스타일 때문에만 `'use client'`인 파일 | 20 |
| Zustand store | 17 |
| `console.*` 호출 | 60 |
| 테스트 | 0 |

### 의존성 취약점 (`npm audit`)

| | critical | high | moderate | low | 합계 |
|---|---:|---:|---:|---:|---:|
| 0단계 전 | 2 | 24 | 6 | 3 | 35 |
| 0단계 후 | 1 | 9 | 1 | 0 | 11 |

- 남은 critical은 swiper(prototype pollution)이고 메이저 업그레이드가 필요합니다.

## api (`apps/api`)

| 항목 | 0단계 전 | 0단계 후 |
|---|---:|---:|
| 직접 의존성 (dev 포함) | 76 | 56 |
| 설치 패키지 수 | — | 293개 감소 |
| 취약점 합계 | 171 | 96 |
| critical | 6 | 0 |
| high | 108 | 49 |
| lint 오류 | 40 | 0 |
| 타입 오류 (`tsc --noEmit`) | 5 | 0 |
| 테스트 | 10개 파일, 모두 실패하는 빈 스캐폴드 | 0 |

---

# 리팩토링 후 (2026-11-07, `a02d7180`)

0단계 기준선과 같은 항목을 다시 쟀습니다. 측정 환경은 macOS, Node 26.12입니다. 그사이 페이지와 기능이 늘어(관리자 · 마이페이지 · 태그 · 시작하기 등) 크기는 페이지별로 비교합니다.

## web

### 빌드 결과 (`next build`)

| 경로 | 렌더링 (전 → 후) | First Load JS (전 → 후) |
|---|---|---:|
| `/` | 동적 → 정적 + 10분 재생성 | 213 → 201 kB |
| `/about` | 동적 → 정적 + 10분 재생성 | 176 → 198 kB |
| `/articles` | 동적 → 동적 (검색 · 거르기 쿼리) | 154 → 273 kB |
| `/articles/detail/[slug]` | 동적 → 동적 | 182 → 222 kB |
| `/mypage` | 동적 → 정적 껍데기 + 클라이언트 데이터 | 141 → 148 kB |
| 공통 | | 103 → 103 kB |

- 루트 layout의 `force-dynamic`을 걷어, 데이터가 없는 페이지와 홈 · 시작하기는 정적으로 만들고 10분마다 다시 만든다(ISR). 새 뉴스레터가 나오면 api가 바로 다시 만들게 한다(#73)
- `/articles`는 검색 · 태그 거르기 · 태그 팔로우, 상세는 스크랩 · 메모 · 후속 지켜보기 · 공유가 더해져 커졌다
- 새로 생긴 페이지: 관리자 13개(253~284 kB), `/tags`(149 kB), `/unsubscribe`(135 kB), 약관 · 개인정보(127 kB)

### 코드

| 항목 | 전 | 후 |
|---|---:|---:|
| `.tsx` 파일 | 90 | 197 |
| `'use client'` 파일 | 65 | 138 |
| styled-components를 쓰는 파일 | 74 | 145 |
| Zustand store | 17 | 11 |
| `console.*` 호출 | 60 | 6 |
| 단위 테스트 (Vitest) | 0 | 22개 파일 · 109개 |
| E2E 테스트 (Playwright) | 0 | 5개 파일 · 14개 |
| lint · 타입 오류 | — | 0 · 0 |

- 서버 데이터는 TanStack Query로 옮겨 store를 17개에서 11개로 줄였다(로그인 모달 · 토스트 등 화면 상태만 남김)
- styled-components는 그대로 쓰며 늘었다. Tailwind 전환(#10)은 아직 하지 않았다

### 의존성 취약점 (`npm audit`)

| | critical | high | moderate | low | 합계 |
|---|---:|---:|---:|---:|---:|
| 0단계 후 | 1 | 9 | 1 | 0 | 11 |
| 지금 | 0 | 1 | 7 | 3 | 11 |

## api

| 항목 | 0단계 전 | 0단계 후 | 지금 |
|---|---:|---:|---:|
| 직접 의존성 (dev 포함) | 76 | 56 | 53 |
| 취약점 합계 | 171 | 96 | 65 |
| critical | 6 | 0 | 0 |
| high | 108 | 49 | 11 |
| lint 오류 | 40 | 0 | 0 |
| 타입 오류 (`tsc --noEmit`) | 5 | 0 | 0 |
| 테스트 | 실패하는 빈 스캐폴드 | 0 | 47개 파일 · 362개 |

## 한 줄 요약

- 모든 페이지가 동적이던 것을 정적 + 재생성으로 바꾸고, Vercel + Oracle 무료 VM 배포까지 마쳤다
- 테스트 0개에서 api 362개 · 웹 단위 109개 · E2E 14개로 늘었고, PR마다 CI(타입 검사 · lint · 테스트 · 빌드 · E2E)에서 돈다
- critical 취약점 0, lint · 타입 오류 0을 유지한다
- 남은 것: styled-components → Tailwind 전환(#10)은 아직 정하지 않았고, 크기가 커진 `/articles` · 상세는 기능이 늘어난 몫이다

---

# 리팩토링 2차 후 (2026-11-18, `b8aaf786`)

2차(#202: 공유 패키지 · 웹 구조 · 큰 파일 나누기 · api 구조 · strict · 도구 통일) 뒤 같은 항목을 다시 쟀습니다. 측정 환경은 macOS, Node 26.12입니다. 빌드는 실행 중인 개발 서버와 겹치지 않게 저장소를 새로 받아 `npm ci` 뒤에 했습니다.

## web

### 빌드 결과 (`next build`, First Load JS)

| 경로 | 0단계 | 1차 후 | 2차 후 |
|---|---:|---:|---:|
| `/` | 213 kB | 201 kB | **194 kB** |
| `/about` | 176 kB | 198 kB | **189 kB** |
| `/articles` | 154 kB | 273 kB | **261 kB** |
| `/articles/detail/[slug]` | 182 kB | 222 kB | **212 kB** |
| `/mypage` | 141 kB | 148 kB | 148 kB |
| `/tags` | — | 149 kB | 146 kB |
| 관리자 (14개) | — | 253~284 kB | 245~272 kB |
| 공통 | 103 kB | 103 kB | 103 kB |

- 2차는 구조 정리라 크기를 줄이는 것이 목표가 아니었지만 화면마다 3~12 kB 줄었다. styled-components 제거(Tailwind 전환) · 중복 부품 정리(#230)가 겹친 결과로 보인다 (항목별로 따로 재지는 않음)
- `/articles` · 상세는 여전히 0단계보다 크다 (검색 · 태그 · 스크랩 · 후속 지켜보기 등 기능 몫). 모바일 성능은 #292에서 따로 다룬다

### 코드

| 항목 | 0단계 | 1차 후 | 2차 후 |
|---|---:|---:|---:|
| `.tsx` 파일 | 90 | 197 | 236 |
| `'use client'` 파일 | 65 | 138 | 173 |
| styled-components를 쓰는 파일 | 74 | 145 | **0** (의존성도 지움) |
| Zustand store | 17 | 11 | 11 |
| `console.*` 호출 (테스트 제외) | 60 | 6 | 6 (`console.error`만, lint로 막음) |
| 단위 테스트 (Vitest) | 0 | 22개 파일 · 109개 | **40개 파일 · 176개** |
| E2E (Playwright) | 0 | 5개 파일 · 14개 | 5개 파일 · 15개 |
| 테스트 coverage (줄) | — | — | 16.64% (`npm run test:cov`, 보고만) |
| 직접 의존성 (dev 포함) | — | — | 33 |

- `.tsx` 파일이 늘어난 것은 큰 파일을 하는 일 단위로 나눈 몫(#198)과 새 화면 몫이다

### 의존성 취약점 (`npm audit`)

| | critical | high | moderate | low | 합계 |
|---|---:|---:|---:|---:|---:|
| 0단계 후 | 1 | 9 | 1 | 0 | 11 |
| 1차 후 | 0 | 1 | 7 | 3 | 11 |
| 2차 후 (전체) | 0 | 13 | 6 | 0 | 19 |
| 2차 후 (실행 의존성만, `--omit=dev`) | 0 | 1 | 1 | 0 | 2 |

- 늘어난 high는 대부분 개발 도구(vitest · eslint-config-next)이고, 그사이 새로 공개된 권고 몫이다
- 실행 의존성의 high 1개는 Next가 쓰는 postcss (고치려면 Next 16, 메이저 업그레이드)

## api

| 항목 | 0단계 후 | 1차 후 | 2차 후 |
|---|---:|---:|---:|
| 직접 의존성 (dev 포함) | 56 | 53 | 58 |
| 취약점 합계 (전체) | 96 | 65 | 99 |
| critical | 0 | 0 | 0 |
| high (전체 · 실행 의존성만) | 49 | 11 | 54 · **7** |
| lint · 타입 오류 | 0 · 0 | 0 · 0 | 0 · 0 (`strict: true`) |
| 테스트 | 0 | 47개 파일 · 362개 | **57개 파일 · 410개** |
| 테스트 coverage (줄) | — | — | 73.56% |

- 실행 의존성의 high 7개: `@nestjs/config` · `@nestjs/platform-express`(body-parser · multer · lodash) · mongoose · nodemailer. Nest 10 → 11 이상 · nodemailer 6 → 메이저 업그레이드가 필요해 따로 다룬다
- 늘어난 전체 high는 대부분 jest · @nestjs/cli 같은 개발 도구의 새 권고

## 한 줄 요약 (2차)

- 구조: 공유 패키지 하나, 큰 서비스 · 화면 파일을 하는 일 단위로, 서로 import하는 모듈 7쌍 · 순환 import 3개 → 0, api `strict: true` · `any` 0
- 규칙은 lint · 검사 스크립트로 잠금 ([docs/structure.md](structure.md))
- 테스트 api 362 → 410 · 웹 109 → 176, coverage 보고 시작
- 남은 것: 실행 의존성의 high(api 7 · web 1)는 메이저 업그레이드 묶음으로, 모바일 성능은 #292

## 서버 컴포넌트 후보 (#201 작업 6)

`'use client'` 파일 173개 가운데 **훅 · 이벤트 처리 · 브라우저 객체(window · document · localStorage) · 전역 store · Context · 애니메이션을 쓰지 않는 18개**입니다. 옮기기는 #292(성능)에서 하나씩 확인하며 한다 (부르는 쪽이 클라이언트 컴포넌트면 그대로 클라이언트로 묶이므로, 옮겨도 이득이 없는 것은 남긴다).

| 파일 | 줄 |
|---|---:|
| `app/about/_components/HowToUseSection.tsx` | 217 |
| `components/common/icons/Glyphs.tsx` | 134 |
| `app/about/_components/WhoSection.tsx` | 129 |
| `components/common/Button.tsx` | 99 |
| `app/about/_components/PersonalSection.tsx` | 98 |
| `app/(protected)/admin/_components/stats/StatsParts.tsx` | 87 |
| `app/about/_components/WhyNewpickSection.tsx` | 82 |
| `components/layout/Footer.tsx` | 57 |
| `app/articles/detail/[slug]/_components/content/ArticleContent.tsx` | 53 |
| `components/common/charts/BarList.tsx` | 48 |
| `app/articles/(main)/_components/ArticlesLoading.tsx` | 41 |
| `app/about/_components/StatementSection.tsx` | 37 |
| `app/about/_components/Logos.tsx` | 34 |
| `app/about/_components/SectionHeading.tsx` | 24 |
| `app/(protected)/mypage/_components/list/Thumb.tsx` | 20 |
| `app/(protected)/mypage/_components/MySettings.tsx` | 19 |
| `app/not-found.tsx` · `app/articles/detail/[slug]/not-found.tsx` | 9 · 9 |

- 시작하기(`/about`) 구역이 7개로 가장 많다. 정적 페이지라 옮기면 JS를 바로 줄일 수 있다
- `ArticleContent`는 서버에서도 본문을 정리하므로(#293) 옮기면 상세 화면 첫 응답에 도움이 될 수 있다

## 안 쓰는 코드 보고 (knip 6.45.1, #201 작업 7)

`npx knip --no-exit-code`의 결과입니다. **보고만 하고 지우지 않았습니다.** 일부는 일부러 둔 것이라 지우면 안 됩니다.

| 종류 | 개수 | 내용 · 판단 |
|---|---:|---|
| 쓰지 않는 파일 | 2 | `api/src/contracts.ts`(응답 · 공유 타입을 맞추는 타입 검사 파일, **일부러 둠**) · `api/scripts/compare-open-models.ts`(손으로 돌리는 비교 스크립트, 둠) |
| 쓰지 않는 의존성 | 4 | web `@svgr/webpack` · `html-react-parser` · `http-status-codes` · `server-only` → 실제로 쓰는지 확인 뒤 정리 |
| 쓰지 않는 개발 의존성 | 7 | 루트 `jsdom`(vitest가 찾게 **일부러 둠**, #291) · web `eslint-config-next` · api `@nestjs/testing` · `supertest` · `@types/supertest` · `source-map-support` · `ts-loader` → 확인 뒤 정리 |
| 선언하지 않은 의존성 | 10 | api `express`(Nest가 가져옴, 타입만 씀) · `cron` · web `date-fns` → `package.json`에 적기 |
| 쓰지 않는 export | 70 | 상수(`*_LIMITS` · 모델 이름 등)를 파일 밖에 내보내기만 한 것이 대부분 → 내보내기만 걷기 |
| 쓰지 않는 타입 export | 22 | 같은 성격 |
| 중복 export (이름 + default) | 4 | `API_ENDPOINTS` · `useSubscribe` · `AppThemeProvider` · `DatePicker` → 하나로 |

- 정리는 동작이 바뀌지 않는 작은 PR로 따로 한다 (지울 의존성은 빌드 · 테스트로 확인)
