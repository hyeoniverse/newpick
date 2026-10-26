// next build 전에 실행합니다 (npm run e2e:seed). 홈·소개는 빌드할 때 데이터를 읽어 정적으로 만들어집니다.
import { seedNewsletters } from './support/db.mjs';

await seedNewsletters();
console.log('E2E 뉴스레터 시드 완료');
