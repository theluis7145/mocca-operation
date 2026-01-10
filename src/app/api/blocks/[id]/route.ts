import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPermissionLevel, canEditManual } from '@/lib/permissions'

type RouteContext = {
  params: Promise<{ id: string }>
}

// PATCH /api/blocks/:id - ブロックを更新
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

    // ブロックを取得
    const existingBlock = await prisma.block.findUnique({
      where: { id },
      include: {
        manual: true,
      },
    })

    if (!existingBlock) {
      return NextResponse.json(
        { error: 'ブロックが見つかりません' },
        { status: 404 }
      )
    }

    const level = await getPermissionLevel(
      session.user.id,
      existingBlock.manual.businessId
    )

    if (!canEditManual(level)) {
      return NextResponse.json(
        { error: 'ブロックの更新権限がありません' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { content, type } = body

    const block = await prisma.block.update({
      where: { id },
      data: {
        ...(content !== undefined && { content }),
        ...(type !== undefined && { type }),
      },
    })

    // マニュアルの更新日時を更新
    await prisma.manual.update({
      where: { id: existingBlock.manualId },
      data: { updatedBy: session.user.id },
    })

    return NextResponse.json(block)
  } catch (error) {
    console.error('Failed to update block:', error)
    return NextResponse.json(
      { error: 'ブロックの更新に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE /api/blocks/:id - ブロックを削除
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

    // ブロックを取得
    const existingBlock = await prisma.block.findUnique({
      where: { id },
      include: {
        manual: true,
      },
    })

    if (!existingBlock) {
      return NextResponse.json(
        { error: 'ブロックが見つかりません' },
        { status: 404 }
      )
    }

    const level = await getPermissionLevel(
      session.user.id,
      existingBlock.manual.businessId
    )

    if (!canEditManual(level)) {
      return NextResponse.json(
        { error: 'ブロックの削除権限がありません' },
        { status: 403 }
      )
    }

    await prisma.block.delete({
      where: { id },
    })

    // マニュアルの更新日時を更新
    await prisma.manual.update({
      where: { id: existingBlock.manualId },
      data: { updatedBy: session.user.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete block:', error)
    return NextResponse.json(
      { error: 'ブロックの削除に失敗しました' },
      { status: 500 }
    )
  }
}
