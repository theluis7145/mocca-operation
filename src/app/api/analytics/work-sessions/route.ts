import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/analytics/work-sessions - 作業セッション統計を取得
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // 管理者権限を確認
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

    // 管理者でなければアクセス不可
    if (!user.isSuperAdmin && user.businessAccess.length === 0) {
      return NextResponse.json(
        { error: '統計情報を閲覧する権限がありません' },
        { status: 403 }
      )
    }

    // クエリパラメータから期間を取得
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')
    const userId = searchParams.get('userId')
    const manualId = searchParams.get('manualId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // アクセス可能な事業IDを取得
    let accessibleBusinessIds: string[] = []
    if (user.isSuperAdmin) {
      // スーパー管理者は全事業
      const allBusinesses = await prisma.business.findMany({
        where: { isActive: true },
        select: { id: true },
      })
      accessibleBusinessIds = allBusinesses.map((b) => b.id)
    } else {
      accessibleBusinessIds = user.businessAccess.map((a) => a.businessId)
    }

    // 特定の事業IDが指定されている場合、アクセス権を確認
    const targetBusinessIds = businessId
      ? accessibleBusinessIds.includes(businessId)
        ? [businessId]
        : []
      : accessibleBusinessIds

    if (targetBusinessIds.length === 0) {
      return NextResponse.json(
        { error: 'アクセス可能な事業がありません' },
        { status: 403 }
      )
    }

    // 日付フィルター
    const dateFilter: { gte?: Date; lte?: Date } = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      dateFilter.lte = end
    }

    // 基本クエリ条件
    const baseWhere = {
      manual: {
        businessId: { in: targetBusinessIds },
      },
      ...(Object.keys(dateFilter).length > 0 && { startedAt: dateFilter }),
      ...(userId && { userId }),
      ...(manualId && { manualId }),
    }

    // ユーザー別統計
    const userStats = await prisma.workSession.groupBy({
      by: ['userId'],
      where: baseWhere,
      _count: { id: true },
    })

    const userDetails = await Promise.all(
      userStats.map(async (stat) => {
        const userInfo = await prisma.user.findUnique({
          where: { id: stat.userId },
          select: { id: true, name: true, email: true },
        })
        const completedUserSessions = await prisma.workSession.findMany({
          where: { ...baseWhere, userId: stat.userId, status: 'COMPLETED' },
          select: { startedAt: true, completedAt: true },
        })

        // ユーザーの平均作業時間を計算
        let avgDurationMinutes = 0
        if (completedUserSessions.length > 0) {
          const totalDuration = completedUserSessions.reduce((acc, s) => {
            if (s.completedAt) {
              return acc + (s.completedAt.getTime() - s.startedAt.getTime())
            }
            return acc
          }, 0)
          avgDurationMinutes = Math.round(totalDuration / completedUserSessions.length / 1000 / 60)
        }

        return {
          user: userInfo,
          totalSessions: stat._count.id,
          averageDurationMinutes: avgDurationMinutes,
        }
      })
    )

    // マニュアル別統計
    const manualStats = await prisma.workSession.groupBy({
      by: ['manualId'],
      where: baseWhere,
      _count: { id: true },
    })

    const manualDetails = await Promise.all(
      manualStats.map(async (stat) => {
        const manual = await prisma.manual.findUnique({
          where: { id: stat.manualId },
          select: { id: true, title: true, businessId: true },
        })
        const completedManualSessions = await prisma.workSession.findMany({
          where: { ...baseWhere, manualId: stat.manualId, status: 'COMPLETED' },
          select: { startedAt: true, completedAt: true },
        })

        // マニュアルの平均作業時間を計算
        let avgDurationMinutes = 0
        if (completedManualSessions.length > 0) {
          const totalDuration = completedManualSessions.reduce((acc, s) => {
            if (s.completedAt) {
              return acc + (s.completedAt.getTime() - s.startedAt.getTime())
            }
            return acc
          }, 0)
          avgDurationMinutes = Math.round(totalDuration / completedManualSessions.length / 1000 / 60)
        }

        return {
          manual,
          totalSessions: stat._count.id,
          averageDurationMinutes: avgDurationMinutes,
        }
      })
    )

    // フィルター用のユーザー一覧を取得
    const allUsers = await prisma.user.findMany({
      where: {
        workSessions: {
          some: {
            manual: {
              businessId: { in: targetBusinessIds },
            },
          },
        },
      },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    })

    // フィルター用のマニュアル一覧を取得
    const allManuals = await prisma.manual.findMany({
      where: {
        businessId: { in: targetBusinessIds },
        workSessions: {
          some: {},
        },
      },
      select: { id: true, title: true },
      orderBy: { title: 'asc' },
    })

    return NextResponse.json({
      userStats: userDetails.sort((a, b) => b.totalSessions - a.totalSessions),
      manualStats: manualDetails.sort((a, b) => b.totalSessions - a.totalSessions),
      users: allUsers,
      manuals: allManuals,
    })
  } catch (error) {
    console.error('Failed to fetch analytics:', error)
    return NextResponse.json(
      { error: '統計情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}
