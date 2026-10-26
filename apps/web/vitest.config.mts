import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
	},
	// tsconfig는 Next를 위해 jsx: preserve라, 컴포넌트를 시험하려면 여기서 JSX를 변환한다 (#52)
	oxc: { jsx: { runtime: 'automatic' } },
	test: {
		// 브라우저 API(DOMPurify, window)를 쓰는 코드가 많아 기본 환경은 jsdom. 서버 동작은 파일 단위로 node 환경을 지정합니다.
		environment: 'jsdom',
		include: ['src/**/*.test.{ts,tsx}'],
		restoreMocks: true,
		// 날짜 표시는 실행 환경의 시간대를 따르므로(dayjs), 서비스 기준인 KST로 고정해 CI(UTC)와 결과를 맞춥니다.
		env: { TZ: 'Asia/Seoul' },
	},
});
