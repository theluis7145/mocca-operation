'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Book, CheckCircle, Camera, MessageSquare, Bell, Settings, LogIn, Home, FileText, Play, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function WorkerManualPage() {
  const router = useRouter()

  const sections = [
    { id: 'login', title: '1. ログイン', icon: LogIn },
    { id: 'dashboard', title: '2. ダッシュボード', icon: Home },
    { id: 'manual-view', title: '3. マニュアルの閲覧', icon: FileText },
    { id: 'work-session', title: '4. 作業の開始', icon: Play },
    { id: 'checkpoint', title: '5. チェックポイント', icon: CheckCircle },
    { id: 'photo-record', title: '6. 写真記録', icon: Camera },
    { id: 'note', title: '7. 申し送りメモ', icon: MessageSquare },
    { id: 'complete', title: '8. 作業の完了', icon: Square },
    { id: 'notification', title: '9. お知らせ', icon: Bell },
    { id: 'settings', title: '10. 設定', icon: Settings },
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
            <Book className="h-5 w-5 text-blue-500" />
            <h1 className="text-lg font-semibold">作業者マニュアル</h1>
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
            {/* 1. ログイン */}
            <section id="login" className="scroll-mt-20">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <LogIn className="h-5 w-5 text-blue-500" />
                1. ログイン
              </h2>
              <div className="space-y-4 text-sm md:text-base">
                <p>
                  システムにアクセスするには、管理者から発行されたメールアドレスとパスワードでログインします。
                </p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">ログイン手順:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>ログイン画面でメールアドレスを入力</li>
                    <li>パスワードを入力</li>
                    <li>「ログイン」ボタンをタップ</li>
                  </ol>
                </div>
                <p className="text-muted-foreground">
                  パスワードを忘れた場合は、管理者にお問い合わせください。
                </p>
              </div>
            </section>

            <Separator />

            {/* 2. ダッシュボード */}
            <section id="dashboard" className="scroll-mt-20">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Home className="h-5 w-5 text-blue-500" />
                2. ダッシュボード
              </h2>
              <div className="space-y-4 text-sm md:text-base">
                <p>
                  ログイン後、ダッシュボード（ホーム画面）が表示されます。
                  ここには、あなたがアクセスできる事業の一覧が表示されます。
                </p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">画面の見方:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>各カードが1つの事業を表しています</li>
                    <li>カードをタップすると、その事業のマニュアル一覧に移動します</li>
                    <li>右上のメニューボタンから各種設定にアクセスできます</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            {/* 3. マニュアルの閲覧 */}
            <section id="manual-view" className="scroll-mt-20">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                3. マニュアルの閲覧
              </h2>
              <div className="space-y-4 text-sm md:text-base">
                <p>
                  事業を選択すると、その事業のマニュアル一覧が表示されます。
                  マニュアルをタップすると内容を確認できます。
                </p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">マニュアル一覧の機能:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>ジャンルで絞り込み: 上部のフィルターで特定のジャンルのマニュアルのみ表示</li>
                    <li>公開済みのマニュアルのみ表示されます（下書きは管理者のみ）</li>
                  </ul>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">マニュアルの構成要素:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li><strong>テキスト:</strong> 作業の説明文</li>
                    <li><strong>画像/動画:</strong> 作業の手順を視覚的に説明</li>
                    <li><strong>注意:</strong> 特に気をつけるべきポイント（黄色の背景）</li>
                    <li><strong>チェックポイント:</strong> 確認が必要な項目</li>
                    <li><strong>写真記録:</strong> 作業中に写真撮影が必要な箇所</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            {/* 4. 作業の開始 */}
            <section id="work-session" className="scroll-mt-20">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Play className="h-5 w-5 text-blue-500" />
                4. 作業の開始
              </h2>
              <div className="space-y-4 text-sm md:text-base">
                <p>
                  マニュアルを見ながら実際に作業を行う場合は、「作業開始」ボタンをタップして作業セッションを開始します。
                </p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">作業セッションの開始方法:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>マニュアルの詳細画面を開く</li>
                    <li>画面上部の「作業開始」ボタンをタップ</li>
                    <li>作業モードに切り替わり、チェックや写真撮影が可能になります</li>
                  </ol>
                </div>
                <p className="text-muted-foreground">
                  作業セッションを開始すると、チェックポイントのチェックや写真記録の撮影が有効になります。
                  作業の進捗は自動的に保存されます。
                </p>
              </div>
            </section>

            <Separator />

            {/* 5. チェックポイント */}
            <section id="checkpoint" className="scroll-mt-20">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-500" />
                5. チェックポイント
              </h2>
              <div className="space-y-4 text-sm md:text-base">
                <p>
                  チェックポイントは、作業中に確認すべき項目です。
                  作業セッション中にチェックを入れることで、確認漏れを防ぎます。
                </p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">チェックの入れ方:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>作業セッションを開始した状態でマニュアルを表示</li>
                    <li>チェックポイントの各項目の左にあるチェックボックスをタップ</li>
                    <li>チェックが入ると緑色のチェックマークが表示されます</li>
                  </ol>
                </div>
                <p className="text-muted-foreground">
                  すべてのチェックポイントにチェックを入れてから作業を完了することを推奨します。
                </p>
              </div>
            </section>

            <Separator />

            {/* 6. 写真記録 */}
            <section id="photo-record" className="scroll-mt-20">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Camera className="h-5 w-5 text-blue-500" />
                6. 写真記録
              </h2>
              <div className="space-y-4 text-sm md:text-base">
                <p>
                  写真記録ブロックでは、作業中にスマートフォンのカメラで写真を撮影できます。
                  撮影した写真は作業セッションに紐づけて保存されます。
                </p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">写真の撮影方法:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>作業セッションを開始した状態で写真記録ブロックを表示</li>
                    <li>「写真を撮影」ボタンをタップ</li>
                    <li>カメラが起動するので、対象を撮影</li>
                    <li>撮影後、写真がブロック内に表示されます</li>
                  </ol>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm">
                    <strong>注意:</strong> 写真記録は作業の証跡として保存されます。
                    必要な箇所では必ず撮影を行ってください。
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* 7. 申し送りメモ */}
            <section id="note" className="scroll-mt-20">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                7. 申し送りメモ
              </h2>
              <div className="space-y-4 text-sm md:text-base">
                <p>
                  作業中に気づいたことや次の担当者への申し送り事項を、各ステップにメモとして残すことができます。
                </p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">メモの入力方法:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>作業セッション中、各ブロックの下にあるメモ入力欄をタップ</li>
                    <li>メモの内容を入力</li>
                    <li>必要に応じて写真を添付</li>
                    <li>入力内容は自動保存されます</li>
                  </ol>
                </div>
                <p className="text-muted-foreground">
                  メモは作業完了後のレポートに含まれ、管理者も確認できます。
                </p>
              </div>
            </section>

            <Separator />

            {/* 8. 作業の完了 */}
            <section id="complete" className="scroll-mt-20">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Square className="h-5 w-5 text-blue-500" />
                8. 作業の完了
              </h2>
              <div className="space-y-4 text-sm md:text-base">
                <p>
                  すべての作業が終わったら、作業セッションを完了させます。
                </p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">作業完了の手順:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>すべてのチェックポイントを確認</li>
                    <li>必要な写真記録をすべて撮影</li>
                    <li>画面上部の「作業完了」ボタンをタップ</li>
                    <li>確認ダイアログで「完了」をタップ</li>
                  </ol>
                </div>
                <p className="text-muted-foreground">
                  作業完了後は、作業レポートとして記録が保存されます。
                  管理者はこのレポートを確認できます。
                </p>
              </div>
            </section>

            <Separator />

            {/* 9. お知らせ */}
            <section id="notification" className="scroll-mt-20">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-500" />
                9. お知らせ
              </h2>
              <div className="space-y-4 text-sm md:text-base">
                <p>
                  システムからの通知やお知らせは、メニューの「お知らせ」から確認できます。
                </p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">お知らせの種類:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>作業完了通知: 他のユーザーの作業完了のお知らせ</li>
                    <li>公開メモ: 他のユーザーが共有したメモ</li>
                  </ul>
                </div>
                <p className="text-muted-foreground">
                  未読のお知らせがある場合、メニューボタンに赤いバッジが表示されます。
                </p>
              </div>
            </section>

            <Separator />

            {/* 10. 設定 */}
            <section id="settings" className="scroll-mt-20">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-500" />
                10. 設定
              </h2>
              <div className="space-y-4 text-sm md:text-base">
                <p>
                  メニューから各種設定を変更できます。
                </p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">変更できる設定:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li><strong>文字サイズ:</strong> 小・中・大から選択（メニュー内で即座に変更可能）</li>
                    <li><strong>名前:</strong> 表示名の変更</li>
                    <li><strong>パスワード:</strong> ログインパスワードの変更</li>
                  </ul>
                </div>
                <p className="text-muted-foreground">
                  設定画面へは、メニューの「設定」からアクセスできます。
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
