import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { countBlockMemosForUser } from '@/lib/d1'

type RouteContext = {
  params: Promise<{ id: string }>
}

// GET /api/blocks/:id/memos/count - ブロックのメモ数を取得
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

    // メモ数をカウント（自分のメモ + 公開メモ）
    const count = await countBlockMemosForUser(blockId, session.user.id)

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Failed to count memos:', error)
    return NextResponse.json(
      { error: 'メモ数の取得に失敗しました' },
      { status: 500 }
    )
  }
}
