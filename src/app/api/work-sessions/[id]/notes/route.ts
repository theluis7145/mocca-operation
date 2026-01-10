import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type RouteContext = {
  params: Promise<{ id: string }>
}

// POST /api/work-sessions/:id/notes - メモ追加
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id: workSessionId } = await context.params
    const body = await request.json()
    const { blockId, content } = body

    if (!blockId || !content) {
      return NextResponse.json(
        { error: 'ブロックIDと内容は必須です' },
        { status: 400 }
      )
    }

    // 作業セッションを取得
    const workSession = await prisma.workSession.findUnique({
      where: { id: workSessionId },
    })

    if (!workSession) {
      return NextResponse.json(
        { error: '作業セッションが見つかりません' },
        { status: 404 }
      )
    }

    // 本人のみ追加可能
    if (workSession.userId !== session.user.id) {
      return NextResponse.json(
        { error: '他のユーザーの作業セッションにメモは追加できません' },
        { status: 403 }
      )
    }

    if (workSession.status === 'COMPLETED') {
      return NextResponse.json(
        { error: '完了済みの作業セッションにメモは追加できません' },
        { status: 400 }
      )
    }

    // ブロックが存在するか確認
    const block = await prisma.block.findUnique({
      where: { id: blockId },
    })

    if (!block) {
      return NextResponse.json(
        { error: 'ブロックが見つかりません' },
        { status: 404 }
      )
    }

    // 既存のメモがあれば更新、なければ作成
    const existingNote = await prisma.workSessionNote.findFirst({
      where: {
        workSessionId,
        blockId,
      },
    })

    let note
    if (existingNote) {
      note = await prisma.workSessionNote.update({
        where: { id: existingNote.id },
        data: { content },
        include: {
          block: {
            select: { id: true, sortOrder: true },
          },
        },
      })
    } else {
      note = await prisma.workSessionNote.create({
        data: {
          workSessionId,
          blockId,
          content,
        },
        include: {
          block: {
            select: { id: true, sortOrder: true },
          },
        },
      })
    }

    return NextResponse.json(note, { status: existingNote ? 200 : 201 })
  } catch (error) {
    console.error('Failed to create/update work session note:', error)
    return NextResponse.json(
      { error: 'メモの保存に失敗しました' },
      { status: 500 }
    )
  }
}

// GET /api/work-sessions/:id/notes - メモ一覧取得
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id: workSessionId } = await context.params

    // 作業セッションを取得
    const workSession = await prisma.workSession.findUnique({
      where: { id: workSessionId },
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

    // 本人または管理者のみ閲覧可能
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        isSuperAdmin: true,
        businessAccess: {
          where: {
            businessId: workSession.manual.businessId,
            role: 'ADMIN',
          },
        },
      },
    })

    const isOwner = workSession.userId === session.user.id
    const isAdmin = user?.isSuperAdmin || (user?.businessAccess?.length ?? 0) > 0

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'このセッションのメモへのアクセス権がありません' },
        { status: 403 }
      )
    }

    const notes = await prisma.workSessionNote.findMany({
      where: { workSessionId },
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
    })

    return NextResponse.json(notes)
  } catch (error) {
    console.error('Failed to fetch work session notes:', error)
    return NextResponse.json(
      { error: 'メモの取得に失敗しました' },
      { status: 500 }
    )
  }
}
