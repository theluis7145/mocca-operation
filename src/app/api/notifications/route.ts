import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { findNotificationsByUser, countUnreadNotifications } from '@/lib/d1'

// D1のsnake_caseからcamelCaseに変換するヘルパー
function toNotificationResponse(notification: {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  link_url: string | null
  related_memo_id: string | null
  related_work_session_id: string | null
  is_read: number
  created_at: string
}) {
  return {
    id: notification.id,
    userId: notification.user_id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    linkUrl: notification.link_url,
    relatedMemoId: notification.related_memo_id,
    relatedWorkSessionId: notification.related_work_session_id,
    isRead: notification.is_read === 1,
    createdAt: notification.created_at,
  }
}

// GET /api/notifications - 通知一覧を取得
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const notifications = await findNotificationsByUser(session.user.id, 50)
    const unreadCount = await countUnreadNotifications(session.user.id)

    return NextResponse.json({
      notifications: notifications.map(toNotificationResponse),
      unreadCount,
    })
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return NextResponse.json(
      { error: '通知の取得に失敗しました' },
      { status: 500 }
    )
  }
}
