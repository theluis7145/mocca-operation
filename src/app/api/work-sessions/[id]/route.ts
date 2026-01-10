import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPermissionLevel, canEditManual } from '@/lib/permissions'

type RouteContext = {
  params: Promise<{ id: string }>
}

// GET /api/work-sessions/:id - 作業セッション詳細
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id } = await context.params

    const workSession = await prisma.workSession.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        manual: {
          select: {
            id: true,
            title: true,
            description: true,
            businessId: true,
            business: {
              select: { id: true, name: true },
            },
            blocks: {
              orderBy: { sortOrder: 'asc' },
              select: {
                id: true,
                type: true,
                content: true,
                sortOrder: true,
              },
            },
          },
        },
        notes: {
          include: {
            block: {
              select: { id: true, type: true, content: true, sortOrder: true },
            },
            photos: {
              select: { id: true, imageData: true, createdAt: true },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        photoRecords: {
          include: {
            block: {
              select: { id: true, type: true, content: true, sortOrder: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!workSession) {
      return NextResponse.json(
        { error: '作業セッションが見つかりません' },
        { status: 404 }
      )
    }

    // 権限チェック: 本人または管理者のみ閲覧可能
    const level = await getPermissionLevel(session.user.id, workSession.manual.businessId)
    const isOwner = workSession.userId === session.user.id
    const isAdmin = canEditManual(level)

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'この作業セッションへのアクセス権がありません' },
        { status: 403 }
      )
    }

    return NextResponse.json(workSession)
  } catch (error) {
    console.error('Failed to fetch work session:', error)
    return NextResponse.json(
      { error: '作業セッションの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE /api/work-sessions/:id - 作業セッション削除（キャンセル）
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

    const workSession = await prisma.workSession.findUnique({
      where: { id },
      include: {
        manual: {
          select: { businessId: true },
        },
      },
    })

    if (!workSession) {
      return NextResponse.json(
        { error: '作業セッションが見つかりません' },
        { status: 404 }
      )
    }

    // 権限チェック: 本人の進行中セッションのみ削除可能
    if (workSession.userId !== session.user.id) {
      return NextResponse.json(
        { error: '他のユーザーの作業セッションは削除できません' },
        { status: 403 }
      )
    }

    if (workSession.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: '完了済みの作業セッションは削除できません' },
        { status: 400 }
      )
    }

    await prisma.workSession.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete work session:', error)
    return NextResponse.json(
      { error: '作業セッションの削除に失敗しました' },
      { status: 500 }
    )
  }
}
