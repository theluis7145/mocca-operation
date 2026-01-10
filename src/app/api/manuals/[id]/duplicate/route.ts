import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  findManualWithRelations,
  createManual,
  createBlock,
  type D1ManualWithRelations,
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

// D1のマニュアルをcamelCaseに変換
function toManualResponse(manual: D1ManualWithRelations, blocks?: D1Block[]) {
  return {
    id: manual.id,
    businessId: manual.business_id,
    title: manual.title,
    description: manual.description,
    status: manual.status,
    adminOnly: Boolean(manual.admin_only),
    sortOrder: manual.sort_order,
    isArchived: Boolean(manual.is_archived),
    archivedAt: manual.archived_at,
    version: manual.version,
    createdBy: manual.created_by,
    updatedBy: manual.updated_by,
    createdAt: manual.created_at,
    updatedAt: manual.updated_at,
    business: manual.business ? {
      id: manual.business.id,
      name: manual.business.name,
      displayNameLine1: manual.business.display_name_line1,
      displayNameLine2: manual.business.display_name_line2,
      description: manual.business.description,
      icon: manual.business.icon,
      color: manual.business.color,
      themeColors: manual.business.theme_colors,
      sortOrder: manual.business.sort_order,
      isActive: Boolean(manual.business.is_active),
      createdAt: manual.business.created_at,
      updatedAt: manual.business.updated_at,
    } : undefined,
    blocks: (blocks || manual.blocks || []).map(toBlockResponse),
  }
}

// POST /api/manuals/:id/duplicate - マニュアルを複製
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id } = await context.params

    // 元のマニュアルを取得
    const originalManual = await findManualWithRelations(id)

    if (!originalManual) {
      return NextResponse.json(
        { error: 'マニュアルが見つかりません' },
        { status: 404 }
      )
    }

    // 権限チェック
    const level = await getPermissionLevel(session.user.id, originalManual.business_id)
    if (!canEditManual(level)) {
      return NextResponse.json(
        { error: 'マニュアルの複製権限がありません' },
        { status: 403 }
      )
    }

    // 新しいマニュアルを作成
    const newManual = await createManual({
      business_id: originalManual.business_id,
      title: `${originalManual.title}（コピー）`,
      description: originalManual.description,
      status: 'DRAFT',
      created_by: session.user.id,
      updated_by: session.user.id,
    })

    // ブロックを複製
    const originalBlocks = originalManual.blocks || []
    for (let i = 0; i < originalBlocks.length; i++) {
      const block = originalBlocks[i]
      await createBlock({
        manual_id: newManual.id,
        type: block.type,
        content: block.content,
        sort_order: i,
      })
    }

    // 作成したマニュアルをブロック付きで取得
    const createdManual = await findManualWithRelations(newManual.id)

    if (!createdManual) {
      return NextResponse.json(
        { error: 'マニュアルの複製に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json(toManualResponse(createdManual), { status: 201 })
  } catch (error) {
    console.error('Failed to duplicate manual:', error)
    return NextResponse.json(
      { error: 'マニュアルの複製に失敗しました' },
      { status: 500 }
    )
  }
}
