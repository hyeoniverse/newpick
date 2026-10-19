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
