import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getD1Database } from '@/lib/d1'
import type { D1WorkSession } from '@/lib/d1'

// Helper to convert snake_case D1 fields to camelCase for API response
function toActiveWorkSessionResponse(ws: D1WorkSession & {
  m_id?: string
  m_title?: string
  m_business_id?: string
  b_id?: string
  b_name?: string
  b_display_name_line1?: string
  b_display_name_line2?: string
}) {
  return {
    id: ws.id,
    manualId: ws.manual_id,
    userId: ws.user_id,
    status: ws.status,
    startedAt: ws.started_at,
    completedAt: ws.completed_at,
    manual: ws.m_id ? {
      id: ws.m_id,
      title: ws.m_title,
      businessId: ws.m_business_id,
      business: ws.b_id ? {
        id: ws.b_id,
        name: ws.b_name,
        displayNameLine1: ws.b_display_name_line1,
        displayNameLine2: ws.b_display_name_line2,
      } : undefined,
    } : undefined,
  }
}

// GET /api/work-sessions/active - 現在ログインユーザーの進行中セッション一覧を取得
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const db = await getD1Database()

    // 現在進行中のセッションを取得
    const result = await db
      .prepare(`
        SELECT ws.*,
               m.id as m_id, m.title as m_title, m.business_id as m_business_id,
               b.id as b_id, b.name as b_name,
               b.display_name_line1 as b_display_name_line1,
               b.display_name_line2 as b_display_name_line2
        FROM work_sessions ws
        JOIN manuals m ON ws.manual_id = m.id
        JOIN businesses b ON m.business_id = b.id
        WHERE ws.user_id = ? AND ws.status = 'IN_PROGRESS'
        ORDER BY ws.started_at DESC
      `)
      .bind(session.user.id)
      .all<D1WorkSession & {
        m_id: string
        m_title: string
        m_business_id: string
        b_id: string
        b_name: string
        b_display_name_line1: string
        b_display_name_line2: string
      }>()

    const workSessions = (result.results || []).map(toActiveWorkSessionResponse)

    return NextResponse.json(workSessions)
  } catch (error) {
    console.error('Failed to fetch active work sessions:', error)
    return NextResponse.json(
      { error: '作業セッションの取得に失敗しました' },
      { status: 500 }
    )
  }
}
