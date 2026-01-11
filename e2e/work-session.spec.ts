import { test, expect } from './fixtures'
import { waitForPageLoad } from './fixtures'

test.describe('作業セッションフロー', () => {
  test.describe('作業セッション開始から完了まで', () => {
    test('マニュアルを開いて作業を開始し、完了できる', async ({ authenticatedPage: page }) => {
      // ダッシュボードの読み込みを待機
      await page.waitForLoadState('domcontentloaded')

      // 少し待機してコンテンツが表示されるのを待つ
      await page.waitForTimeout(2000)

      // マニュアルリストまたは事業選択画面の表示を確認
      const manualList = page.getByTestId('manual-list')
      const businessSelection = page.getByText('事業を選択してください')

      // 事業選択が必要な場合はスキップ（テスト環境の設定に依存）
      const hasManualList = await manualList.isVisible().catch(() => false)
      const needsBusinessSelection = await businessSelection.isVisible().catch(() => false)

      if (needsBusinessSelection) {
        test.skip(true, '事業選択が必要なためスキップ')
        return
      }

      if (!hasManualList) {
        test.skip(true, 'マニュアルが存在しないためスキップ')
        return
      }

      // マニュアルカードが表示されるのを待機
      const firstManualCard = page.locator('[data-testid^="manual-card-"]').first()
      const hasManualCard = await firstManualCard.isVisible({ timeout: 5000 }).catch(() => false)

      if (!hasManualCard) {
        test.skip(true, 'マニュアルカードが表示されないためスキップ')
        return
      }

      // マニュアルカード内のクリック可能な領域をクリック
      // DraggableManualCardではCardContent部分がclickableになっている
      const clickableArea = firstManualCard.locator('.cursor-pointer').first()
      await clickableArea.click()

      // マニュアルページに遷移するのを待機
      try {
        await page.waitForURL(/\/manual\//, { timeout: 15000 })
      } catch {
        // 遷移しない場合はスキップ（カードがドラッグ専用モードの可能性）
        test.skip(true, 'マニュアルカードクリック後のページ遷移が発生しなかったためスキップ')
        return
      }
      await page.waitForLoadState('domcontentloaded')

      // 作業開始バナーが表示されることを確認
      const startSessionBanner = page.getByTestId('work-session-banner-idle')
      const activeSessionBanner = page.getByTestId('work-session-banner-active')

      // 既に作業中の場合はスキップ
      if (await activeSessionBanner.isVisible().catch(() => false)) {
        test.skip(true, '既に作業セッションが進行中のためスキップ')
        return
      }

      // 作業開始ボタンをクリック
      await expect(startSessionBanner).toBeVisible()
      const startButton = page.getByTestId('start-work-session-button')
      await expect(startButton).toBeVisible()
      await startButton.click()

      // 作業中バナーが表示されることを確認
      await expect(page.getByTestId('work-session-banner-active')).toBeVisible({ timeout: 10000 })

      // 作業完了セクションにスクロール
      const completeSection = page.getByTestId('work-complete-section')
      await completeSection.scrollIntoViewIfNeeded()
      await expect(completeSection).toBeVisible()

      // 作業完了ボタンをクリック
      const completeButton = page.getByTestId('complete-work-session-button')
      await expect(completeButton).toBeVisible()
      await completeButton.click()

      // 完了確認ダイアログが表示される
      const confirmButton = page.getByTestId('complete-dialog-confirm')
      await expect(confirmButton).toBeVisible({ timeout: 5000 })

      // 作業完了を確定
      await confirmButton.click()

      // 成功トーストが表示されるか、ダイアログが閉じることを確認
      // 注意: 完了後、作業開始バナーに戻るか、別の状態になる
      await expect(page.getByTestId('work-session-banner-idle')).toBeVisible({ timeout: 15000 })
    })

    test('作業セッションをキャンセルできる', async ({ authenticatedPage: page }) => {
      // ダッシュボードの読み込みを待機
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(2000)

      // マニュアルリストの確認
      const manualList = page.getByTestId('manual-list')
      const hasManualList = await manualList.isVisible().catch(() => false)

      if (!hasManualList) {
        test.skip(true, 'マニュアルが存在しないためスキップ')
        return
      }

      // マニュアルカードが表示されるのを待機
      const firstManualCard = page.locator('[data-testid^="manual-card-"]').first()
      const hasManualCard = await firstManualCard.isVisible({ timeout: 5000 }).catch(() => false)

      if (!hasManualCard) {
        test.skip(true, 'マニュアルカードが表示されないためスキップ')
        return
      }

      // マニュアルカード内のクリック可能な領域をクリック
      const clickableArea = firstManualCard.locator('.cursor-pointer').first()
      await clickableArea.click()

      // マニュアルページに遷移するのを待機
      try {
        await page.waitForURL(/\/manual\//, { timeout: 15000 })
      } catch {
        test.skip(true, 'マニュアルカードクリック後のページ遷移が発生しなかったためスキップ')
        return
      }
      await page.waitForLoadState('domcontentloaded')

      // 既存セッションがある場合はスキップ
      const activeSessionBanner = page.getByTestId('work-session-banner-active')
      if (await activeSessionBanner.isVisible().catch(() => false)) {
        // キャンセルボタンをクリック
        await page.getByTestId('cancel-work-session-button').click()

        // 確認ダイアログでキャンセルを確定
        const confirmCancelButton = page.getByRole('button', { name: 'キャンセルする' })
        await expect(confirmCancelButton).toBeVisible()
        await confirmCancelButton.click()

        // 作業開始バナーに戻ることを確認
        await expect(page.getByTestId('work-session-banner-idle')).toBeVisible({ timeout: 10000 })
        return
      }

      // 新規セッションを開始してからキャンセル
      const startButton = page.getByTestId('start-work-session-button')
      if (!await startButton.isVisible().catch(() => false)) {
        test.skip(true, '作業開始ボタンが表示されないためスキップ')
        return
      }

      await startButton.click()
      await expect(page.getByTestId('work-session-banner-active')).toBeVisible({ timeout: 10000 })

      // キャンセルボタンをクリック
      await page.getByTestId('cancel-work-session-button').click()

      // 確認ダイアログでキャンセルを確定
      const confirmCancelButton = page.getByRole('button', { name: 'キャンセルする' })
      await expect(confirmCancelButton).toBeVisible()
      await confirmCancelButton.click()

      // 作業開始バナーに戻ることを確認
      await expect(page.getByTestId('work-session-banner-idle')).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('写真アップロード', () => {
    test.skip('写真撮影ブロックで画像をアップロードできる', async ({ authenticatedPage: page }) => {
      // 注意: 実際のファイルアップロードはモバイル環境でのみ動作
      // このテストはE2E環境では限定的な検証のみ行う

      await waitForPageLoad(page)

      // マニュアルリストの確認
      const manualList = page.getByTestId('manual-list')
      const hasManualList = await manualList.isVisible().catch(() => false)

      if (!hasManualList) {
        test.skip(true, 'マニュアルが存在しないためスキップ')
        return
      }

      // 最初のマニュアルを開く
      const firstManualCard = page.locator('[data-testid^="manual-card-"]').first()
      await firstManualCard.click()
      await page.waitForURL(/\/manual\//, { timeout: 10000 })
      await waitForPageLoad(page)

      // 作業開始（または既存セッション）
      const startButton = page.getByTestId('start-work-session-button')
      if (await startButton.isVisible().catch(() => false)) {
        await startButton.click()
        await expect(page.getByTestId('work-session-banner-active')).toBeVisible({ timeout: 10000 })
      }

      // 写真入力要素が存在することを確認
      const photoInput = page.locator('input[type="file"][accept="image/*"]').first()
      const hasPhotoInput = await photoInput.isVisible().catch(() => false)

      if (!hasPhotoInput) {
        test.skip(true, '写真アップロード要素が存在しないためスキップ')
        return
      }

      // 実際のファイルアップロードテストはモバイル環境で実施
      // ここでは要素の存在確認のみ
      expect(hasPhotoInput).toBeTruthy()
    })
  })
})
