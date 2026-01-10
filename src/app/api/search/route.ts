import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/search - マニュアルとブロックを検索
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()
    const businessId = searchParams.get('businessId')
    const statusFilter = searchParams.get('status') // 'PUBLISHED' or 'DRAFT' or null (all)

    if (!query || query.length < 2) {
      return NextResponse.json({ error: '検索キーワードは2文字以上で入力してください' }, { status: 400 })
    }

    // ユーザーがアクセス可能な事業IDを取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        isSuperAdmin: true,
        businessAccess: {
          select: { businessId: true, role: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    // アクセス可能な事業IDのリスト
    let accessibleBusinessIds: string[] = []
    let isAdmin = user.isSuperAdmin

    if (user.isSuperAdmin) {
      // スーパー管理者は全事業にアクセス可能
      if (businessId) {
        accessibleBusinessIds = [businessId]
      } else {
        const allBusinesses = await prisma.business.findMany({
          where: { isActive: true },
          select: { id: true },
        })
        accessibleBusinessIds = allBusinesses.map((b) => b.id)
      }
    } else {
      // 通常ユーザーはアクセス権のある事業のみ
      accessibleBusinessIds = user.businessAccess.map((a) => a.businessId)
      if (businessId && accessibleBusinessIds.includes(businessId)) {
        accessibleBusinessIds = [businessId]
        isAdmin = user.businessAccess.find((a) => a.businessId === businessId)?.role === 'ADMIN'
      }
    }

    if (accessibleBusinessIds.length === 0) {
      return NextResponse.json({ manuals: [], blocks: [] })
    }

    // ステータスフィルターの設定
    const statusCondition = isAdmin
      ? statusFilter
        ? { status: statusFilter as 'PUBLISHED' | 'DRAFT' }
        : {}
      : { status: 'PUBLISHED' as const } // WORKERは公開マニュアルのみ

    // マニュアルを検索（タイトルと説明）- SQLiteなのでcase insensitiveは使わない
    const manuals = await prisma.manual.findMany({
      where: {
        businessId: { in: accessibleBusinessIds },
        isArchived: false, // アーカイブ済みは除外
        OR: [
          { title: { contains: query } },
          { description: { contains: query } },
        ],
        ...statusCondition,
      },
      include: {
        business: {
          select: { id: true, displayNameLine1: true, displayNameLine2: true },
        },
        _count: { select: { blocks: true } },
      },
      take: 10,
      orderBy: { updatedAt: 'desc' },
    })

    // ブロックを検索（テキストコンテンツ）
    // SQLiteではJSON path検索が限定的なので、まず関連するマニュアルのブロックを取得してフィルタリング
    const allBlocks = await prisma.block.findMany({
      where: {
        manual: {
          businessId: { in: accessibleBusinessIds },
          isArchived: false,
          ...statusCondition,
        },
        type: { in: ['TEXT', 'WARNING', 'CHECKPOINT'] },
      },
      include: {
        manual: {
          select: {
            id: true,
            title: true,
            business: {
              select: { id: true, displayNameLine1: true, displayNameLine2: true },
            },
          },
        },
      },
      take: 100, // 大きめに取得してからフィルタ
      orderBy: { updatedAt: 'desc' },
    })

    // テキスト内容でフィルタリング
    const queryLower = query.toLowerCase()
    const filteredBlocks = allBlocks.filter((block) => {
      const content = block.content as Record<string, unknown>
      if (block.type === 'TEXT' || block.type === 'WARNING') {
        const text = (content.text as string) || ''
        return text.toLowerCase().includes(queryLower)
      } else if (block.type === 'CHECKPOINT') {
        const title = (content.title as string) || ''
        return title.toLowerCase().includes(queryLower)
      }
      return false
    }).slice(0, 10) // 最大10件

    // ブロックの検索結果を整形
    const formattedBlocks = filteredBlocks.map((block) => {
      const content = block.content as Record<string, unknown>
      let excerpt = ''

      if (block.type === 'TEXT' || block.type === 'WARNING') {
        const text = (content.text as string) || ''
        const index = text.toLowerCase().indexOf(queryLower)
        if (index >= 0) {
          const start = Math.max(0, index - 30)
          const end = Math.min(text.length, index + query.length + 30)
          excerpt = (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '')
        } else {
          excerpt = text.slice(0, 60) + (text.length > 60 ? '...' : '')
        }
      } else if (block.type === 'CHECKPOINT') {
        excerpt = (content.title as string) || ''
      }

      return {
        id: block.id,
        type: block.type,
        excerpt,
        manual: block.manual,
      }
    })

    return NextResponse.json({
      manuals: manuals.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        status: m.status,
        business: m.business,
        blockCount: m._count.blocks,
      })),
      blocks: formattedBlocks,
    })
  } catch (error) {
    console.error('Search failed:', error)
    return NextResponse.json(
      { error: '検索に失敗しました' },
      { status: 500 }
    )
  }
}
