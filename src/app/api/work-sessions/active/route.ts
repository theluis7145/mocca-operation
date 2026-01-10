import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/work-sessions/active - 現在ログインユーザーの進行中セッション一覧を取得
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // 現在進行中のセッションを取得
    const workSessions = await prisma.workSession.findMany({
      where: {
        userId: session.user.id,
        status: 'IN_PROGRESS',
      },
      include: {
        manual: {
          select: {
            id: true,
            title: true,
            businessId: true,
            business: {
              select: {
                id: true,
                name: true,
                displayNameLine1: true,
                displayNameLine2: true,
              },
            },
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    })

    return NextResponse.json(workSessions)
  } catch (error) {
    console.error('Failed to fetch active work sessions:', error)
    return NextResponse.json(
      { error: '作業セッションの取得に失敗しました' },
      { status: 500 }
    )
  }
}
