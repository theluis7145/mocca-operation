'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, ShieldCheck, Plus, Edit, Image as ImageIcon, AlertTriangle, CheckSquare, Camera, Archive, BarChart3, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function AdminManualPage() {
  const router = useRouter()

  const sections = [
    { id: 'overview', title: '1. 管理者の役割', icon: ShieldCheck },
    { id: 'create-manual', title: '2. マニュアルの作成', icon: Plus },
    { id: 'edit-manual', title: '3. マニュアルの編集', icon: Edit },
    { id: 'block-text', title: '4. テキストブロック', icon: Edit },
    { id: 'block-image', title: '5. 画像・動画ブロック', icon: ImageIcon },
    { id: 'block-warning', title: '6. 注意ブロック', icon: AlertTriangle },
    { id: 'block-checkpoint', title: '7. チェックポイント', icon: CheckSquare },
    { id: 'block-photo', title: '8. 写真記録ブロック', icon: Camera },
    { id: 'block-order', title: '9. ブロックの並べ替え', icon: GripVertical },
    { id: 'publish', title: '10. 公開と下書き', icon: Edit },
    { id: 'archive', title: '11. アーカイブ', icon: Archive },
    { id: 'analytics', title: '12. 作業統計', icon: BarChart3 },
  ]

  return (
    <div className="min-h-full">
      {/* ヘッダー */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="px-4 md:px-6 py-3 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/help')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">ヘルプに戻る</span>
          </Button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-500" />
            <h1 className="text-lg font-semibold">管理者マニュアル</h1>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* 目次 */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">目次</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors"
                  >
                    <section.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{section.title}</span>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 本文 */}
          <div className="space-y-8">
            {/* 1. 管理者の役割 */}
            <section id="overview" className="scroll-mt-20">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-green-500" />
                1. 管理者の役割
              </h2>
              <div className="space-y-4 text-sm md:text-base">
                <p>
                  管理者（ADMIN）は、担当する事業内でマニュアルの作成・編集・管理を行うことができます。
                </p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">管理者ができること:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>マニュアルの作成・編集・削除</li>
                    <li>マニュアルの公開・非公開設定</li>
                    <li>マニュアルの並べ替え</li>
                    <li>マニュアルのアーカイブ</li>
                    <li>作業統計の確認</li>
                    <li>作業者と同じ機能（マニュアル閲覧、作業実行など）</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            {/* 2. マニュアルの作成 */}
            <section id="create-manual" className="scroll-mt-20">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Plus className="h-5 w-5 text-green-500" />
                2. マニュアルの作成
              </h2>
              <div className="space-y-4 text-sm md:text-base">
                <p>
                  新しいマニュアルを作成するには、事業のマニュアル一覧画面から「新規マニュアル」ボタンをタップします。
                </p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">作成手順:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>事業のマニュアル一覧画面を開く</li>
                    <li>右上の「新規マニュアル」（または「新規」）ボタンをタップ</li>
                    <li>タイトルを入力（必須）</li>
                    <li>ジャンルを入力または選択（任意）</li>
                    <li>説明を入力（任意）</li>
                    <li>「作成して編集」ボタンをタップ</li>
                  </ol>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm">
                    <strong>ヒント:</strong> ジャンルを設定すると、マニュアル一覧でジャンル別に絞り込みができるようになります。
                    既存のジャンルはボタンで簡単に選択できます。
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* 3. マニュアルの編集 */}
            <section id="edit-manual" className="scroll-mt-20">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Edit className="h-5 w-5 text-green-500" />
                3. マニュアルの編集
              </h2>
              <div className="space-y-4 text-sm md:text-base">
                <p>
                  マニュアルの編集画面では、タイトル・説明の変更やブロック（手順）の追加・編集ができます。
                </p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">編集画面へのアクセス:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>編集したいマニュアルを開く</li>
                    <li>右上の「編集」ボタンをタップ</li>
                    <li>または、マニュアル一覧でカードの編集アイコンをタップ</li>
                  </ol>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">編集画面の構成:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li><strong>ヘッダー:</strong> タイトル、ジャンル、説明の編集</li>
                    <li><strong>ブロックエリア:</strong> 各手順のブロックを編集</li>
                    <li><strong>ブロック追加:</strong> 画面下部の「+」ボタンでブロックを追加</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            {/* 4. テキストブロック */}
            <section id="block-text" className="scroll-mt-20">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Edit className="h-5 w-5 text-green-500" />
                4. テキストブロック
              </h2>
              <div className="space-y-4 text-sm md:text-base">
                <p>
                  テキストブロックは、作業手順の説明文を記載するための基本的なブロックです。
                </p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">テキストブロックの追加:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>ブロック追加ボタン（+）をタップ</li>
                    <li>「テキスト」を選択</li>
                    <li>テキストエリアに説明文を入力</li>
                    <li>変更は自動保存されます</li>
                  </ol>
                </div>
              </div>
            </section>

            <Separator />

            {/* 5. 画像・動画ブロック */}
            <section id="block-image" className="scroll-mt-20">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-green-500" />
                5. 画像・動画ブロック
              </h2>
              <div className="space-y-4 text-sm md:text-base">
                <p>
                  画像や動画を使って、作業手順を視覚的に説明できます。
                </p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">画像ブロックの追加:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>ブロック追加ボタン（+）をタップ</li>
                    <li>「画像」を選択</li>
                    <li>画像をアップロードまたはURLを入力</li>
                    <li>キャプション（説明文）を入力（任意）</li>
                  </ol>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">動画ブロックの追加:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>ブロック追加ボタン（+）をタップ</li>
                    <li>「動画」を選択</li>
                    <li>YouTube、Vimeo等のURLを入力</li>
                    <li>キャプションを入力（任意）</li>
                  </ol>
                </div>
              </div>
            </section>

            <Separator />

            {/* 6. 注意ブロック */}
            <section id="block-warning" className="scroll-mt-20">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-green-500" />
                6. 注意ブロック
              </h2>
              <div className="space-y-4 text-sm md:text-base">
                <p>
                  注意ブロックは、特に気をつけるべきポイントを強調表示するためのブロックです。
                  黄色い背景で目立つように表示されます。
                </p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">注意ブロックの追加:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>ブロック追加ボタン（+）をタップ</li>
                    <li>「注意」を選択</li>
                    <li>注意事項のテキストを入力</li>
                  </ol>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 text-yellow-600" />
                    <span>このように黄色い背景で表示され、作業者の注意を引きます。</span>
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* 7. チェックポイントブロック */}
            <section id="block-checkpoint" className="scroll-mt-20">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-green-500" />
                7. チェックポイントブロック
              </h2>
              <div className="space-y-4 text-sm md:text-base">
                <p>
                  チェックポイントブロックは、作業者が確認すべき項目をリスト形式で表示します。
                  作業セッション中に作業者がチェックを入れることができます。
                </p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">チェックポイントの追加:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>ブロック追加ボタン（+）をタップ</li>
                    <li>「チェックポイント」を選択</li>
                    <li>タイトルを入力（例：「確認事項」）</li>
                    <li>各チェック項目を入力</li>
                    <li>「＋」ボタンで項目を追加</li>
                  </ol>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">オプション設定:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li><strong>参考画像:</strong> チェックポイントに画像を添付可能</li>
                    <li><strong>参考動画:</strong> チェックポイントに動画を添付可能</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            {/* 8. 写真記録ブロック */}
            <section id="block-photo" className="scroll-mt-20">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Camera className="h-5 w-5 text-green-500" />
                8. 写真記録ブロック
              </h2>
              <div className="space-y-4 text-sm md:text-base">
                <p>
                  写真記録ブロックは、作業者に写真撮影を促すためのブロックです。
                  作業セッション中に作業者がスマートフォンのカメラで撮影できます。
                </p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">写真記録ブロックの追加:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>ブロック追加ボタン（+）をタップ</li>
                    <li>「写真記録」を選択</li>
                    <li>タイトルを入力（例：「作業完了写真」）</li>
                    <li>説明文を入力（任意）</li>
                  </ol>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm">
                    <strong>活用例:</strong> 作業前後の状態記録、清掃完了の確認、設備の点検記録など、
                    証跡として写真が必要な場面で使用します。
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* 9. ブロックの並べ替え */}
            <section id="block-order" className="scroll-mt-20">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <GripVertical className="h-5 w-5 text-green-500" />
                9. ブロックの並べ替え
              </h2>
              <div className="space-y-4 text-sm md:text-base">
                <p>
                  ブロックの順序はドラッグ&ドロップで自由に変更できます。
                </p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">並べ替え方法:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>ブロック左側のグリップアイコン（⠿）を長押し</li>
                    <li>移動したい位置までドラッグ</li>
                    <li>指を離すと順序が確定</li>
                    <li>順序は自動保存されます</li>
                  </ol>
                </div>
              </div>
            </section>

            <Separator />

            {/* 10. 公開と下書き */}
            <section id="publish" className="scroll-mt-20">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Edit className="h-5 w-5 text-green-500" />
                10. 公開と下書き
              </h2>
              <div className="space-y-4 text-sm md:text-base">
                <p>
                  マニュアルには「下書き」と「公開」の2つの状態があります。
                </p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">状態の違い:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li><strong>下書き:</strong> 管理者のみ閲覧・編集可能。作業者には表示されません</li>
                    <li><strong>公開:</strong> 全員が閲覧可能。作業者が作業セッションを開始できます</li>
                  </ul>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">公開方法:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>編集画面でマニュアルの内容を完成させる</li>
                    <li>ヘッダーの「公開」ボタンをタップ</li>
                    <li>確認ダイアログで「公開する」をタップ</li>
                  </ol>
                </div>
              </div>
            </section>

            <Separator />

            {/* 11. アーカイブ */}
            <section id="archive" className="scroll-mt-20">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Archive className="h-5 w-5 text-green-500" />
                11. アーカイブ
              </h2>
              <div className="space-y-4 text-sm md:text-base">
                <p>
                  使用しなくなったマニュアルはアーカイブすることで、一覧から非表示にできます。
                  アーカイブしたマニュアルは削除されず、必要に応じて復元できます。
                </p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">アーカイブ方法:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>マニュアルの編集画面を開く</li>
                    <li>メニューから「アーカイブ」を選択</li>
                    <li>確認ダイアログで「アーカイブする」をタップ</li>
                  </ol>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">アーカイブ済みマニュアルの確認:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>マニュアル一覧画面で「アーカイブ」ボタンをタップ</li>
                    <li>アーカイブ済みマニュアルの一覧が表示されます</li>
                    <li>復元したい場合は「復元」ボタンをタップ</li>
                  </ol>
                </div>
              </div>
            </section>

            <Separator />

            {/* 12. 作業統計 */}
            <section id="analytics" className="scroll-mt-20">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-500" />
                12. 作業統計
              </h2>
              <div className="space-y-4 text-sm md:text-base">
                <p>
                  作業統計では、作業セッションの実行状況を確認できます。
                </p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">確認できる情報:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>作業セッションの履歴</li>
                    <li>作業者ごとの実行回数</li>
                    <li>マニュアルごとの実行回数</li>
                    <li>写真記録の一覧</li>
                    <li>申し送りメモの一覧</li>
                  </ul>
                </div>
                <p className="text-muted-foreground">
                  メニューの「作業統計」からアクセスできます（スーパー管理者のみ）。
                </p>
              </div>
            </section>
          </div>

          {/* フッター */}
          <div className="mt-12 pt-8 border-t">
            <Button variant="outline" onClick={() => router.push('/help')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              ヘルプトップに戻る
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
