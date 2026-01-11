/** @type {import('jest').Config} */
module.exports = {
  // テストファイルの場所
  testMatch: ['<rootDir>/__tests__/**/*.test.{ts,tsx}'],

  // 環境
  testEnvironment: 'jest-environment-jsdom',

  // セットアップファイル
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // モジュール解決
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // TypeScript/JavaScript変換
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      useESM: true,
    }],
  },

  // ESMサポート
  extensionsToTreatAsEsm: ['.ts', '.tsx'],

  // カバレッジ設定
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/**/*.tsx',
    '!src/types/**/*',
  ],

  // 変換対象外
  transformIgnorePatterns: [
    '/node_modules/',
  ],

  // タイムアウト
  testTimeout: 10000,
}
