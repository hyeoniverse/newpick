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

폴더 · 타입 · 상수 · 요청 · 스타일 · 모듈 규칙과 그 규칙을 막는 검사는 [docs/structure.md](docs/structure.md)에 있습니다.

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

## 검사

앱 폴더에서 CI와 같은 순서로 돌립니다 (`.github/workflows/ci.yml`).

```bash
npm run typecheck   # tsc
npm run lint        # ESLint 9
npm run cycles      # 순환 import (+ api: 모듈끼리 서로 import · import 방식)
npm test            # web: vitest (npm run test:cov로 coverage) · api: jest
npm run build
```

## 문서

| 문서 | 내용 |
| --- | --- |
| [docs/structure.md](docs/structure.md) | 구조와 규칙 (어디서 막는지 포함) |
| [docs/deployment.md](docs/deployment.md) | 배포 · 서버 · 환경 변수 |
| [docs/api-errors.md](docs/api-errors.md) | api 오류 응답 모양과 code |
| [docs/visual-diff.md](docs/visual-diff.md) · [docs/api-snapshot.md](docs/api-snapshot.md) | 바꾸기 전 · 후 비교 도구 (화면 · api 응답) |
| [docs/baseline.md](docs/baseline.md) | 측정값 (번들 크기 · 의존성 취약점 · 테스트) |
| [docs/v1/](docs/v1) | 팀 프로젝트(v1) 당시 README |
