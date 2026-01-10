import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/work-sessions - 作業セッション一覧（管理者用）
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        isSuperAdmin: true,
        businessAccess: {
          where: { role: 'ADMIN' },
          select: { businessId: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    // 管理者でなければ空配列
    if (!user.isSuperAdmin && user.businessAccess.length === 0) {
      return NextResponse.json([])
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // スーパー管理者は全セッション、事業管理者は自分の事業のセッションのみ
    const adminBusinessIds = user.businessAccess.map((a) => a.businessId)

    const workSessions = await prisma.workSession.findMany({
      where: {
        ...(status && { status: status as 'IN_PROGRESS' | 'COMPLETED' }),
        ...(user.isSuperAdmin
          ? {}
          : {
              manual: {
                businessId: { in: adminBusinessIds },
              },
            }),
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
        manual: {
          select: {
            id: true,
            title: true,
            business: {
              select: { id: true, name: true },
            },
          },
        },
        notes: {
          select: { id: true },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: limit,
      skip: offset,
    })

    return NextResponse.json(workSessions)
  } catch (error) {
    console.error('Failed to fetch work sessions:', error)
    return NextResponse.json(
      { error: '作業セッションの取得に失敗しました' },
      { status: 500 }
    )
  }
}
