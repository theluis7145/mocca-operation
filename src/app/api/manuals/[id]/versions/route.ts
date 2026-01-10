import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPermissionLevel, canEditManual } from '@/lib/permissions'

type RouteContext = {
  params: Promise<{ id: string }>
}

// GET /api/manuals/:id/versions - バージョン履歴を取得
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

    // マニュアルを取得
    const manual = await prisma.manual.findUnique({
      where: { id },
    })

    if (!manual) {
      return NextResponse.json({ error: 'マニュアルが見つかりません' }, { status: 404 })
    }

    // 権限チェック（閲覧はWORKER以上）
    const level = await getPermissionLevel(session.user.id, manual.businessId)
    if (level === 'none') {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 })
    }

    // バージョン履歴を取得
    const versions = await prisma.manualVersion.findMany({
      where: { manualId: id },
      include: {
        creator: {
          select: { id: true, name: true },
        },
      },
      orderBy: { version: 'desc' },
    })

    return NextResponse.json(versions)
  } catch (error) {
    console.error('Failed to fetch versions:', error)
    return NextResponse.json(
      { error: 'バージョン履歴の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST /api/manuals/:id/versions - 新しいバージョンを作成（スナップショット）
export async function POST(
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
    const { comment } = body

    // マニュアルを取得（ブロック含む）
    const manual = await prisma.manual.findUnique({
      where: { id },
      include: {
        blocks: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!manual) {
      return NextResponse.json({ error: 'マニュアルが見つかりません' }, { status: 404 })
    }

    // 権限チェック
    const level = await getPermissionLevel(session.user.id, manual.businessId)
    if (!canEditManual(level)) {
      return NextResponse.json({ error: 'バージョン作成権限がありません' }, { status: 403 })
    }

    // ブロックのスナップショットを作成
    const blocksSnapshot = manual.blocks.map((block) => ({
      type: block.type,
      content: block.content,
      sortOrder: block.sortOrder,
    }))

    // 新しいバージョンを作成
    const version = await prisma.manualVersion.create({
      data: {
        manualId: id,
        version: manual.version,
        title: manual.title,
        description: manual.description,
        blocks: blocksSnapshot,
        createdBy: session.user.id,
        comment,
      },
      include: {
        creator: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json(version, { status: 201 })
  } catch (error) {
    console.error('Failed to create version:', error)
    return NextResponse.json(
      { error: 'バージョンの作成に失敗しました' },
      { status: 500 }
    )
  }
}
