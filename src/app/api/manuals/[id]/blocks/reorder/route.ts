import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  findManualById,
  findBlocksByManual,
  reorderBlocks,
  updateManual,
  type D1Block,
} from '@/lib/d1'
import { getPermissionLevel, canEditManual } from '@/lib/permissions'

type RouteContext = {
  params: Promise<{ id: string }>
}

// D1のブロックをcamelCaseに変換
function toBlockResponse(block: D1Block) {
  return {
    id: block.id,
    manualId: block.manual_id,
    type: block.type,
    content: typeof block.content === 'string' ? JSON.parse(block.content) : block.content,
    sortOrder: block.sort_order,
    createdAt: block.created_at,
    updatedAt: block.updated_at,
  }
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
    const manual = await findManualById(manualId)

    if (!manual) {
      return NextResponse.json(
        { error: 'マニュアルが見つかりません' },
        { status: 404 }
      )
    }

    const level = await getPermissionLevel(session.user.id, manual.business_id)

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

    // ブロックの並び替え
    await reorderBlocks(manualId, blockIds)

    // マニュアルの更新日時を更新
    await updateManual(manualId, { updated_by: session.user.id })

    // 更新後のブロック一覧を返す
    const blocks = await findBlocksByManual(manualId)

    return NextResponse.json(blocks.map(toBlockResponse))
  } catch (error) {
    console.error('Failed to reorder blocks:', error)
    return NextResponse.json(
      { error: 'ブロックの並び替えに失敗しました' },
      { status: 500 }
    )
  }
}
