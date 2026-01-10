'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Menu, Bell, Settings, LogOut, Type, Users, Building2, BarChart3 } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useUserStore, fontSizeConfig } from '@/stores/useUserStore'
import { useBusinessStore } from '@/stores/useBusinessStore'
import type { FontSize } from '@prisma/client'
import { cn } from '@/lib/utils'

interface HamburgerMenuProps {
  unreadNotificationCount?: number
  hasThemeColor?: boolean
}

export function HamburgerMenu({ unreadNotificationCount = 0, hasThemeColor = false }: HamburgerMenuProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const { fontSize, setFontSize } = useUserStore()
  const { selectedBusiness } = useBusinessStore()

  // 管理者かどうか（スーパー管理者またはこの事業の管理者）
  const isAdmin = session?.user?.isSuperAdmin

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const handleFontSizeChange = async (newSize: FontSize) => {
    setFontSize(newSize)

    // サーバーに保存（オプション）
    try {
      await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fontSize: newSize }),
      })
    } catch (error) {
      console.error('Failed to save font size:', error)
    }
  }

  const userInitials = session?.user?.name
    ? session.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??'

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'relative',
            hasThemeColor && 'text-white hover:bg-white/20'
          )}
        >
          <Menu className="h-5 w-5" />
          {unreadNotificationCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center">
              {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
            </span>
          )}
          <span className="sr-only">メニューを開く</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle>メニュー</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* ユーザー情報 */}
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{session?.user?.name}</p>
              <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
            </div>
          </div>

          <Separator />

          {/* お知らせ */}
          <button
            className="w-full flex items-center justify-between py-2 hover:bg-accent rounded-lg px-2 transition-colors"
            onClick={() => {
              setOpen(false)
              router.push('/notifications')
            }}
          >
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5" />
              <span>お知らせ</span>
            </div>
            {unreadNotificationCount > 0 && (
              <Badge variant="destructive">{unreadNotificationCount}</Badge>
            )}
          </button>

          {/* 管理者メニュー（スーパー管理者のみ） */}
          {session?.user?.isSuperAdmin && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground px-2 mb-2">管理者メニュー</p>
                <button
                  className="w-full flex items-center gap-3 py-2 hover:bg-accent rounded-lg px-2 transition-colors"
                  onClick={() => {
                    setOpen(false)
                    router.push('/admin/users')
                  }}
                >
                  <Users className="h-5 w-5" />
                  <span>ユーザー管理</span>
                </button>
                <button
                  className="w-full flex items-center gap-3 py-2 hover:bg-accent rounded-lg px-2 transition-colors"
                  onClick={() => {
                    setOpen(false)
                    router.push('/admin/businesses')
                  }}
                >
                  <Building2 className="h-5 w-5" />
                  <span>事業管理</span>
                </button>
                <button
                  className="w-full flex items-center gap-3 py-2 hover:bg-accent rounded-lg px-2 transition-colors"
                  onClick={() => {
                    setOpen(false)
                    router.push('/analytics')
                  }}
                >
                  <BarChart3 className="h-5 w-5" />
                  <span>作業統計</span>
                </button>
              </div>
            </>
          )}

          <Separator />

          {/* 文字サイズ設定 */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-2">
              <Type className="h-5 w-5" />
              <span>文字サイズ</span>
            </div>
            <div className="flex gap-2 px-2">
              {(Object.entries(fontSizeConfig) as [FontSize, { label: string; className: string }][]).map(
                ([size, config]) => (
                  <Button
                    key={size}
                    variant={fontSize === size ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleFontSizeChange(size)}
                    className={cn('flex-1', fontSize === size && 'font-bold')}
                  >
                    {config.label}
                  </Button>
                )
              )}
            </div>
          </div>

          <Separator />

          {/* 設定 */}
          <button
            className="w-full flex items-center gap-3 py-2 hover:bg-accent rounded-lg px-2 transition-colors"
            onClick={() => {
              setOpen(false)
              router.push('/settings')
            }}
          >
            <Settings className="h-5 w-5" />
            <span>設定</span>
          </button>

          {/* ログアウト */}
          <button
            className="w-full flex items-center gap-3 py-2 hover:bg-accent rounded-lg px-2 transition-colors text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            <span>ログアウト</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
