import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const block = await prisma.block.findUnique({
      where: { id: blockId },
      include: {
        manual: true,
      },
    })

    if (!block) {
      return NextResponse.json(
        { error: 'ブロックが見つかりません' },
        { status: 404 }
      )
    }

    // メモを取得（自分のメモ + 公開メモ）
    const memos = await prisma.blockMemo.findMany({
      where: {
        blockId,
        OR: [
          { userId: session.user.id },
          { visibility: 'PUBLIC' },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(memos)
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

    // ブロックの存在確認
    const block = await prisma.block.findUnique({
      where: { id: blockId },
      include: {
        manual: true,
      },
    })

    if (!block) {
      return NextResponse.json(
        { error: 'ブロックが見つかりません' },
        { status: 404 }
      )
    }

    // メモを作成
    const memo = await prisma.blockMemo.create({
      data: {
        blockId,
        userId: session.user.id,
        content,
        visibility,
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

    // 公開メモの場合、同じ事業のユーザーに通知を作成
    if (visibility === 'PUBLIC') {
      const businessId = block.manual.businessId

      // 同じ事業にアクセス権のあるユーザーを取得（自分以外）
      const usersWithAccess = await prisma.businessAccess.findMany({
        where: {
          businessId,
          userId: { not: session.user.id },
        },
        select: { userId: true },
      })

      // スーパー管理者も取得（自分以外）
      const superAdmins = await prisma.user.findMany({
        where: {
          isSuperAdmin: true,
          id: { not: session.user.id },
        },
        select: { id: true },
      })

      const userIds = [
        ...usersWithAccess.map((u) => u.userId),
        ...superAdmins.map((u) => u.id),
      ]
      const uniqueUserIds = [...new Set(userIds)]

      // 通知を作成
      if (uniqueUserIds.length > 0) {
        await prisma.notification.createMany({
          data: uniqueUserIds.map((userId) => ({
            userId,
            type: 'NEW_PUBLIC_MEMO',
            title: '新しい公開メモ',
            message: `${session.user.name}さんが「${block.manual.title}」にメモを追加しました`,
            linkUrl: `/manual/${block.manual.id}`,
            relatedMemoId: memo.id,
          })),
        })
      }
    }

    return NextResponse.json(memo, { status: 201 })
  } catch (error) {
    console.error('Failed to create memo:', error)
    return NextResponse.json(
      { error: 'メモの作成に失敗しました' },
      { status: 500 }
    )
  }
}
