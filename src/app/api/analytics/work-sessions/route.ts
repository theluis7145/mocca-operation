import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getUserAdminAccess,
  getActiveBusinessIds,
  getSessionStatsByUser,
  getSessionStatsByManual,
  getCompletedSessionsByUser,
  getCompletedSessionsByManual,
  getUsersWithWorkSessions,
  getManualsWithWorkSessions,
  findUserById,
  findManualById,
} from '@/lib/d1'

// GET /api/analytics/work-sessions - 作業セッション統計を取得
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // 管理者権限を確認
    const user = await getUserAdminAccess(session.user.id)

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    // 管理者でなければアクセス不可
    if (!user.is_super_admin && user.admin_business_ids.length === 0) {
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
    if (user.is_super_admin) {
      // スーパー管理者は全事業
      accessibleBusinessIds = await getActiveBusinessIds()
    } else {
      accessibleBusinessIds = user.admin_business_ids
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
    const filters: {
      userId?: string
      manualId?: string
      startDate?: string
      endDate?: string
    } = {}

    if (userId) filters.userId = userId
    if (manualId) filters.manualId = manualId
    if (startDate) filters.startDate = startDate
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      filters.endDate = end.toISOString()
    }

    // ユーザー別統計
    const userStats = await getSessionStatsByUser(targetBusinessIds, filters)

    const userDetails = await Promise.all(
      userStats.map(async (stat) => {
        const userInfo = await findUserById(stat.user_id)
        const completedSessions = await getCompletedSessionsByUser(
          targetBusinessIds,
          stat.user_id,
          { manualId: filters.manualId, startDate: filters.startDate, endDate: filters.endDate }
        )

        // ユーザーの平均作業時間を計算
        let avgDurationMinutes = 0
        if (completedSessions.length > 0) {
          const totalDuration = completedSessions.reduce((acc, s) => {
            if (s.completed_at) {
              return acc + (new Date(s.completed_at).getTime() - new Date(s.started_at).getTime())
            }
            return acc
          }, 0)
          avgDurationMinutes = Math.round(totalDuration / completedSessions.length / 1000 / 60)
        }

        return {
          user: userInfo ? { id: userInfo.id, name: userInfo.name, email: userInfo.email } : null,
          totalSessions: stat.session_count,
          averageDurationMinutes: avgDurationMinutes,
        }
      })
    )

    // マニュアル別統計
    const manualStats = await getSessionStatsByManual(targetBusinessIds, filters)

    const manualDetails = await Promise.all(
      manualStats.map(async (stat) => {
        const manual = await findManualById(stat.manual_id)
        const completedSessions = await getCompletedSessionsByManual(
          targetBusinessIds,
          stat.manual_id,
          { userId: filters.userId, startDate: filters.startDate, endDate: filters.endDate }
        )

        // マニュアルの平均作業時間を計算
        let avgDurationMinutes = 0
        if (completedSessions.length > 0) {
          const totalDuration = completedSessions.reduce((acc, s) => {
            if (s.completed_at) {
              return acc + (new Date(s.completed_at).getTime() - new Date(s.started_at).getTime())
            }
            return acc
          }, 0)
          avgDurationMinutes = Math.round(totalDuration / completedSessions.length / 1000 / 60)
        }

        return {
          manual: manual ? { id: manual.id, title: manual.title, businessId: manual.business_id } : null,
          totalSessions: stat.session_count,
          averageDurationMinutes: avgDurationMinutes,
        }
      })
    )

    // フィルター用のユーザー一覧を取得
    const allUsers = await getUsersWithWorkSessions(targetBusinessIds)

    // フィルター用のマニュアル一覧を取得
    const allManuals = await getManualsWithWorkSessions(targetBusinessIds)

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
