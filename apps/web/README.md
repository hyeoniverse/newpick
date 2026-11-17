# NewPick web

NewPick의 프론트엔드입니다. 뉴스레터 목록 · 상세 · 검색, 구독 · 마이페이지(북마크 · 스크랩 · 받은 메일 · 후속 지켜보기), 관리자 화면을 제공합니다.

> 팀 프로젝트(v1) 당시의 README는 [docs/v1/web-README.md](../../docs/v1/web-README.md)에 보존되어 있습니다.

## 구성

| 영역 | 기술 |
| --- | --- |
| 프레임워크 | Next.js 15 (App Router), React 19, TypeScript (strict) |
| 스타일 | Tailwind v4 + CSS 층 (`src/app/global.css`, 토큰 `src/styles/tokens/`) |
| 데이터 | React Query (열쇠는 `src/api/queryKeys.ts`), 전역 상태 zustand |
| 본문 정리 | isomorphic-dompurify (서버 · 브라우저 같은 규칙) |
| 배포 | Vercel |

폴더와 규칙(요청 · 경로 · 문구 · 환경 변수 · CSS 층)은 [docs/structure.md](../../docs/structure.md#web-appsweb)에 있습니다.

## 로컬 실행

```bash
npm ci                 # 저장소 루트에서
cp apps/web/.env.example apps/web/.env.local   # API_URL (기본 http://localhost:3001)
npm run dev:web        # localhost:3000
```

## 검사 · 도구

```bash
npm run typecheck
npm run lint
npm run cycles
npm test               # vitest
npm run test:cov       # coverage 보고
npm run e2e            # Playwright (npm run e2e:seed로 시드 먼저)
npm run visual:shots -- before && npm run visual:shots -- after && npm run visual:diff   # 화면 비교
```
