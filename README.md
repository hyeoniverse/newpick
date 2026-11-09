# NewPick

관심사 기반 맞춤형 뉴스레터 서비스입니다.

## 프로젝트 이력

- **v1 (2024-12-26 ~ 2025-02-06)**: 프로그래머스 데브코스 5인 팀 프로젝트(FE 2, BE 3)
  - 원본 레포: [Devcourse-NewPick/front](https://github.com/Devcourse-NewPick/front), [Devcourse-NewPick/back](https://github.com/Devcourse-NewPick/back)
  - 이 레포의 `v1-team-final` 태그까지가 팀 작업입니다. 커밋 메시지의 PR 번호는 원본 레포의 PR을 가리킵니다.
- **v2 (2026-10 ~)**: 개인 리팩토링 및 재배포

## 구조

| 경로 | 내용 |
|---|---|
| [`apps/web`](apps/web) | 프론트엔드 (Next.js) |
| [`apps/api`](apps/api) | 백엔드 (NestJS) |
| [`packages/shared`](packages/shared) | 웹 · api가 함께 쓰는 상수와 타입 (`@newpick/shared`) |

## 설치 · 실행

npm workspaces로 묶여 있어 **저장소 루트에서 한 번** 설치합니다 (잠금 파일은 루트 `package-lock.json` 하나).

```bash
npm ci                 # 두 앱 모두 설치 (한 앱만: npm ci -w apps/web)
npm run dev:web        # 웹 (localhost:3000)
npm run dev:api        # api (localhost:3001, apps/api/README.md의 .env 먼저)
npm test               # 두 앱의 테스트
```

- 패키지 추가 · 삭제도 루트에서 앱을 지정합니다: `npm install dayjs -w apps/web`
- 설치하면 `postinstall`이 `packages/shared`를 빌드합니다 (두 앱은 빌드된 `dist`를 씁니다). 공유 패키지를 고쳤으면 `npm run build -w @newpick/shared`
- api Docker 이미지는 루트를 컨텍스트로 만듭니다: `docker build -f apps/api/Dockerfile .`
