'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { ArrowLeft, Crown, Building2, Users, UserPlus, Shield, Palette, BarChart3, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

export default function SuperAdminManualPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  // スーパー管理者のみアクセス可能
  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user?.isSuperAdmin) {
      toast.error('このページへのアクセス権限がありません')
      router.push('/help')
    }
  }, [session, status, router])

  const sections = [
    { id: 'overview', title: '1. スーパー管理者の役割', icon: Crown },
    { id: 'business-create', title: '2. 事業の作成', icon: Building2 },
    { id: 'business-settings', title: '3. 事業の設定', icon: Palette },
    { id: 'user-create', title: '4. ユーザーの作成', icon: UserPlus },
    { id: 'user-manage', title: '5. ユーザーの管理', icon: Users },
    { id: 'member-manage', title: '6. メンバーの管理', icon: Shield },
    { id: 'analytics', title: '7. 作業統計', icon: BarChart3 },
    { id: 'system-settings', title: '8. システム設定', icon: Settings },
  ]

  if (status === 'loading' || !session?.user?.isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

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
            <Crown className="h-5 w-5 text-purple-500" />
            <h1 className="text-lg font-semibold">スーパー管理者マニュアル</h1>
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
            {/* 1. スーパー管理者の役割 */}
            <section id="overview" className="scroll-mt-20">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Crown className="h-5 w-5 text-purple-500" />
                1. スーパー管理者の役割
              </h2>
              <div className="space-y-4 text-sm md:text-base">
                <p>
                  スーパー管理者は、システム全体を管理する最上位の権限を持つユーザーです。
                  すべての事業、ユーザー、マニュアルにアクセスできます。
                </p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">スーパー管理者ができること:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>事業の作成・編集・削除</li>
                    <li>ユーザーの作成・編集・削除</li>
                    <li>事業へのメンバー追加・権限変更</li>
                    <li>すべての事業のマニュアル管理</li>
                    <li>作業統計の確認</li>
                    <li>管理者・作業者と同じすべての機能</li>
                  </ul>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm">
                    <strong>注意:</strong> スーパー管理者権限は強力なため、信頼できるユーザーにのみ付与してください。
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* 2. 事業の作成 */}
            <section id="business-create" className="scroll-mt-20">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-purple-500" />
                2. 事業の作成
              </h2>
              <div className="space-y-4 text-sm md:text-base">
                <p>
                  新しい事業を作成して、マニュアルやメンバーを管理できるようにします。
                </p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">事業の作成手順:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>メニューから「事業管理」をタップ</li>
                    <li>「新規事業」ボタンをタップ</li>
                    <li>事業名を入力</li>
                    <li>表示名（1行目・2行目）を入力</li>
                    <li>アイコン（絵文字）を選択</li>
                    <li>テーマカラーを設定</li>
                    <li>「作成」ボタンをタップ</li>
                  </ol>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">入力項目の説明:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li><strong>事業名:</strong> システム内部での識別名</li>
                    <li><strong>表示名1行目:</strong> カードの上部に表示される小さいテキスト</li>
                    <li><strong>表示名2行目:</strong> カードのメインタイトル</li>
                    <li><strong>アイコン:</strong> 事業を視覚的に識別する絵文字</li>
                    <li><strong>テーマカラー:</strong> カードの背景グラデーション（最大3色）</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            {/* 3. 事業の設定 */}
            <section id="business-settings" className="scroll-mt-20">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Palette className="h-5 w-5 text-purple-500" />
                3. 事業の設定
              </h2>
              <div className="space-y-4 text-sm md:text-base">
                <p>
                  作成済みの事業の情報を編集できます。
                </p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">編集方法:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>メニューから「事業管理」をタップ</li>
                    <li>編集したい事業の「編集」ボタンをタップ</li>
                    <li>必要な情報を変更</li>
                    <li>「保存」ボタンをタップ</li>
                  </ol>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">テーマカラーの設定:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>1〜3色のグラデーションを設定可能</li>
                    <li>カラーピッカーまたは16進数で指定</li>
                    <li>ダッシュボードのカード背景に反映されます</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            {/* 4. ユーザーの作成 */}
            <section id="user-create" className="scroll-mt-20">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-purple-500" />
                4. ユーザーの作成
              </h2>
              <div className="space-y-4 text-sm md:text-base">
                <p>
                  システムを利用する新しいユーザーを作成します。
                </p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">ユーザー作成手順:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>メニューから「ユーザー管理」をタップ</li>
                    <li>「新規ユーザー」ボタンをタップ</li>
                    <li>メールアドレスを入力（ログインIDになります）</li>
                    <li>名前を入力</li>
                    <li>パスワードを設定</li>
                    <li>必要に応じてスーパー管理者権限を付与</li>
                    <li>「作成」ボタンをタップ</li>
                  </ol>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm">
                    <strong>ヒント:</strong> ユーザー作成後、事業のメンバーに追加することで、
                    そのユーザーが事業にアクセスできるようになります。
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* 5. ユーザーの管理 */}
            <section id="user-manage" className="scroll-mt-20">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                5. ユーザーの管理
              </h2>
              <div className="space-y-4 text-sm md:text-base">
                <p>
                  既存ユーザーの情報を編集したり、無効化・削除ができます。
                </p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">ユーザー編集:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>メニューから「ユーザー管理」をタップ</li>
                    <li>編集したいユーザーの行をタップ</li>
                    <li>情報を変更して「保存」をタップ</li>
                  </ol>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">変更できる情報:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li><strong>名前:</strong> 表示名の変更</li>
                    <li><strong>パスワード:</strong> ログインパスワードの再設定</li>
                    <li><strong>スーパー管理者:</strong> 権限の付与・剥奪</li>
                    <li><strong>有効/無効:</strong> アカウントの有効化・無効化</li>
                    <li><strong>所属事業:</strong> アクセスできる事業と権限</li>
                  </ul>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm">
                    <strong>注意:</strong> ユーザーを無効化すると、そのユーザーはログインできなくなります。
                    退職者のアカウントなどは、削除ではなく無効化することを推奨します。
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* 6. メンバーの管理 */}
            <section id="member-manage" className="scroll-mt-20">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-500" />
                6. メンバーの管理
              </h2>
              <div className="space-y-4 text-sm md:text-base">
                <p>
                  各事業にユーザーを追加し、権限（管理者/作業者）を設定します。
                </p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">メンバー追加手順:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>メニューから「事業管理」をタップ</li>
                    <li>対象の事業の「メンバー」ボタンをタップ</li>
                    <li>「メンバーを追加」ボタンをタップ</li>
                    <li>追加するユーザーを選択</li>
                    <li>権限（管理者/作業者）を選択</li>
                    <li>「追加」ボタンをタップ</li>
                  </ol>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">権限の違い:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li><strong>管理者（ADMIN）:</strong> マニュアルの作成・編集が可能</li>
                    <li><strong>作業者（WORKER）:</strong> マニュアルの閲覧・作業実行のみ</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            {/* 7. 作業統計 */}
            <section id="analytics" className="scroll-mt-20">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                7. 作業統計
              </h2>
              <div className="space-y-4 text-sm md:text-base">
                <p>
                  すべての事業の作業セッション履歴を確認できます。
                </p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">アクセス方法:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>メニューから「作業統計」をタップ</li>
                    <li>事業やユーザーで絞り込み可能</li>
                  </ol>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">確認できる情報:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>作業セッション一覧（日時、実行者、マニュアル）</li>
                    <li>セッションの詳細（チェック状況、写真、メモ）</li>
                    <li>事業別・ユーザー別の集計</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            {/* 8. システム設定 */}
            <section id="system-settings" className="scroll-mt-20">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5 text-purple-500" />
                8. システム設定
              </h2>
              <div className="space-y-4 text-sm md:text-base">
                <p>
                  システム全体に関わる設定を行います。
                </p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-medium">現在利用可能な設定:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>事業の並び順変更（ドラッグ&ドロップ）</li>
                    <li>事業の有効/無効化</li>
                  </ul>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm">
                    <strong>ヒント:</strong> 事業を無効化すると、その事業はダッシュボードに表示されなくなります。
                    マニュアルやデータは保持されます。
                  </p>
                </div>
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
