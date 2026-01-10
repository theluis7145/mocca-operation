import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPermissionLevel, canEditManual } from '@/lib/permissions'

// POST /api/manuals - マニュアルを作成
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const body = await request.json()
    const { businessId, title, description } = body

    if (!businessId || !title) {
      return NextResponse.json(
        { error: '事業IDとタイトルは必須です' },
        { status: 400 }
      )
    }

    // 事業の存在確認
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    })

    if (!business) {
      return NextResponse.json(
        { error: '事業が見つかりません' },
        { status: 404 }
      )
    }

    const level = await getPermissionLevel(session.user.id, businessId)

    if (!canEditManual(level)) {
      return NextResponse.json(
        { error: 'マニュアルの作成権限がありません' },
        { status: 403 }
      )
    }

    const manual = await prisma.manual.create({
      data: {
        businessId,
        title,
        description,
        createdBy: session.user.id,
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

    return NextResponse.json(manual, { status: 201 })
  } catch (error) {
    console.error('Failed to create manual:', error)
    return NextResponse.json(
      { error: 'マニュアルの作成に失敗しました' },
      { status: 500 }
    )
  }
}
