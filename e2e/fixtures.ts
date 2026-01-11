import { test as base, expect, Page } from '@playwright/test'

/**
 * テスト用フィクスチャ
 */

// テストユーザー認証情報（環境変数から取得、またはD1シードユーザーを使用）
export const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'worker@mocca.jp',
  password: process.env.TEST_USER_PASSWORD || 'worker123',
}

/**
 * ログイン済み状態のページを提供するフィクスチャ
 */
export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    // ログインページに移動
    await page.goto('/login')

    // ログインフォームに入力
    await page.getByTestId('email-input').fill(TEST_USER.email)
    await page.getByTestId('password-input').fill(TEST_USER.password)
    await page.getByTestId('login-button').click()

    // ダッシュボードへのリダイレクトを待機
    await expect(page).toHaveURL('/', { timeout: 10000 })

    // ログイン済みのページを使用
    await use(page)
  },
})

export { expect }

/**
 * ヘルパー関数
 */

/**
 * ページのローディング完了を待機
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle')
}

/**
 * トースト通知の表示を待機して検証
 */
export async function expectToast(page: Page, textPattern: string | RegExp): Promise<void> {
  const toast = page.locator('[data-sonner-toast]').filter({ hasText: textPattern })
  await expect(toast).toBeVisible({ timeout: 5000 })
}

/**
 * 要素が表示されるまで待機
 */
export async function waitForElement(page: Page, testId: string, timeout = 10000): Promise<void> {
  await page.getByTestId(testId).waitFor({ state: 'visible', timeout })
}
