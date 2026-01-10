import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  findManualById,
  updateManual,
  type D1Manual,
} from '@/lib/d1'
import { getPermissionLevel, canEditManual } from '@/lib/permissions'

type RouteContext = {
  params: Promise<{ id: string }>
}

// D1のマニュアルをcamelCaseに変換
function toManualResponse(manual: D1Manual) {
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
  }
}

// POST /api/manuals/:id/archive - マニュアルをアーカイブ
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

    // マニュアルを取得
    const manual = await findManualById(manualId)

    if (!manual) {
      return NextResponse.json(
        { error: 'マニュアルが見つかりません' },
        { status: 404 }
      )
    }

    // 権限確認
    const level = await getPermissionLevel(session.user.id, manual.business_id)

    if (!canEditManual(level)) {
      return NextResponse.json(
        { error: 'マニュアルをアーカイブする権限がありません' },
        { status: 403 }
      )
    }

    // すでにアーカイブ済みの場合
    if (manual.is_archived) {
      return NextResponse.json(
        { error: 'このマニュアルはすでにアーカイブされています' },
        { status: 400 }
      )
    }

    // アーカイブ
    const updatedManual = await updateManual(manualId, {
      is_archived: true,
      archived_at: new Date().toISOString(),
      updated_by: session.user.id,
    })

    if (!updatedManual) {
      return NextResponse.json(
        { error: 'マニュアルのアーカイブに失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json(toManualResponse(updatedManual))
  } catch (error) {
    console.error('Failed to archive manual:', error)
    return NextResponse.json(
      { error: 'マニュアルのアーカイブに失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE /api/manuals/:id/archive - マニュアルを復元（アーカイブ解除）
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id: manualId } = await context.params

    // マニュアルを取得
    const manual = await findManualById(manualId)

    if (!manual) {
      return NextResponse.json(
        { error: 'マニュアルが見つかりません' },
        { status: 404 }
      )
    }

    // 権限確認
    const level = await getPermissionLevel(session.user.id, manual.business_id)

    if (!canEditManual(level)) {
      return NextResponse.json(
        { error: 'マニュアルを復元する権限がありません' },
        { status: 403 }
      )
    }

    // アーカイブされていない場合
    if (!manual.is_archived) {
      return NextResponse.json(
        { error: 'このマニュアルはアーカイブされていません' },
        { status: 400 }
      )
    }

    // 復元
    const updatedManual = await updateManual(manualId, {
      is_archived: false,
      archived_at: null,
      updated_by: session.user.id,
    })

    if (!updatedManual) {
      return NextResponse.json(
        { error: 'マニュアルの復元に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json(toManualResponse(updatedManual))
  } catch (error) {
    console.error('Failed to restore manual:', error)
    return NextResponse.json(
      { error: 'マニュアルの復元に失敗しました' },
      { status: 500 }
    )
  }
}
