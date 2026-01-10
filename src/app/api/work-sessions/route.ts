import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getD1Database,
  findUserById,
  findBusinessAccessesByUser,
} from '@/lib/d1'
import type { D1WorkSession, D1User, D1Manual, D1Business, D1WorkSessionNote } from '@/lib/d1'

// Helper to convert snake_case D1 fields to camelCase for API response
function toWorkSessionResponse(ws: D1WorkSession & {
  u_id?: string
  u_name?: string
  m_id?: string
  m_title?: string
  b_id?: string
  b_name?: string
  note_count?: number
}) {
  return {
    id: ws.id,
    manualId: ws.manual_id,
    userId: ws.user_id,
    status: ws.status,
    startedAt: ws.started_at,
    completedAt: ws.completed_at,
    user: ws.u_id ? {
      id: ws.u_id,
      name: ws.u_name,
    } : undefined,
    manual: ws.m_id ? {
      id: ws.m_id,
      title: ws.m_title,
      business: ws.b_id ? {
        id: ws.b_id,
        name: ws.b_name,
      } : undefined,
    } : undefined,
    notes: ws.note_count !== undefined ? Array(ws.note_count).fill({ id: '' }) : undefined,
  }
}

// GET /api/work-sessions - 作業セッション一覧（管理者用）
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const db = await getD1Database()

    // ユーザー情報を取得
    const user = await findUserById(session.user.id)

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    // 管理者権限を持つ事業IDを取得
    const businessAccesses = await findBusinessAccessesByUser(session.user.id)
    const adminBusinessIds = businessAccesses
      .filter((a) => a.role === 'ADMIN')
      .map((a) => a.business_id)

    // 管理者でなければ空配列
    if (!user.is_super_admin && adminBusinessIds.length === 0) {
      return NextResponse.json([])
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // スーパー管理者は全セッション、事業管理者は自分の事業のセッションのみ
    let query: string
    let params: unknown[]

    if (user.is_super_admin) {
      query = `
        SELECT ws.*,
               u.id as u_id, u.name as u_name,
               m.id as m_id, m.title as m_title,
               b.id as b_id, b.name as b_name,
               (SELECT COUNT(*) FROM work_session_notes WHERE work_session_id = ws.id) as note_count
        FROM work_sessions ws
        JOIN users u ON ws.user_id = u.id
        JOIN manuals m ON ws.manual_id = m.id
        JOIN businesses b ON m.business_id = b.id
        ${status ? 'WHERE ws.status = ?' : ''}
        ORDER BY ws.started_at DESC
        LIMIT ? OFFSET ?
      `
      params = status ? [status, limit, offset] : [limit, offset]
    } else {
      const placeholders = adminBusinessIds.map(() => '?').join(',')
      query = `
        SELECT ws.*,
               u.id as u_id, u.name as u_name,
               m.id as m_id, m.title as m_title,
               b.id as b_id, b.name as b_name,
               (SELECT COUNT(*) FROM work_session_notes WHERE work_session_id = ws.id) as note_count
        FROM work_sessions ws
        JOIN users u ON ws.user_id = u.id
        JOIN manuals m ON ws.manual_id = m.id
        JOIN businesses b ON m.business_id = b.id
        WHERE m.business_id IN (${placeholders})
        ${status ? 'AND ws.status = ?' : ''}
        ORDER BY ws.started_at DESC
        LIMIT ? OFFSET ?
      `
      params = status
        ? [...adminBusinessIds, status, limit, offset]
        : [...adminBusinessIds, limit, offset]
    }

    const result = await db
      .prepare(query)
      .bind(...params)
      .all<D1WorkSession & {
        u_id: string
        u_name: string
        m_id: string
        m_title: string
        b_id: string
        b_name: string
        note_count: number
      }>()

    const workSessions = (result.results || []).map(toWorkSessionResponse)

    return NextResponse.json(workSessions)
  } catch (error) {
    console.error('Failed to fetch work sessions:', error)
    return NextResponse.json(
      { error: '作業セッションの取得に失敗しました' },
      { status: 500 }
    )
  }
}
