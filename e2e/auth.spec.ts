import { test, expect } from '@playwright/test'
import { TEST_USER, waitForPageLoad } from './fixtures'

test.describe('認証フロー', () => {
  test.describe('ログイン', () => {
    test('正しい認証情報でログインしてダッシュボードを表示できる', async ({ page }) => {
      // ログインページに移動
      await page.goto('/login')
      await waitForPageLoad(page)

      // ログインフォームが表示されていることを確認
      await expect(page.getByTestId('login-card')).toBeVisible()
      await expect(page.getByTestId('login-form')).toBeVisible()

      // 認証情報を入力
      await page.getByTestId('email-input').fill(TEST_USER.email)
      await page.getByTestId('password-input').fill(TEST_USER.password)

      // ログインボタンをクリック
      await page.getByTestId('login-button').click()

      // ダッシュボードへのリダイレクトを待機
      await expect(page).toHaveURL('/', { timeout: 15000 })

      // ダッシュボードの要素が表示されることを確認
      // 事業選択画面またはダッシュボードが表示される
      const hasDashboard = await page.getByTestId('dashboard-page').isVisible().catch(() => false)
      const hasBusinessSelection = await page.getByText('事業を選択してください').isVisible().catch(() => false)
      const hasNoBusinessMessage = await page.getByText('事業が登録されていません').isVisible().catch(() => false)

      // いずれかの状態であればOK
      expect(hasDashboard || hasBusinessSelection || hasNoBusinessMessage).toBeTruthy()
    })

    test('間違った認証情報でエラーメッセージが表示される', async ({ page }) => {
      await page.goto('/login')
      await waitForPageLoad(page)

      // 間違った認証情報を入力
      await page.getByTestId('email-input').fill('wrong@example.com')
      await page.getByTestId('password-input').fill('wrongpassword')

      // ログインボタンをクリック
      await page.getByTestId('login-button').click()

      // エラーメッセージが表示されることを確認
      await expect(page.getByTestId('login-error')).toBeVisible({ timeout: 10000 })
    })

    test('空のフォームでバリデーションエラーが表示される', async ({ page }) => {
      await page.goto('/login')
      await waitForPageLoad(page)

      // 空のまま送信
      await page.getByTestId('login-button').click()

      // バリデーションエラーが表示される（HTML5バリデーション or Zodバリデーション）
      // メールフィールドにフォーカスされる（HTML5の場合）か、エラーメッセージが表示される
      const emailInput = page.getByTestId('email-input')
      const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage)

      // HTML5バリデーションまたはカスタムエラーが動作していることを確認
      expect(validationMessage.length > 0 || await page.getByTestId('email-error').isVisible().catch(() => false)).toBeTruthy()
    })
  })

  test.describe('保護されたルート', () => {
    // 各テスト前にcookie/storageを初期化して未ログイン状態を確保
    test.beforeEach(async ({ context }) => {
      await context.clearCookies()
      // localStorageとsessionStorageもクリア
      await context.addInitScript(() => {
        localStorage.clear()
        sessionStorage.clear()
      })
    })

    test('未認証ユーザーがダッシュボードにアクセスするとリダイレクトされる', async ({ request }) => {
      // HTTP APIを使って直接リクエストを送信（リダイレクトを追跡しない）
      const response = await request.get('http://localhost:3000/', {
        maxRedirects: 0,  // リダイレクトを追跡しない
        failOnStatusCode: false,  // ステータスコードエラーを無視
      })

      // ステータスコードがリダイレクト（307 or 302）であることを確認
      const status = response.status()
      expect([307, 302, 303]).toContain(status)

      // Locationヘッダーがloginを含むことを確認
      const location = response.headers()['location']
      expect(location).toMatch(/\/login/)
    })

    test('未認証ユーザーがマニュアルページにアクセスするとリダイレクトされる', async ({ request }) => {
      // HTTP APIを使って直接リクエストを送信
      const response = await request.get('http://localhost:3000/manual/test-manual-id', {
        maxRedirects: 0,
        failOnStatusCode: false,
      })

      // ステータスコードがリダイレクトであることを確認
      const status = response.status()
      expect([307, 302, 303]).toContain(status)

      // Locationヘッダーがloginを含むことを確認
      const location = response.headers()['location']
      expect(location).toMatch(/\/login/)
    })
  })
})
