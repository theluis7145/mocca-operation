import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { findNotificationById, markNotificationAsRead, deleteNotification } from '@/lib/d1'

type RouteContext = {
  params: Promise<{ id: string }>
}

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

// PATCH /api/notifications/:id - 通知を既読にする
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id } = await context.params

    // 通知の存在確認と所有権チェック
    const notification = await findNotificationById(id)

    if (!notification) {
      return NextResponse.json(
        { error: '通知が見つかりません' },
        { status: 404 }
      )
    }

    if (notification.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'この通知にアクセスする権限がありません' },
        { status: 403 }
      )
    }

    await markNotificationAsRead(id)

    // 更新後の通知を取得して返す
    const updated = await findNotificationById(id)

    return NextResponse.json(updated ? toNotificationResponse(updated) : null)
  } catch (error) {
    console.error('Failed to update notification:', error)
    return NextResponse.json(
      { error: '通知の更新に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE /api/notifications/:id - 通知を削除
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id } = await context.params

    // 通知の存在確認と所有権チェック
    const notification = await findNotificationById(id)

    if (!notification) {
      return NextResponse.json(
        { error: '通知が見つかりません' },
        { status: 404 }
      )
    }

    if (notification.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'この通知を削除する権限がありません' },
        { status: 403 }
      )
    }

    await deleteNotification(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete notification:', error)
    return NextResponse.json(
      { error: '通知の削除に失敗しました' },
      { status: 500 }
    )
  }
}
