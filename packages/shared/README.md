# @newpick/shared

웹(`apps/web`)과 api(`apps/api`)가 함께 쓰는 상수와 타입입니다. 같은 것을 두 앱에 따로 적지 않습니다.

| 파일 | 내용 |
| --- | --- |
| `src/categories.ts` | 뉴스레터 분야 6개 (id · 이름 · 설명), `CategoryName` · `categoryName(id)` |
| `src/errors.ts` | api 오류 code 이름 · `ErrorCode` · `isErrorCode` (api의 오류 표가 이 이름과 하나라도 다르면 타입 오류) |
| `src/newsletters.ts` | 뉴스레터 한 편 · 목록 응답 (api의 Prisma 모델과 칸이 다르면 api 타입 오류, `apps/api/src/contracts.ts`) |
| `src/me.ts` · `src/scraps.ts` · `src/mails.ts` | 로그인한 사람 · 마이페이지(북마크 · 스크랩 · 취향 · 받은 메일) 응답 |
| `src/jobs.ts` · `src/schedule.ts` · `src/dashboard.ts` | 예약 작업 이름 · 결과 · 예약 시각 · 관리자 대시보드 응답 |
| `src/admin.ts` · `src/stats.ts` | 관리자 목록 · 통계 응답 |

- TypeScript로 쓰고 `dist`(CommonJS + 타입)로 빌드합니다. 루트에서 `npm ci` · `npm install`하면 `postinstall`이 빌드합니다.
- 고친 뒤에는 `npm run build -w @newpick/shared` (두 앱은 `dist`를 씁니다).
- 런타임 의존성은 두지 않습니다 (웹 번들 · api 이미지 크기).
