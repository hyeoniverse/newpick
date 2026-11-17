// @ts-check
import js from '@eslint/js';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{ ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'prisma/migrations/**'] },
	js.configs.recommended,
	...tseslint.configs.recommended,
	prettierRecommended,
	{
		languageOptions: {
			globals: { ...globals.node, ...globals.jest },
		},
		rules: {
			'@typescript-eslint/no-explicit-any': 'error',
			'prettier/prettier': ['error', { endOfLine: 'auto' }],
			// 디버그 로그는 남기지 않습니다. 서버 로그는 Nest Logger로, console.error는 Logger를 쓸 수 없는 곳(시작 실패)에서만 (web과 같은 규칙)
			'no-console': ['error', { allow: ['error'] }],
		},
	},
	{
		// 환경 변수는 config/env.ts 한 곳에서 읽는다 (#199). 테스트는 값을 바꿔 보려고 process.env를 쓴다
		files: ['src/**/*.ts'],
		ignores: ['src/config/**', 'src/**/*.spec.ts', 'src/**/__tests__/**'],
		rules: {
			'no-restricted-properties': [
				'error',
				{
					object: 'process',
					property: 'env',
					message: "환경 변수는 src/config/env.ts의 env로 읽습니다 (import { env } from 'src/config/env').",
				},
			],
		},
	},
	{
		// 시드 · 비교 같은 손으로 돌리는 스크립트는 터미널에 결과를 찍는다
		files: ['scripts/**'],
		rules: { 'no-console': 'off' },
	},
);
