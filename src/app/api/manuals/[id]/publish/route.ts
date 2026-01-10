import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPermissionLevel, canEditManual } from '@/lib/permissions'

type RouteContext = {
  params: Promise<{ id: string }>
}

// POST /api/manuals/:id/publish - マニュアルの公開/下書き切替
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
        { error: 'マニュアルの公開設定権限がありません' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { status } = body

    if (status !== 'DRAFT' && status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: '無効なステータスです' },
        { status: 400 }
      )
    }

    const manual = await prisma.manual.update({
      where: { id },
      data: {
        status,
        version: status === 'PUBLISHED' ? { increment: 1 } : undefined,
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
      },
    })

    return NextResponse.json(manual)
  } catch (error) {
    console.error('Failed to update manual status:', error)
    return NextResponse.json(
      { error: 'マニュアルのステータス更新に失敗しました' },
      { status: 500 }
    )
  }
}
