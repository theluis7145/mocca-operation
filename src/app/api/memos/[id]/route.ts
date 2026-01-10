import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  findBlockMemoById,
  findBlockMemoWithUser,
  updateBlockMemo,
  deleteBlockMemo,
} from '@/lib/d1'

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
    const existingMemo = await findBlockMemoById(id)

    if (!existingMemo) {
      return NextResponse.json(
        { error: 'メモが見つかりません' },
        { status: 404 }
      )
    }

    // 自分のメモでない場合は編集不可
    if (existingMemo.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'このメモを編集する権限がありません' },
        { status: 403 }
      )
    }

    await updateBlockMemo(id, {
      ...(content !== undefined && { content }),
      ...(visibility !== undefined && { visibility }),
    })

    // 更新後のメモを取得（ユーザー情報含む）
    const memo = await findBlockMemoWithUser(id)

    if (!memo) {
      return NextResponse.json(
        { error: 'メモの取得に失敗しました' },
        { status: 500 }
      )
    }

    // snake_case を camelCase に変換してレスポンス
    return NextResponse.json({
      id: memo.id,
      blockId: memo.block_id,
      userId: memo.user_id,
      content: memo.content,
      visibility: memo.visibility,
      createdAt: memo.created_at,
      updatedAt: memo.updated_at,
      user: memo.user,
    })
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
    const existingMemo = await findBlockMemoById(id)

    if (!existingMemo) {
      return NextResponse.json(
        { error: 'メモが見つかりません' },
        { status: 404 }
      )
    }

    // 自分のメモでない場合は削除不可（スーパー管理者は削除可能）
    if (existingMemo.user_id !== session.user.id && !session.user.isSuperAdmin) {
      return NextResponse.json(
        { error: 'このメモを削除する権限がありません' },
        { status: 403 }
      )
    }

    await deleteBlockMemo(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete memo:', error)
    return NextResponse.json(
      { error: 'メモの削除に失敗しました' },
      { status: 500 }
    )
  }
}
