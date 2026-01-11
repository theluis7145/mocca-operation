import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E テスト設定
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* テスト実行の最大時間 */
  timeout: 30 * 1000,
  /* expect()のタイムアウト */
  expect: {
    timeout: 5000,
  },
  /* CI環境では並列実行を無効化 */
  fullyParallel: !process.env.CI,
  /* CI環境でのみリトライ */
  retries: process.env.CI ? 2 : 0,
  /* CI環境では単一ワーカー */
  workers: process.env.CI ? 1 : undefined,
  /* レポーター設定 */
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],
  /* 共通設定 */
  use: {
    /* ベースURL */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    /* スクリーンショット（失敗時のみ） */
    screenshot: 'only-on-failure',
    /* トレース（リトライ時のみ） */
    trace: 'on-first-retry',
    /* ビデオ（リトライ時のみ） */
    video: 'on-first-retry',
  },
  /* プロジェクト設定 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  /* ローカル開発サーバー */
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
})
