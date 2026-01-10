'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileSidebar } from '@/components/layout/MobileSidebar'
import { useBusinessStore } from '@/stores/useBusinessStore'
import { useUserStore, fontSizeConfig } from '@/stores/useUserStore'

interface ActiveWorkSession {
  id: string
  startedAt: string
  manual: {
    id: string
    title: string
    businessId: string
    business: {
      id: string
      name: string
      displayNameLine1: string
      displayNameLine2: string
    }
  }
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const { businesses, setBusinesses, setIsLoading, setError, selectedBusiness } =
    useBusinessStore()
  const { fontSize } = useUserStore()
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const [showNotificationBubble, setShowNotificationBubble] = useState(false)
  const [activeWorkSessions, setActiveWorkSessions] = useState<ActiveWorkSession[]>([])

  // 通知数を取得
  const fetchNotificationCount = useCallback(async () => {
    if (status !== 'authenticated') return

    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setUnreadNotificationCount(data.unreadCount)
        setShowNotificationBubble(data.unreadCount > 0)
      }
    } catch (error) {
      console.error('Failed to fetch notification count:', error)
    }
  }, [status])

  // 作業中セッションを取得
  const fetchActiveWorkSessions = useCallback(async () => {
    if (status !== 'authenticated') return

    try {
      const response = await fetch('/api/work-sessions/active')
      if (response.ok) {
        const data = await response.json()
        setActiveWorkSessions(data)
      }
    } catch (error) {
      console.error('Failed to fetch active work sessions:', error)
    }
  }, [status])

  useEffect(() => {
    fetchNotificationCount()
    fetchActiveWorkSessions()
    // 30秒ごとに通知と作業中セッションをチェック
    const interval = setInterval(() => {
      fetchNotificationCount()
      fetchActiveWorkSessions()
    }, 30000)
    return () => clearInterval(interval)
  }, [fetchNotificationCount, fetchActiveWorkSessions])

  // 事業一覧を取得
  useEffect(() => {
    async function fetchBusinesses() {
      if (status !== 'authenticated') return

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/businesses')
        if (!response.ok) {
          throw new Error('事業の取得に失敗しました')
        }
        const data = await response.json()
        setBusinesses(data)
      } catch (error) {
        setError(error instanceof Error ? error.message : '予期せぬエラーが発生しました')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBusinesses()
  }, [status, setBusinesses, setIsLoading, setError])

  // 文字サイズの適用
  useEffect(() => {
    const body = document.body
    // 既存のフォントサイズクラスを削除
    Object.values(fontSizeConfig).forEach((config) => {
      body.classList.remove(config.className)
    })
    // 新しいフォントサイズクラスを追加
    body.classList.add(fontSizeConfig[fontSize].className)
  }, [fontSize])

  // 管理者かどうかを判定
  const isAdmin =
    session?.user?.isSuperAdmin ||
    (selectedBusiness &&
      businesses.some((b) => b.id === selectedBusiness.id))

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  // マニュアルのデータを整形（サイドバー用）
  const manuals = (selectedBusiness?.manuals || []).map((m) => ({
    id: m.id,
    title: m.title,
    status: m.status,
    adminOnly: m.adminOnly,
  }))

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        unreadNotificationCount={unreadNotificationCount}
        showNotificationBubble={showNotificationBubble}
      />
      <div className="flex-1 flex">
        {/* デスクトップ用サイドバー（md以上で表示） */}
        <div className="hidden md:block">
          <Sidebar manuals={manuals} activeWorkSessions={activeWorkSessions} />
        </div>
        {/* モバイル用サイドバー（ドロワー） */}
        <MobileSidebar manuals={manuals} activeWorkSessions={activeWorkSessions} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
