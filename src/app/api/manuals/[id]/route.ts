import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  findManualById,
  findManualWithRelations,
  updateManual,
  deleteManual,
  type D1ManualWithRelations,
  type D1Block,
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
    creator: manual.creator,
    updater: manual.updater,
    blocks: (blocks || manual.blocks || []).map(toBlockResponse),
  }
}

// GET /api/manuals/:id - マニュアル詳細を取得
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

    const manual = await findManualWithRelations(id)

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

    // 非公開は管理者のみ閲覧可能
    if (manual.status === 'DRAFT' && !canEditManual(level)) {
      return NextResponse.json(
        { error: 'このマニュアルは非公開です' },
        { status: 403 }
      )
    }

    // 管理者限定マニュアルは管理者のみ閲覧可能
    if (manual.admin_only && !canEditManual(level)) {
      return NextResponse.json(
        { error: 'このマニュアルは管理者限定です' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      ...toManualResponse(manual),
      _permission: level,
    })
  } catch (error) {
    console.error('Failed to fetch manual:', error)
    return NextResponse.json(
      { error: 'マニュアルの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// PATCH /api/manuals/:id - マニュアルを更新
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id } = await context.params

    // マニュアルを取得
    const existingManual = await findManualById(id)

    if (!existingManual) {
      return NextResponse.json(
        { error: 'マニュアルが見つかりません' },
        { status: 404 }
      )
    }

    const level = await getPermissionLevel(session.user.id, existingManual.business_id)

    if (!canEditManual(level)) {
      return NextResponse.json(
        { error: 'マニュアルの更新権限がありません' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, description, adminOnly } = body

    await updateManual(id, {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(adminOnly !== undefined && { admin_only: adminOnly }),
      updated_by: session.user.id,
    })

    // 関連データ付きで再取得
    const manual = await findManualWithRelations(id)

    if (!manual) {
      return NextResponse.json(
        { error: 'マニュアルの更新に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json(toManualResponse(manual))
  } catch (error) {
    console.error('Failed to update manual:', error)
    return NextResponse.json(
      { error: 'マニュアルの更新に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE /api/manuals/:id - マニュアルを削除
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

    // マニュアルを取得
    const existingManual = await findManualById(id)

    if (!existingManual) {
      return NextResponse.json(
        { error: 'マニュアルが見つかりません' },
        { status: 404 }
      )
    }

    const level = await getPermissionLevel(session.user.id, existingManual.business_id)

    if (!canEditManual(level)) {
      return NextResponse.json(
        { error: 'マニュアルの削除権限がありません' },
        { status: 403 }
      )
    }

    await deleteManual(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete manual:', error)
    return NextResponse.json(
      { error: 'マニュアルの削除に失敗しました' },
      { status: 500 }
    )
  }
}
