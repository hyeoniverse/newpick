module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
      },
    ],
  },
  overrides: [
    {
      // 환경 변수는 config/env.ts 한 곳에서 읽는다 (#199). 테스트는 값을 바꿔 보려고 process.env를 쓴다
      files: ['src/**/*.ts'],
      excludedFiles: ['src/config/**', 'src/**/*.spec.ts', 'src/**/__tests__/**'],
      rules: {
        'no-restricted-properties': [
          'error',
          {
            object: 'process',
            property: 'env',
            message: "환경 변수는 src/config/env.ts의 env로 읽습니다 (import { env } from '../config/env').",
          },
        ],
      },
    },
  ],
};
