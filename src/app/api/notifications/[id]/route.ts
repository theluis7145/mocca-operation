import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type RouteContext = {
  params: Promise<{ id: string }>
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
    const notification = await prisma.notification.findUnique({
      where: { id },
    })

    if (!notification) {
      return NextResponse.json(
        { error: '通知が見つかりません' },
        { status: 404 }
      )
    }

    if (notification.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'この通知にアクセスする権限がありません' },
        { status: 403 }
      )
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    })

    return NextResponse.json(updated)
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
    const notification = await prisma.notification.findUnique({
      where: { id },
    })

    if (!notification) {
      return NextResponse.json(
        { error: '通知が見つかりません' },
        { status: 404 }
      )
    }

    if (notification.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'この通知を削除する権限がありません' },
        { status: 403 }
      )
    }

    await prisma.notification.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete notification:', error)
    return NextResponse.json(
      { error: '通知の削除に失敗しました' },
      { status: 500 }
    )
  }
}
