import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  findBlockWithManual,
  findBlockMemosForUser,
  createBlockMemo,
  findUserById,
  findBusinessAccessUserIds,
  findSuperAdminIds,
  createNotificationsForUsers,
} from '@/lib/d1'

type RouteContext = {
  params: Promise<{ id: string }>
}

// GET /api/blocks/:id/memos - ブロックのメモ一覧を取得
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id: blockId } = await context.params

    // ブロックの存在確認
    const block = await findBlockWithManual(blockId)

    if (!block) {
      return NextResponse.json(
        { error: 'ブロックが見つかりません' },
        { status: 404 }
      )
    }

    // メモを取得（自分のメモ + 公開メモ）
    const memos = await findBlockMemosForUser(blockId, session.user.id)

    // snake_case を camelCase に変換してレスポンス
    const response = memos.map(memo => ({
      id: memo.id,
      blockId: memo.block_id,
      userId: memo.user_id,
      content: memo.content,
      visibility: memo.visibility,
      createdAt: memo.created_at,
      updatedAt: memo.updated_at,
      user: memo.user,
    }))

    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to fetch memos:', error)
    return NextResponse.json(
      { error: 'メモの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST /api/blocks/:id/memos - メモを作成
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id: blockId } = await context.params
    const body = await request.json()
    const { content, visibility = 'PRIVATE' } = body

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'メモの内容を入力してください' },
        { status: 400 }
      )
    }

    // ブロックの存在確認（マニュアル情報含む）
    const block = await findBlockWithManual(blockId)

    if (!block) {
      return NextResponse.json(
        { error: 'ブロックが見つかりません' },
        { status: 404 }
      )
    }

    // メモを作成
    const memo = await createBlockMemo({
      block_id: blockId,
      user_id: session.user.id,
      content,
      visibility,
    })

    // ユーザー情報を取得
    const user = await findUserById(session.user.id)

    // 公開メモの場合、同じ事業のユーザーに通知を作成
    if (visibility === 'PUBLIC') {
      const businessId = block.manual.business_id

      // 同じ事業にアクセス権のあるユーザーを取得（自分以外）
      const usersWithAccess = await findBusinessAccessUserIds(businessId, session.user.id)

      // スーパー管理者も取得（自分以外）
      const superAdmins = await findSuperAdminIds(session.user.id)

      const uniqueUserIds = [...new Set([...usersWithAccess, ...superAdmins])]

      // 通知を作成
      if (uniqueUserIds.length > 0) {
        await createNotificationsForUsers(uniqueUserIds, {
          type: 'NEW_PUBLIC_MEMO',
          title: '新しい公開メモ',
          message: `${session.user.name}さんが「${block.manual.title}」にメモを追加しました`,
          link_url: `/manual/${block.manual.id}`,
          related_memo_id: memo.id,
        })
      }
    }

    // snake_case を camelCase に変換してレスポンス
    const response = {
      id: memo.id,
      blockId: memo.block_id,
      userId: memo.user_id,
      content: memo.content,
      visibility: memo.visibility,
      createdAt: memo.created_at,
      updatedAt: memo.updated_at,
      user: user ? { id: user.id, name: user.name } : null,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Failed to create memo:', error)
    return NextResponse.json(
      { error: 'メモの作成に失敗しました' },
      { status: 500 }
    )
  }
}
