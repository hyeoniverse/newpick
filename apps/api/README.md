# NewPick API

NewPick의 백엔드입니다. 뉴스를 크롤링하고, AI로 요약해 뉴스레터를 만들고, 구독자에게 메일로 보냅니다.

> 팀 프로젝트(v1) 당시의 README는 [docs/v1/api-README.md](../../docs/v1/api-README.md)에 보존되어 있습니다.

## 구성

| 영역 | 기술 | 용도 |
|---|---|---|
| 서버 | NestJS 10 | REST API, 스케줄러(`@nestjs/schedule`) |
| 핵심 데이터 | MySQL + Prisma | 유저, 구독, 카테고리, 뉴스레터, 북마크 |
| 크롤링 원문 | MongoDB + Mongoose | 기사 원문. TTL 인덱스로 30일 뒤 자동 삭제 |
| 크롤링 | fetch + jsdom | 네이버 뉴스 섹션·기사 페이지 |
| AI 요약 | Claude API (`@anthropic-ai/sdk`) | 카테고리별 뉴스레터 생성 |
| 메일 | nodemailer (Gmail) | 뉴스레터 발송 |
| 인증 | Google OAuth + JWT(HttpOnly 쿠키) | 로그인 |

## 스케줄

| 시각(KST) | 작업 |
|---|---|
| 매일 08:00 | 네이버 뉴스 6개 섹션 헤드라인 크롤링 → MongoDB 저장 |
| 매일 08:30 | 카테고리별 AI 요약 → 뉴스레터 저장 |
| 매주 월요일 08:40 | 구독자의 관심 카테고리에 맞는 뉴스레터 메일 발송 |

관리자는 `POST /scheduler/manual/*`로 각 작업을 바로 실행할 수 있습니다.

## 접근 정책

모든 라우트는 기본적으로 로그인이 필요합니다(전역 `JwtAuthGuard`). 공개 라우트는 `@Public()`, 관리자 라우트는 `@AdminOnly()`로 표시하고, 관리자 여부는 매 요청 DB의 `role`로 확인합니다. 전체 정책은 [route-policy.spec.ts](src/auth/__tests__/route-policy.spec.ts)의 표가 기준입니다.

## 로컬 실행

```bash
cp .env.example .env   # JWT_SECRET, JWT_REFRESH_SECRET 등 채우기
docker compose up --build
curl localhost:3001    # Hello World
```

- 시작할 때 Prisma migration이 자동으로 적용되고, 뉴스 카테고리 6개(id 1~6)가 함께 들어갑니다.
- MySQL은 `localhost:3308`, MongoDB는 `localhost:27018`로 열립니다.
- Google 로그인, AI 요약, 메일 발송은 각 키를 채워야 동작합니다.

### Docker 없이 실행

```bash
npm ci
npx prisma generate
npx prisma migrate deploy   # MYSQL_URL의 DB에 스키마 적용
npm run start:dev
```

## 검사

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

CI(`.github/workflows/ci.yml`)가 PR마다 같은 검사를 실행합니다.
