'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Book, ShieldCheck, Crown, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HelpPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const isSuperAdmin = session?.user?.isSuperAdmin ?? false

  // 全ユーザーがアクセスできるマニュアル
  const manuals = [
    {
      title: '作業者マニュアル',
      description: 'マニュアルの閲覧、作業セッションの開始・完了、写真記録の撮影など、基本的な使い方を説明します。',
      href: '/help/worker',
      icon: Book,
      color: 'bg-blue-500',
      available: true,
    },
    {
      title: '管理者マニュアル',
      description: 'マニュアルの作成・編集、メンバー管理、作業統計の確認など、管理者向けの機能を説明します。',
      href: '/help/admin',
      icon: ShieldCheck,
      color: 'bg-green-500',
      available: true, // 管理者以上でなくても見られるようにする（教育目的）
    },
    {
      title: 'スーパー管理者マニュアル',
      description: '事業の作成・管理、ユーザーの作成・管理など、システム全体の管理機能を説明します。',
      href: '/help/super-admin',
      icon: Crown,
      color: 'bg-purple-500',
      available: isSuperAdmin,
    },
  ]

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">ヘルプ</h1>
          <p className="text-muted-foreground">
            Mocca Operation の使い方を確認できます。役割に応じたマニュアルをご覧ください。
          </p>
        </div>

        <div className="grid gap-4 md:gap-6">
          {manuals.filter(m => m.available).map((manual) => (
            <Card
              key={manual.href}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(manual.href)}
            >
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className={`p-3 rounded-lg ${manual.color}`}>
                  <manual.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg md:text-xl">{manual.title}</CardTitle>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm md:text-base">
                  {manual.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <h2 className="font-semibold mb-2">お困りの場合</h2>
          <p className="text-sm text-muted-foreground">
            上記のマニュアルで解決しない問題がある場合は、システム管理者にお問い合わせください。
          </p>
        </div>
      </div>
    </div>
  )
}
