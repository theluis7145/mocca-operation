import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/work-sessions/[id]/photos - 写真一覧を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id: workSessionId } = await params
    const { searchParams } = new URL(request.url)
    const blockId = searchParams.get('blockId')

    // 作業セッションの存在確認
    const workSession = await prisma.workSession.findUnique({
      where: { id: workSessionId },
    })

    if (!workSession) {
      return NextResponse.json({ error: '作業セッションが見つかりません' }, { status: 404 })
    }

    // 写真を取得
    const photos = await prisma.photoRecord.findMany({
      where: {
        workSessionId,
        ...(blockId ? { blockId } : {}),
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(photos)
  } catch (error) {
    console.error('Failed to fetch photos:', error)
    return NextResponse.json(
      { error: '写真の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST /api/work-sessions/[id]/photos - 写真を追加
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id: workSessionId } = await params
    const body = await request.json()
    const { blockId, imageData } = body

    if (!blockId || !imageData) {
      return NextResponse.json(
        { error: 'blockIdとimageDataは必須です' },
        { status: 400 }
      )
    }

    // 作業セッションの存在確認と権限チェック
    const workSession = await prisma.workSession.findUnique({
      where: { id: workSessionId },
    })

    if (!workSession) {
      return NextResponse.json({ error: '作業セッションが見つかりません' }, { status: 404 })
    }

    if (workSession.userId !== session.user.id) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    if (workSession.status !== 'IN_PROGRESS') {
      return NextResponse.json({ error: '完了した作業セッションには写真を追加できません' }, { status: 400 })
    }

    // ブロックの存在確認
    const block = await prisma.block.findUnique({
      where: { id: blockId },
    })

    if (!block) {
      return NextResponse.json({ error: 'ブロックが見つかりません' }, { status: 404 })
    }

    // 写真を保存
    const photo = await prisma.photoRecord.create({
      data: {
        workSessionId,
        blockId,
        imageData,
      },
    })

    return NextResponse.json(photo)
  } catch (error) {
    console.error('Failed to save photo:', error)
    return NextResponse.json(
      { error: '写真の保存に失敗しました' },
      { status: 500 }
    )
  }
}
