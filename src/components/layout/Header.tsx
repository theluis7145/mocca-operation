'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { MessageCircle, Bell, PanelLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BusinessSwitcher } from './BusinessSwitcher'
import { HamburgerMenu } from './HamburgerMenu'
import { SearchButton } from './SearchDialog'
import { WorkInstructionIcon } from '@/components/work-instruction/WorkInstructionIcon'
import { WorkInstructionDialog } from '@/components/work-instruction/WorkInstructionDialog'
import { useUserStore } from '@/stores/useUserStore'
import { useBusinessStore } from '@/stores/useBusinessStore'
import { cn } from '@/lib/utils'

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
  const { data: session } = useSession()
  const isSuperAdmin = session?.user?.isSuperAdmin
  const { setMobileSidebarOpen } = useUserStore()
  const { selectedBusiness } = useBusinessStore()

  // 作業指示メモのダイアログ状態
  const [workInstructionDialogOpen, setWorkInstructionDialogOpen] = useState(false)
  const [workInstructionCount, setWorkInstructionCount] = useState(0)
  const [workInstructionEnabled, setWorkInstructionEnabled] = useState(false)

  // 作業指示メモの設定と件数を取得
  useEffect(() => {
    let isMounted = true

    const fetchConfigAndCount = async () => {
      if (!selectedBusiness?.id) {
        setWorkInstructionEnabled(false)
        setWorkInstructionCount(0)
        return
      }

      try {
        // 設定を取得
        const configRes = await fetch(`/api/businesses/${selectedBusiness.id}/work-instruction-config`)
        if (configRes.ok && isMounted) {
          const configData = await configRes.json()
          setWorkInstructionEnabled(configData.isEnabled ?? false)

          // 有効な場合のみ件数を取得
          if (configData.isEnabled) {
            const countRes = await fetch(`/api/work-instruction-memos/count?businessId=${selectedBusiness.id}`)
            if (countRes.ok && isMounted) {
              const countData = await countRes.json()
              setWorkInstructionCount(countData.count)
            }
          } else {
            setWorkInstructionCount(0)
          }
        } else {
          setWorkInstructionEnabled(false)
          setWorkInstructionCount(0)
        }
      } catch (error) {
        if (isMounted) {
          console.error('Failed to fetch work instruction config:', error)
          setWorkInstructionEnabled(false)
          setWorkInstructionCount(0)
        }
      }
    }

    fetchConfigAndCount()
    return () => { isMounted = false }
  }, [selectedBusiness?.id])

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

        {/* 右側: 検索 + 作業指示 + 通知バブル + 通知ベル + ハンバーガーメニュー */}
        <div className="flex items-center gap-2">
          {/* 検索ボタン */}
          <SearchButton hasThemeColor={hasThemeColor} />

          {/* 作業指示メモアイコン（有効な事業のみ表示） */}
          {workInstructionEnabled && (
            <WorkInstructionIcon
              count={workInstructionCount}
              hasThemeColor={hasThemeColor}
              onClick={() => setWorkInstructionDialogOpen(true)}
            />
          )}

          {/* 以下は管理者（スーパー管理者）のみ表示 */}
          {isSuperAdmin && (
            <>
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
            </>
          )}

          {/* ハンバーガーメニュー */}
          <HamburgerMenu unreadNotificationCount={unreadNotificationCount} hasThemeColor={hasThemeColor} />
        </div>
      </div>

      {/* 作業指示メモダイアログ */}
      <WorkInstructionDialog
        open={workInstructionDialogOpen}
        onOpenChange={setWorkInstructionDialogOpen}
        businessId={selectedBusiness?.id}
        onCountChange={setWorkInstructionCount}
      />
    </header>
  )
}
