import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPermissionLevel, canEditManual } from '@/lib/permissions'

type RouteContext = {
  params: Promise<{ id: string }>
}

// GET /api/businesses/:id/manuals/archived - アーカイブ済みマニュアル一覧を取得
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id: businessId } = await context.params

    // 権限確認（管理者のみ閲覧可能）
    const level = await getPermissionLevel(session.user.id, businessId)

    if (!canEditManual(level)) {
      return NextResponse.json(
        { error: 'アーカイブ済みマニュアルを閲覧する権限がありません' },
        { status: 403 }
      )
    }

    // アーカイブ済みマニュアルを取得
    const manuals = await prisma.manual.findMany({
      where: {
        businessId,
        isArchived: true,
      },
      orderBy: { archivedAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        adminOnly: true,
        archivedAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(manuals)
  } catch (error) {
    console.error('Failed to fetch archived manuals:', error)
    return NextResponse.json(
      { error: 'アーカイブ済みマニュアルの取得に失敗しました' },
      { status: 500 }
    )
  }
}
