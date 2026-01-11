import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getD1Database,
  completeWorkSession,
  createNotification,
} from '@/lib/d1'
import type { D1WorkSession, D1Block, D1WorkSessionNote } from '@/lib/d1'

type RouteContext = {
  params: Promise<{ id: string }>
}

// Helper types for joined query results
interface WorkSessionWithDetails extends D1WorkSession {
  u_id: string
  u_name: string
  m_title: string
  m_business_id: string
}

// POST /api/work-sessions/:id/complete - 作業完了
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id } = await context.params
    const db = await getD1Database()

    // 作業セッションを取得
    const workSession = await db
      .prepare(
        `
        SELECT ws.*,
               u.id as u_id, u.name as u_name,
               m.title as m_title, m.business_id as m_business_id
        FROM work_sessions ws
        JOIN users u ON ws.user_id = u.id
        JOIN manuals m ON ws.manual_id = m.id
        WHERE ws.id = ?
      `
      )
      .bind(id)
      .first<WorkSessionWithDetails>()

    if (!workSession) {
      return NextResponse.json(
        { error: '作業セッションが見つかりません' },
        { status: 404 }
      )
    }

    // 本人のみ完了可能
    if (workSession.user_id !== session.user.id) {
      return NextResponse.json(
        { error: '他のユーザーの作業セッションは完了できません' },
        { status: 403 }
      )
    }

    if (workSession.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'この作業セッションは既に完了しています' },
        { status: 400 }
      )
    }

    const businessId = workSession.m_business_id

    // 写真記録ブロックと撮影済み写真を取得
    const photoBlocksResult = await db
      .prepare(
        `SELECT id, sort_order, content FROM blocks WHERE manual_id = ? AND type = 'PHOTO_RECORD'`
      )
      .bind(workSession.manual_id)
      .all<D1Block>()

    const photoRecordsResult = await db
      .prepare(`SELECT block_id FROM photo_records WHERE work_session_id = ?`)
      .bind(id)
      .all<{ block_id: string }>()

    // 未撮影の写真ブロックをチェック
    const capturedPhotoBlockIds = new Set(
      (photoRecordsResult.results || []).map((photo) => photo.block_id)
    )
    const missingPhotoBlocks = (photoBlocksResult.results || []).filter(
      (block) => !capturedPhotoBlockIds.has(block.id)
    )
    const hasMissingPhotos = missingPhotoBlocks.length > 0

    // 管理者を取得（事業のADMIN + スーパー管理者）
    const adminsResult = await db
      .prepare(
        `
        SELECT DISTINCT u.id
        FROM users u
        LEFT JOIN business_access ba ON u.id = ba.user_id
        WHERE u.is_super_admin = 1
           OR (ba.business_id = ? AND ba.role = 'ADMIN')
      `
      )
      .bind(businessId)
      .all<{ id: string }>()

    const adminIds = (adminsResult.results || []).map((a) => a.id)

    // 作業セッションを完了に更新
    const updatedSession = await completeWorkSession(id)

    // メモを取得
    const notesResult = await db
      .prepare(
        `SELECT * FROM work_session_notes WHERE work_session_id = ? ORDER BY created_at ASC`
      )
      .bind(id)
      .all<D1WorkSessionNote>()

    // 各管理者に通知を作成
    for (const adminId of adminIds) {
      await createNotification({
        user_id: adminId,
        type: 'WORK_SESSION_COMPLETED',
        title: '作業完了報告',
        message: `${workSession.u_name}さんが「${workSession.m_title}」の作業を完了しました`,
        link_url: `/work-sessions/${id}`,
        related_work_session_id: id,
      })
    }

    // レスポンスを構築（camelCase）
    const response = {
      id: updatedSession!.id,
      manualId: updatedSession!.manual_id,
      userId: updatedSession!.user_id,
      status: updatedSession!.status,
      startedAt: updatedSession!.started_at,
      completedAt: updatedSession!.completed_at,
      notes: (notesResult.results || []).map((note) => ({
        id: note.id,
        workSessionId: note.work_session_id,
        blockId: note.block_id,
        content: note.content,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
      })),
      user: {
        id: workSession.u_id,
        name: workSession.u_name,
      },
      hasMissingPhotos,
      missingPhotoBlocks: missingPhotoBlocks.map((block) => ({
        id: block.id,
        sortOrder: block.sort_order,
        content: block.content,
      })),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to complete work session:', error)
    return NextResponse.json(
      { error: '作業セッションの完了に失敗しました' },
      { status: 500 }
    )
  }
}
