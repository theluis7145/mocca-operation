import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPermissionLevel, canEditManual } from '@/lib/permissions'

type RouteContext = {
  params: Promise<{ id: string }>
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
    const manual = await prisma.manual.findUnique({
      where: { id: manualId },
    })

    if (!manual) {
      return NextResponse.json(
        { error: 'マニュアルが見つかりません' },
        { status: 404 }
      )
    }

    // 権限確認
    const level = await getPermissionLevel(session.user.id, manual.businessId)

    if (!canEditManual(level)) {
      return NextResponse.json(
        { error: 'マニュアルをアーカイブする権限がありません' },
        { status: 403 }
      )
    }

    // すでにアーカイブ済みの場合
    if (manual.isArchived) {
      return NextResponse.json(
        { error: 'このマニュアルはすでにアーカイブされています' },
        { status: 400 }
      )
    }

    // アーカイブ
    const updatedManual = await prisma.manual.update({
      where: { id: manualId },
      data: {
        isArchived: true,
        archivedAt: new Date(),
        updatedBy: session.user.id,
      },
    })

    return NextResponse.json(updatedManual)
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
    const manual = await prisma.manual.findUnique({
      where: { id: manualId },
    })

    if (!manual) {
      return NextResponse.json(
        { error: 'マニュアルが見つかりません' },
        { status: 404 }
      )
    }

    // 権限確認
    const level = await getPermissionLevel(session.user.id, manual.businessId)

    if (!canEditManual(level)) {
      return NextResponse.json(
        { error: 'マニュアルを復元する権限がありません' },
        { status: 403 }
      )
    }

    // アーカイブされていない場合
    if (!manual.isArchived) {
      return NextResponse.json(
        { error: 'このマニュアルはアーカイブされていません' },
        { status: 400 }
      )
    }

    // 復元
    const updatedManual = await prisma.manual.update({
      where: { id: manualId },
      data: {
        isArchived: false,
        archivedAt: null,
        updatedBy: session.user.id,
      },
    })

    return NextResponse.json(updatedManual)
  } catch (error) {
    console.error('Failed to restore manual:', error)
    return NextResponse.json(
      { error: 'マニュアルの復元に失敗しました' },
      { status: 500 }
    )
  }
}
