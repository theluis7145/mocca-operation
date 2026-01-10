'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck, Trash2, MessageSquare, ExternalLink, ClipboardCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: 'NEW_PUBLIC_MEMO' | 'MENTION' | 'WORK_SESSION_COMPLETED'
  message: string
  linkUrl?: string
  isRead: boolean
  createdAt: string
  relatedMemo?: {
    id: string
    content: string
    user: {
      id: string
      name: string
    }
    block?: {
      id: string
      manualId: string
    }
  }
  relatedWorkSession?: {
    id: string
    status: string
    user: {
      id: string
      name: string
    }
    manual: {
      id: string
      title: string
    }
  }
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch {
      toast.error('通知の取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
      })
      if (!response.ok) throw new Error('Failed to update')

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {
      toast.error('通知の更新に失敗しました')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to update')

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
      toast.success('全ての通知を既読にしました')
    } catch {
      toast.error('通知の更新に失敗しました')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return

    try {
      const response = await fetch(`/api/notifications/${deleteTargetId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete')

      const notification = notifications.find((n) => n.id === deleteTargetId)
      setNotifications((prev) => prev.filter((n) => n.id !== deleteTargetId))
      if (notification && !notification.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
      toast.success('通知を削除しました')
    } catch {
      toast.error('通知の削除に失敗しました')
    } finally {
      setDeleteTargetId(null)
    }
  }

  const handleNavigate = (notification: Notification) => {
    // まず既読にする
    if (!notification.isRead) {
      handleMarkAsRead(notification.id)
    }

    // linkUrlがあればそこへ遷移
    if (notification.linkUrl) {
      router.push(notification.linkUrl)
      return
    }

    // メモのあるマニュアルページへ遷移
    if (notification.relatedMemo?.block?.manualId) {
      router.push(`/manual/${notification.relatedMemo.block.manualId}`)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const yy = String(date.getFullYear()).slice(-2)
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    const hh = String(date.getHours()).padStart(2, '0')
    const min = String(date.getMinutes()).padStart(2, '0')
    return `${yy}/${mm}/${dd} ${hh}:${min}`
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6" />
          <h1 className="text-2xl font-bold">お知らせ</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount}件</Badge>
          )}
        </div>

        {notifications.some((n) => !n.isRead) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            <span className="hidden sm:inline">すべて既読にする</span>
            <span className="sm:hidden">全既読</span>
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Bell className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg">通知はありません</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const isWorkSession = notification.type === 'WORK_SESSION_COMPLETED'
            const isMemo = notification.type === 'NEW_PUBLIC_MEMO'
            const hasLink = notification.linkUrl || notification.relatedMemo?.block?.manualId

            return (
              <Card
                key={notification.id}
                className={cn(
                  'transition-colors',
                  hasLink && 'cursor-pointer',
                  !notification.isRead && 'bg-primary/5 border-primary/20'
                )}
                onClick={() => hasLink && handleNavigate(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'p-2 rounded-full flex-shrink-0',
                        isWorkSession
                          ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
                          : isMemo
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                      )}
                    >
                      {isWorkSession ? (
                        <ClipboardCheck className="h-4 w-4" />
                      ) : (
                        <MessageSquare className="h-4 w-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p
                            className={cn(
                              'text-sm',
                              !notification.isRead && 'font-semibold'
                            )}
                          >
                            {notification.message}
                          </p>
                          {notification.relatedMemo && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              &ldquo;{notification.relatedMemo.content}&rdquo;
                            </p>
                          )}
                          {notification.relatedWorkSession && (
                            <p className="text-sm text-muted-foreground mt-1">
                              マニュアル: {notification.relatedWorkSession.manual.title}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>

                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {hasLink && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleNavigate(notification)}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteTargetId(notification.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {!notification.isRead && (
                        <div className="mt-2">
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                            未読
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* 削除確認ダイアログ */}
      <AlertDialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>通知を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
