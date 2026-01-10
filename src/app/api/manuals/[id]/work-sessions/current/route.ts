import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPermissionLevel, canViewManual } from '@/lib/permissions'

type RouteContext = {
  params: Promise<{ id: string }>
}

// GET /api/manuals/:id/work-sessions/current - 現在の進行中セッションを取得
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id: manualId } = await context.params

    // マニュアルを取得
    const manual = await prisma.manual.findUnique({
      where: { id: manualId },
    })

    if (!manual) {
      return NextResponse.json(
        { error: 'マニュアルが見つかりません' },
        { status: 404 }
      )
    }

    const level = await getPermissionLevel(session.user.id, manual.businessId)

    if (!canViewManual(level)) {
      return NextResponse.json(
        { error: 'このマニュアルへのアクセス権がありません' },
        { status: 403 }
      )
    }

    // 現在進行中のセッションを取得
    const workSession = await prisma.workSession.findFirst({
      where: {
        manualId,
        userId: session.user.id,
        status: 'IN_PROGRESS',
      },
      include: {
        notes: {
          include: {
            block: {
              select: { id: true, sortOrder: true },
            },
            photos: {
              select: { id: true, imageData: true, createdAt: true },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
        photoRecords: {
          select: {
            id: true,
            blockId: true,
            createdAt: true,
          },
        },
        user: {
          select: { id: true, name: true },
        },
      },
    })

    if (!workSession) {
      return NextResponse.json(null)
    }

    return NextResponse.json(workSession)
  } catch (error) {
    console.error('Failed to fetch current work session:', error)
    return NextResponse.json(
      { error: '作業セッションの取得に失敗しました' },
      { status: 500 }
    )
  }
}
