import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { markAllNotificationsAsRead } from '@/lib/d1'

// POST /api/notifications/read-all - 全ての通知を既読にする
export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    await markAllNotificationsAsRead(session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error)
    return NextResponse.json(
      { error: '通知の更新に失敗しました' },
      { status: 500 }
    )
  }
}
