import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  findManualById,
  findManualWithRelations,
  findManualVersionById,
  findBlocksByManual,
  createManualVersion,
  deleteManualVersion,
  updateManual,
  deleteBlock,
  createBlock,
  findUserById,
  type D1ManualVersion,
  type D1ManualWithRelations,
  type D1Block,
  type D1BlockType,
} from '@/lib/d1'
import { getPermissionLevel, canEditManual } from '@/lib/permissions'

type RouteContext = {
  params: Promise<{ id: string; versionId: string }>
}

// D1のバージョンをcamelCaseに変換
function toVersionResponse(version: D1ManualVersion & { creator?: { id: string; name: string } }) {
  return {
    id: version.id,
    manualId: version.manual_id,
    version: version.version,
    title: version.title,
    description: version.description,
    blocks: typeof version.blocks === 'string' ? JSON.parse(version.blocks) : version.blocks,
    createdBy: version.created_by,
    createdAt: version.created_at,
    comment: version.comment,
    creator: version.creator,
  }
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

// GET /api/manuals/:id/versions/:versionId - 特定のバージョンを取得
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id, versionId } = await context.params

    // マニュアルを取得
    const manual = await findManualById(id)

    if (!manual) {
      return NextResponse.json({ error: 'マニュアルが見つかりません' }, { status: 404 })
    }

    // 権限チェック
    const level = await getPermissionLevel(session.user.id, manual.business_id)
    if (level === 'none') {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 })
    }

    // バージョンを取得
    const version = await findManualVersionById(versionId)

    if (!version || version.manual_id !== id) {
      return NextResponse.json({ error: 'バージョンが見つかりません' }, { status: 404 })
    }

    // creatorの情報を追加
    const user = await findUserById(version.created_by)
    const versionWithCreator = {
      ...version,
      creator: user ? { id: user.id, name: user.name } : undefined,
    }

    return NextResponse.json(toVersionResponse(versionWithCreator))
  } catch (error) {
    console.error('Failed to fetch version:', error)
    return NextResponse.json(
      { error: 'バージョンの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST /api/manuals/:id/versions/:versionId/restore - バージョンを復元
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id, versionId } = await context.params

    // マニュアルを取得
    const manual = await findManualWithRelations(id)

    if (!manual) {
      return NextResponse.json({ error: 'マニュアルが見つかりません' }, { status: 404 })
    }

    // 権限チェック
    const level = await getPermissionLevel(session.user.id, manual.business_id)
    if (!canEditManual(level)) {
      return NextResponse.json({ error: 'バージョン復元権限がありません' }, { status: 403 })
    }

    // バージョンを取得
    const version = await findManualVersionById(versionId)

    if (!version || version.manual_id !== id) {
      return NextResponse.json({ error: 'バージョンが見つかりません' }, { status: 404 })
    }

    // 現在のバージョンをスナップショットとして保存
    const currentBlocks = (manual.blocks || []).map((block) => ({
      type: block.type,
      content: typeof block.content === 'string' ? JSON.parse(block.content) : block.content,
      sortOrder: block.sort_order,
    }))

    await createManualVersion({
      manual_id: id,
      version: manual.version,
      title: manual.title,
      description: manual.description,
      blocks: JSON.stringify(currentBlocks),
      created_by: session.user.id,
      comment: `バージョン ${version.version} への復元前のバックアップ`,
    })

    // 既存のブロックを削除
    const existingBlocks = await findBlocksByManual(id)
    for (const block of existingBlocks) {
      await deleteBlock(block.id)
    }

    // バージョンからブロックを復元
    const versionBlocks = typeof version.blocks === 'string'
      ? JSON.parse(version.blocks)
      : version.blocks

    for (const block of versionBlocks as Array<{ type: D1BlockType; content: unknown; sortOrder: number }>) {
      await createBlock({
        manual_id: id,
        type: block.type,
        content: typeof block.content === 'string' ? block.content : JSON.stringify(block.content),
        sort_order: block.sortOrder,
      })
    }

    // マニュアルを更新
    await updateManual(id, {
      title: version.title,
      description: version.description,
      version: manual.version + 1,
      updated_by: session.user.id,
    })

    // 更新後のマニュアルを取得
    const restoredManual = await findManualWithRelations(id)

    if (!restoredManual) {
      return NextResponse.json({ error: 'バージョンの復元に失敗しました' }, { status: 500 })
    }

    return NextResponse.json(toManualResponse(restoredManual))
  } catch (error) {
    console.error('Failed to restore version:', error)
    return NextResponse.json(
      { error: 'バージョンの復元に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE /api/manuals/:id/versions/:versionId - バージョンを削除
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id, versionId } = await context.params

    // マニュアルを取得
    const manual = await findManualById(id)

    if (!manual) {
      return NextResponse.json({ error: 'マニュアルが見つかりません' }, { status: 404 })
    }

    // 権限チェック
    const level = await getPermissionLevel(session.user.id, manual.business_id)
    if (!canEditManual(level)) {
      return NextResponse.json({ error: 'バージョン削除権限がありません' }, { status: 403 })
    }

    // バージョンを取得
    const version = await findManualVersionById(versionId)

    if (!version || version.manual_id !== id) {
      return NextResponse.json({ error: 'バージョンが見つかりません' }, { status: 404 })
    }

    // バージョンを削除
    await deleteManualVersion(versionId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete version:', error)
    return NextResponse.json(
      { error: 'バージョンの削除に失敗しました' },
      { status: 500 }
    )
  }
}
