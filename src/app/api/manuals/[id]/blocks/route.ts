import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPermissionLevel, canViewManual, canEditManual } from '@/lib/permissions'
import type { BlockType } from '@prisma/client'

type RouteContext = {
  params: Promise<{ id: string }>
}

// GET /api/manuals/:id/blocks - ブロック一覧を取得
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

    // マニュアルを取得して権限確認
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

    const blocks = await prisma.block.findMany({
      where: { manualId },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json(blocks)
  } catch (error) {
    console.error('Failed to fetch blocks:', error)
    return NextResponse.json(
      { error: 'ブロックの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST /api/manuals/:id/blocks - ブロックを追加
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

    // マニュアルを取得して権限確認
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

    if (!canEditManual(level)) {
      return NextResponse.json(
        { error: 'ブロックの追加権限がありません' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { type, content } = body

    if (!type || !content) {
      return NextResponse.json(
        { error: 'タイプとコンテンツは必須です' },
        { status: 400 }
      )
    }

    // 有効なブロックタイプかチェック
    const validTypes: BlockType[] = ['TEXT', 'IMAGE', 'VIDEO', 'WARNING', 'CHECKPOINT', 'PHOTO_RECORD']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: '無効なブロックタイプです' },
        { status: 400 }
      )
    }

    // 最大のsortOrderを取得
    const maxSortOrder = await prisma.block.aggregate({
      where: { manualId },
      _max: { sortOrder: true },
    })

    const block = await prisma.block.create({
      data: {
        manualId,
        type,
        content,
        sortOrder: (maxSortOrder._max.sortOrder || 0) + 1,
      },
    })

    // マニュアルの更新日時を更新
    await prisma.manual.update({
      where: { id: manualId },
      data: { updatedBy: session.user.id },
    })

    return NextResponse.json(block, { status: 201 })
  } catch (error) {
    console.error('Failed to create block:', error)
    return NextResponse.json(
      { error: 'ブロックの作成に失敗しました' },
      { status: 500 }
    )
  }
}
