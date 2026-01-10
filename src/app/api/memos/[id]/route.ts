import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type RouteContext = {
  params: Promise<{ id: string }>
}

// PATCH /api/memos/:id - メモを更新
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
    const body = await request.json()
    const { content, visibility } = body

    // メモの存在確認と所有権チェック
    const existingMemo = await prisma.blockMemo.findUnique({
      where: { id },
    })

    if (!existingMemo) {
      return NextResponse.json(
        { error: 'メモが見つかりません' },
        { status: 404 }
      )
    }

    // 自分のメモでない場合は編集不可
    if (existingMemo.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'このメモを編集する権限がありません' },
        { status: 403 }
      )
    }

    const memo = await prisma.blockMemo.update({
      where: { id },
      data: {
        ...(content !== undefined && { content }),
        ...(visibility !== undefined && { visibility }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(memo)
  } catch (error) {
    console.error('Failed to update memo:', error)
    return NextResponse.json(
      { error: 'メモの更新に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE /api/memos/:id - メモを削除
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

    // メモの存在確認と所有権チェック
    const existingMemo = await prisma.blockMemo.findUnique({
      where: { id },
    })

    if (!existingMemo) {
      return NextResponse.json(
        { error: 'メモが見つかりません' },
        { status: 404 }
      )
    }

    // 自分のメモでない場合は削除不可（スーパー管理者は削除可能）
    if (existingMemo.userId !== session.user.id && !session.user.isSuperAdmin) {
      return NextResponse.json(
        { error: 'このメモを削除する権限がありません' },
        { status: 403 }
      )
    }

    await prisma.blockMemo.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete memo:', error)
    return NextResponse.json(
      { error: 'メモの削除に失敗しました' },
      { status: 500 }
    )
  }
}
