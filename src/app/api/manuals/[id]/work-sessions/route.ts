import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPermissionLevel, canViewManual } from '@/lib/permissions'

type RouteContext = {
  params: Promise<{ id: string }>
}

// POST /api/manuals/:id/work-sessions - 作業セッション開始
export async function POST(
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

    // 既存の進行中セッションがあるか確認
    const existingSession = await prisma.workSession.findFirst({
      where: {
        manualId,
        userId: session.user.id,
        status: 'IN_PROGRESS',
      },
    })

    if (existingSession) {
      return NextResponse.json(
        { error: '既に進行中の作業セッションがあります', workSession: existingSession },
        { status: 409 }
      )
    }

    // 新しい作業セッションを作成
    const workSession = await prisma.workSession.create({
      data: {
        manualId,
        userId: session.user.id,
      },
      include: {
        notes: true,
        user: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json(workSession, { status: 201 })
  } catch (error) {
    console.error('Failed to create work session:', error)
    return NextResponse.json(
      { error: '作業セッションの開始に失敗しました' },
      { status: 500 }
    )
  }
}

// GET /api/manuals/:id/work-sessions - マニュアルの作業セッション一覧
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

    // 管理者は全セッション、一般ユーザーは自分のセッションのみ
    const isAdmin = level === 'admin' || level === 'superadmin'

    const workSessions = await prisma.workSession.findMany({
      where: {
        manualId,
        ...(isAdmin ? {} : { userId: session.user.id }),
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
        notes: true,
      },
      orderBy: { startedAt: 'desc' },
    })

    return NextResponse.json(workSessions)
  } catch (error) {
    console.error('Failed to fetch work sessions:', error)
    return NextResponse.json(
      { error: '作業セッションの取得に失敗しました' },
      { status: 500 }
    )
  }
}
