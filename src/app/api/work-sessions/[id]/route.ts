import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getD1Database,
  findWorkSessionById,
  deleteWorkSession,
} from '@/lib/d1'
import { getPermissionLevel, canEditManual } from '@/lib/permissions'
import type {
  D1WorkSession,
  D1WorkSessionNote,
  D1WorkSessionNotePhoto,
  D1PhotoRecord,
  D1Block,
} from '@/lib/d1'

type RouteContext = {
  params: Promise<{ id: string }>
}

// Helper types for joined query results
interface WorkSessionDetailRow extends D1WorkSession {
  u_id: string
  u_name: string
  u_email: string
  m_id: string
  m_title: string
  m_description: string | null
  m_business_id: string
  b_id: string
  b_name: string
}

interface NoteWithBlock extends D1WorkSessionNote {
  blk_id: string | null
  blk_type: string | null
  blk_content: string | null
  blk_sort_order: number | null
}

interface PhotoRecordWithBlock extends D1PhotoRecord {
  blk_id: string | null
  blk_type: string | null
  blk_content: string | null
  blk_sort_order: number | null
}

// Convert D1 work session to camelCase API response
function toWorkSessionDetailResponse(
  ws: WorkSessionDetailRow,
  blocks: D1Block[],
  notes: (NoteWithBlock & { photos: D1WorkSessionNotePhoto[] })[],
  photoRecords: PhotoRecordWithBlock[]
) {
  return {
    id: ws.id,
    manualId: ws.manual_id,
    userId: ws.user_id,
    status: ws.status,
    startedAt: ws.started_at,
    completedAt: ws.completed_at,
    user: {
      id: ws.u_id,
      name: ws.u_name,
      email: ws.u_email,
    },
    manual: {
      id: ws.m_id,
      title: ws.m_title,
      description: ws.m_description,
      businessId: ws.m_business_id,
      business: {
        id: ws.b_id,
        name: ws.b_name,
      },
      blocks: blocks.map((blk) => ({
        id: blk.id,
        type: blk.type,
        content: blk.content,
        sortOrder: blk.sort_order,
      })),
    },
    notes: notes.map((note) => ({
      id: note.id,
      workSessionId: note.work_session_id,
      blockId: note.block_id,
      content: note.content,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
      block: note.blk_id
        ? {
            id: note.blk_id,
            type: note.blk_type,
            content: note.blk_content,
            sortOrder: note.blk_sort_order,
          }
        : null,
      photos: note.photos.map((p) => ({
        id: p.id,
        imageData: p.image_data,
        createdAt: p.created_at,
      })),
    })),
    photoRecords: photoRecords.map((pr) => ({
      id: pr.id,
      workSessionId: pr.work_session_id,
      blockId: pr.block_id,
      imageData: pr.image_data,
      createdAt: pr.created_at,
      block: pr.blk_id
        ? {
            id: pr.blk_id,
            type: pr.blk_type,
            content: pr.blk_content,
            sortOrder: pr.blk_sort_order,
          }
        : null,
    })),
  }
}

// GET /api/work-sessions/:id - 作業セッション詳細
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id } = await context.params
    const db = await getD1Database()

    // 作業セッションを取得（関連情報を含む）
    const workSession = await db
      .prepare(
        `
        SELECT ws.*,
               u.id as u_id, u.name as u_name, u.email as u_email,
               m.id as m_id, m.title as m_title, m.description as m_description, m.business_id as m_business_id,
               b.id as b_id, b.name as b_name
        FROM work_sessions ws
        JOIN users u ON ws.user_id = u.id
        JOIN manuals m ON ws.manual_id = m.id
        JOIN businesses b ON m.business_id = b.id
        WHERE ws.id = ?
      `
      )
      .bind(id)
      .first<WorkSessionDetailRow>()

    if (!workSession) {
      return NextResponse.json(
        { error: '作業セッションが見つかりません' },
        { status: 404 }
      )
    }

    // 権限チェック: 本人または管理者のみ閲覧可能
    const level = await getPermissionLevel(
      session.user.id,
      workSession.m_business_id
    )
    const isOwner = workSession.user_id === session.user.id
    const isAdmin = canEditManual(level)

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'この作業セッションへのアクセス権がありません' },
        { status: 403 }
      )
    }

    // マニュアルのブロックを取得
    const blocksResult = await db
      .prepare(
        'SELECT * FROM blocks WHERE manual_id = ? ORDER BY sort_order ASC'
      )
      .bind(workSession.m_id)
      .all<D1Block>()

    // メモを取得
    const notesResult = await db
      .prepare(
        `
        SELECT n.*,
               blk.id as blk_id, blk.type as blk_type, blk.content as blk_content, blk.sort_order as blk_sort_order
        FROM work_session_notes n
        LEFT JOIN blocks blk ON n.block_id = blk.id
        WHERE n.work_session_id = ?
        ORDER BY n.created_at ASC
      `
      )
      .bind(id)
      .all<NoteWithBlock>()

    // メモの写真を取得
    const noteIds = (notesResult.results || []).map((n) => n.id)
    let notePhotos: D1WorkSessionNotePhoto[] = []
    if (noteIds.length > 0) {
      const placeholders = noteIds.map(() => '?').join(',')
      const photosResult = await db
        .prepare(
          `SELECT * FROM work_session_note_photos WHERE note_id IN (${placeholders}) ORDER BY created_at ASC`
        )
        .bind(...noteIds)
        .all<D1WorkSessionNotePhoto>()
      notePhotos = photosResult.results || []
    }

    // メモと写真を結合
    const notesWithPhotos = (notesResult.results || []).map((note) => ({
      ...note,
      photos: notePhotos.filter((p) => p.note_id === note.id),
    }))

    // 写真記録を取得
    const photoRecordsResult = await db
      .prepare(
        `
        SELECT pr.*,
               blk.id as blk_id, blk.type as blk_type, blk.content as blk_content, blk.sort_order as blk_sort_order
        FROM photo_records pr
        LEFT JOIN blocks blk ON pr.block_id = blk.id
        WHERE pr.work_session_id = ?
        ORDER BY pr.created_at ASC
      `
      )
      .bind(id)
      .all<PhotoRecordWithBlock>()

    const response = toWorkSessionDetailResponse(
      workSession,
      blocksResult.results || [],
      notesWithPhotos,
      photoRecordsResult.results || []
    )

    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to fetch work session:', error)
    return NextResponse.json(
      { error: '作業セッションの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE /api/work-sessions/:id - 作業セッション削除（キャンセル）
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id } = await context.params

    const workSession = await findWorkSessionById(id)

    if (!workSession) {
      return NextResponse.json(
        { error: '作業セッションが見つかりません' },
        { status: 404 }
      )
    }

    // 権限チェック: 本人の進行中セッションのみ削除可能
    if (workSession.user_id !== session.user.id) {
      return NextResponse.json(
        { error: '他のユーザーの作業セッションは削除できません' },
        { status: 403 }
      )
    }

    if (workSession.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: '完了済みの作業セッションは削除できません' },
        { status: 400 }
      )
    }

    await deleteWorkSession(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete work session:', error)
    return NextResponse.json(
      { error: '作業セッションの削除に失敗しました' },
      { status: 500 }
    )
  }
}
