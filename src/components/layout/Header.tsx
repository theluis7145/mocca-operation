'use client'

import Link from 'next/link'
import { MessageCircle, Bell, PanelLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BusinessSwitcher } from './BusinessSwitcher'
import { HamburgerMenu } from './HamburgerMenu'
import { SearchButton } from './SearchDialog'
import { useUserStore } from '@/stores/useUserStore'
import { useBusinessStore } from '@/stores/useBusinessStore'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'

interface HeaderProps {
  unreadNotificationCount?: number
  showNotificationBubble?: boolean
}

// テーマカラーからグラデーションスタイルを生成
function getGradientStyle(themeColors: string[] | undefined | null): React.CSSProperties {
  if (!themeColors || themeColors.length === 0) {
    return {}
  }

  if (themeColors.length === 1) {
    return { backgroundColor: themeColors[0] }
  }

  // 2色以上の場合はグラデーション
  const gradient = `linear-gradient(to right, ${themeColors.join(', ')})`
  return { background: gradient }
}

export function Header({
  unreadNotificationCount = 0,
  showNotificationBubble = false,
}: HeaderProps) {
  const { setMobileSidebarOpen } = useUserStore()
  const { selectedBusiness } = useBusinessStore()

  // テーマカラーからスタイルを生成
  const headerStyle = useMemo(() => {
    return getGradientStyle(selectedBusiness?.themeColors)
  }, [selectedBusiness?.themeColors])

  const hasThemeColor = selectedBusiness?.themeColors && selectedBusiness.themeColors.length > 0

  return (
    <header
      className={cn(
        'sticky top-0 z-30 border-b backdrop-blur',
        hasThemeColor ? 'text-white border-white/20' : 'bg-background/95 supports-[backdrop-filter]:bg-background/60'
      )}
      style={headerStyle}
    >
      <div className="flex h-14 items-center justify-between px-4">
        {/* 左側: モバイルメニューボタン + 事業切り替え */}
        <div className="flex items-center gap-2">
          {/* モバイルメニューボタン（md以下で表示） */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'md:hidden',
              hasThemeColor && 'text-white hover:bg-white/20'
            )}
            onClick={() => setMobileSidebarOpen(true)}
          >
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">メニューを開く</span>
          </Button>
          <BusinessSwitcher hasThemeColor={hasThemeColor} />
        </div>

        {/* 右側: 検索 + 通知バブル + 通知ベル + ハンバーガーメニュー */}
        <div className="flex items-center gap-2">
          {/* 検索ボタン */}
          <SearchButton hasThemeColor={hasThemeColor} />

          {/* 新しいお知らせがある場合のバブル */}
          {showNotificationBubble && unreadNotificationCount > 0 && (
            <Link href="/notifications" className="hidden sm:block">
              <div
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5',
                  'rounded-full text-sm animate-pulse transition-colors',
                  hasThemeColor
                    ? 'bg-white/20 text-white hover:bg-white/30'
                    : 'bg-primary/10 text-primary hover:bg-primary/20'
                )}
              >
                <MessageCircle className="h-4 w-4" />
                <span>新しいお知らせがあります</span>
              </div>
            </Link>
          )}

          {/* 通知ベル */}
          <Link href="/notifications">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'relative',
                hasThemeColor && 'text-white hover:bg-white/20'
              )}
            >
              <Bell className="h-5 w-5" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center">
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </span>
              )}
              <span className="sr-only">お知らせ</span>
            </Button>
          </Link>

          {/* ハンバーガーメニュー */}
          <HamburgerMenu unreadNotificationCount={unreadNotificationCount} hasThemeColor={hasThemeColor} />
        </div>
      </div>
    </header>
  )
}
