import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPermissionLevel, canEditManual } from '@/lib/permissions'

type RouteContext = {
  params: Promise<{ id: string }>
}

// PATCH /api/manuals/:id/blocks/reorder - ブロックの並び替え
export async function PATCH(
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
        { error: 'ブロックの並び替え権限がありません' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { blockIds } = body as { blockIds: string[] }

    if (!Array.isArray(blockIds) || blockIds.length === 0) {
      return NextResponse.json(
        { error: 'ブロックIDの配列が必要です' },
        { status: 400 }
      )
    }

    // トランザクションで一括更新
    await prisma.$transaction(
      blockIds.map((blockId, index) =>
        prisma.block.update({
          where: { id: blockId },
          data: { sortOrder: index + 1 },
        })
      )
    )

    // マニュアルの更新日時を更新
    await prisma.manual.update({
      where: { id: manualId },
      data: { updatedBy: session.user.id },
    })

    // 更新後のブロック一覧を返す
    const blocks = await prisma.block.findMany({
      where: { manualId },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json(blocks)
  } catch (error) {
    console.error('Failed to reorder blocks:', error)
    return NextResponse.json(
      { error: 'ブロックの並び替えに失敗しました' },
      { status: 500 }
    )
  }
}
