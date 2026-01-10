import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  findManualById,
  findManualWithRelations,
  updateManual,
  type D1ManualWithRelations,
} from '@/lib/d1'
import { getPermissionLevel, canEditManual } from '@/lib/permissions'

type RouteContext = {
  params: Promise<{ id: string }>
}

// D1のマニュアルをcamelCaseに変換
function toManualResponse(manual: D1ManualWithRelations) {
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
  }
}

// POST /api/manuals/:id/publish - マニュアルの公開/下書き切替
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
        { error: 'マニュアルの公開設定権限がありません' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { status } = body

    if (status !== 'DRAFT' && status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: '無効なステータスです' },
        { status: 400 }
      )
    }

    // ステータス更新（PUBLISHEDの場合はバージョンをインクリメント）
    await updateManual(id, {
      status,
      ...(status === 'PUBLISHED' && { version: existingManual.version + 1 }),
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
    console.error('Failed to update manual status:', error)
    return NextResponse.json(
      { error: 'マニュアルのステータス更新に失敗しました' },
      { status: 500 }
    )
  }
}
