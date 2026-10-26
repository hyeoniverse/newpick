import { seedNewsletters, resetUser } from './support/db.mjs';

/** 실행마다 같은 상태에서 시작한다: 시드 뉴스레터 확인, 테스트 사용자 초기화 */
export default async function globalSetup() {
	await seedNewsletters();
	process.env.E2E_USER_ID = String(await resetUser());
}
