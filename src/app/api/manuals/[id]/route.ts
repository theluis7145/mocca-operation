import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPermissionLevel, canViewManual, canEditManual } from '@/lib/permissions'

type RouteContext = {
  params: Promise<{ id: string }>
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

    const manual = await prisma.manual.findUnique({
      where: { id },
      include: {
        business: true,
        creator: {
          select: { id: true, name: true },
        },
        updater: {
          select: { id: true, name: true },
        },
        blocks: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!manual) {
      return NextResponse.json(
        { error: 'マニュアルが見つかりません' },
        { status: 404 }
      )
    }

    const level = await getPermissionLevel(session.user.id, manual.businessId)

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
    if (manual.adminOnly && !canEditManual(level)) {
      return NextResponse.json(
        { error: 'このマニュアルは管理者限定です' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      ...manual,
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
    const existingManual = await prisma.manual.findUnique({
      where: { id },
    })

    if (!existingManual) {
      return NextResponse.json(
        { error: 'マニュアルが見つかりません' },
        { status: 404 }
      )
    }

    const level = await getPermissionLevel(session.user.id, existingManual.businessId)

    if (!canEditManual(level)) {
      return NextResponse.json(
        { error: 'マニュアルの更新権限がありません' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, description, adminOnly } = body

    const manual = await prisma.manual.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(adminOnly !== undefined && { adminOnly }),
        updatedBy: session.user.id,
      },
      include: {
        business: true,
        creator: {
          select: { id: true, name: true },
        },
        updater: {
          select: { id: true, name: true },
        },
        blocks: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    return NextResponse.json(manual)
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
    const existingManual = await prisma.manual.findUnique({
      where: { id },
    })

    if (!existingManual) {
      return NextResponse.json(
        { error: 'マニュアルが見つかりません' },
        { status: 404 }
      )
    }

    const level = await getPermissionLevel(session.user.id, existingManual.businessId)

    if (!canEditManual(level)) {
      return NextResponse.json(
        { error: 'マニュアルの削除権限がありません' },
        { status: 403 }
      )
    }

    await prisma.manual.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete manual:', error)
    return NextResponse.json(
      { error: 'マニュアルの削除に失敗しました' },
      { status: 500 }
    )
  }
}
