import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  findBusinessById,
  createManual,
  findManualWithRelations,
  type D1ManualWithRelations,
} from '@/lib/d1'
import { getPermissionLevel, canEditManual } from '@/lib/permissions'

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

// POST /api/manuals - マニュアルを作成
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const body = await request.json()
    const { businessId, title, description } = body

    if (!businessId || !title) {
      return NextResponse.json(
        { error: '事業IDとタイトルは必須です' },
        { status: 400 }
      )
    }

    // 事業の存在確認
    const business = await findBusinessById(businessId)

    if (!business) {
      return NextResponse.json(
        { error: '事業が見つかりません' },
        { status: 404 }
      )
    }

    const level = await getPermissionLevel(session.user.id, businessId)

    if (!canEditManual(level)) {
      return NextResponse.json(
        { error: 'マニュアルの作成権限がありません' },
        { status: 403 }
      )
    }

    const manual = await createManual({
      business_id: businessId,
      title,
      description,
      created_by: session.user.id,
      updated_by: session.user.id,
    })

    // 関連データ付きで再取得
    const manualWithRelations = await findManualWithRelations(manual.id)

    if (!manualWithRelations) {
      return NextResponse.json(
        { error: 'マニュアルの作成に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json(toManualResponse(manualWithRelations), { status: 201 })
  } catch (error) {
    console.error('Failed to create manual:', error)
    return NextResponse.json(
      { error: 'マニュアルの作成に失敗しました' },
      { status: 500 }
    )
  }
}
