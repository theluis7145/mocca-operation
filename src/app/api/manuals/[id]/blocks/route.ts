import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  findManualById,
  findBlocksByManual,
  createBlock,
  updateManual,
  type D1Block,
  type D1BlockType,
} from '@/lib/d1'
import { getPermissionLevel, canViewManual, canEditManual } from '@/lib/permissions'

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
    const manual = await findManualById(manualId)

    if (!manual) {
      return NextResponse.json(
        { error: 'マニュアルが見つかりません' },
        { status: 404 }
      )
    }

    const level = await getPermissionLevel(session.user.id, manual.business_id)

    if (!canViewManual(level)) {
      return NextResponse.json(
        { error: 'このマニュアルへのアクセス権がありません' },
        { status: 403 }
      )
    }

    const blocks = await findBlocksByManual(manualId)

    return NextResponse.json(blocks.map(toBlockResponse))
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
    const validTypes: D1BlockType[] = ['TEXT', 'IMAGE', 'VIDEO', 'WARNING', 'CHECKPOINT', 'PHOTO_RECORD']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: '無効なブロックタイプです' },
        { status: 400 }
      )
    }

    // 最大のsortOrderを取得
    const blocks = await findBlocksByManual(manualId)
    const maxSortOrder = blocks.length > 0
      ? Math.max(...blocks.map(b => b.sort_order))
      : 0

    const block = await createBlock({
      manual_id: manualId,
      type,
      content: typeof content === 'string' ? content : JSON.stringify(content),
      sort_order: maxSortOrder + 1,
    })

    // マニュアルの更新日時を更新
    await updateManual(manualId, { updated_by: session.user.id })

    return NextResponse.json(toBlockResponse(block), { status: 201 })
  } catch (error) {
    console.error('Failed to create block:', error)
    return NextResponse.json(
      { error: 'ブロックの作成に失敗しました' },
      { status: 500 }
    )
  }
}
