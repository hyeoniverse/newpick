// E2E가 붙는 api·DB. CI(.github/workflows/ci.yml의 e2e job)와 로컬 docker compose 기본값이 같습니다.
export const E2E = {
	webUrl: process.env.E2E_WEB_URL ?? 'http://localhost:3100',
	apiUrl: process.env.API_URL ?? 'http://localhost:3001',
	mysqlUrl: process.env.E2E_MYSQL_URL ?? 'mysql://root:root@localhost:3308/newpick',
	// api의 JWT_SECRET과 같아야 합니다. (테스트용 로그인: Google OAuth 대신 이 키로 access token을 만든다)
	jwtSecret: process.env.E2E_JWT_SECRET ?? 'e2e-only-jwt-secret-do-not-use-in-production-0001',
	userEmail: 'e2e@newpick.test',
};
