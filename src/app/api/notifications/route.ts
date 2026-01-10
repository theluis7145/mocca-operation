import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/notifications - 通知一覧を取得
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        relatedMemo: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
            block: {
              select: {
                id: true,
                manualId: true,
              },
            },
          },
        },
        relatedWorkSession: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
            manual: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // 最新50件
    })

    // 未読件数も返す
    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    })

    return NextResponse.json({
      notifications,
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
