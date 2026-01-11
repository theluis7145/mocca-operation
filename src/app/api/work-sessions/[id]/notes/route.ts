import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getD1Database,
  findWorkSessionById,
  findUserById,
  findBlockById,
  createWorkSessionNote,
  updateWorkSessionNote,
} from '@/lib/d1'
import type { D1WorkSessionNote, D1WorkSessionNotePhoto } from '@/lib/d1'

type RouteContext = {
  params: Promise<{ id: string }>
}

// Helper types for joined query results
interface NoteWithBlock extends D1WorkSessionNote {
  blk_id: string | null
  blk_type: string | null
  blk_content: string | null
  blk_sort_order: number | null
}

// Helper to convert note to camelCase response
function toNoteResponse(
  note: D1WorkSessionNote,
  block?: { id: string; sortOrder: number } | null,
  photos?: { id: string; imageData: string; createdAt: string }[]
) {
  return {
    id: note.id,
    workSessionId: note.work_session_id,
    blockId: note.block_id,
    content: note.content,
    createdAt: note.created_at,
    updatedAt: note.updated_at,
    block: block || null,
    photos: photos || [],
  }
}

// POST /api/work-sessions/:id/notes - メモ追加
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id: workSessionId } = await context.params
    const body = await request.json()
    const { blockId, content } = body

    if (!blockId || !content) {
      return NextResponse.json(
        { error: 'ブロックIDと内容は必須です' },
        { status: 400 }
      )
    }

    const db = await getD1Database()

    // 作業セッションを取得
    const workSession = await findWorkSessionById(workSessionId)

    if (!workSession) {
      return NextResponse.json(
        { error: '作業セッションが見つかりません' },
        { status: 404 }
      )
    }

    // 本人のみ追加可能
    if (workSession.user_id !== session.user.id) {
      return NextResponse.json(
        { error: '他のユーザーの作業セッションにメモは追加できません' },
        { status: 403 }
      )
    }

    if (workSession.status === 'COMPLETED') {
      return NextResponse.json(
        { error: '完了済みの作業セッションにメモは追加できません' },
        { status: 400 }
      )
    }

    // ブロックが存在するか確認
    const block = await findBlockById(blockId)

    if (!block) {
      return NextResponse.json(
        { error: 'ブロックが見つかりません' },
        { status: 404 }
      )
    }

    // 既存のメモがあれば更新、なければ作成
    const existingNote = await db
      .prepare(
        `SELECT * FROM work_session_notes WHERE work_session_id = ? AND block_id = ?`
      )
      .bind(workSessionId, blockId)
      .first<D1WorkSessionNote>()

    let note: D1WorkSessionNote
    if (existingNote) {
      note = (await updateWorkSessionNote(existingNote.id, content))!
    } else {
      note = await createWorkSessionNote({
        work_session_id: workSessionId,
        block_id: blockId,
        content,
      })
    }

    const response = toNoteResponse(note, {
      id: block.id,
      sortOrder: block.sort_order,
    })

    return NextResponse.json(response, { status: existingNote ? 200 : 201 })
  } catch (error) {
    console.error('Failed to create/update work session note:', error)
    return NextResponse.json(
      { error: 'メモの保存に失敗しました' },
      { status: 500 }
    )
  }
}

// GET /api/work-sessions/:id/notes - メモ一覧取得
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id: workSessionId } = await context.params
    const db = await getD1Database()

    // 作業セッションを取得
    const workSession = await db
      .prepare(
        `
        SELECT ws.*, m.business_id as m_business_id
        FROM work_sessions ws
        JOIN manuals m ON ws.manual_id = m.id
        WHERE ws.id = ?
      `
      )
      .bind(workSessionId)
      .first<{ user_id: string; m_business_id: string }>()

    if (!workSession) {
      return NextResponse.json(
        { error: '作業セッションが見つかりません' },
        { status: 404 }
      )
    }

    // 本人または管理者のみ閲覧可能
    const user = await findUserById(session.user.id)

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    // 管理者権限チェック
    const adminAccess = await db
      .prepare(
        `SELECT id FROM business_access WHERE user_id = ? AND business_id = ? AND role = 'ADMIN'`
      )
      .bind(session.user.id, workSession.m_business_id)
      .first()

    const isOwner = workSession.user_id === session.user.id
    const isAdmin = user.is_super_admin || adminAccess !== null

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'このセッションのメモへのアクセス権がありません' },
        { status: 403 }
      )
    }

    // メモを取得（ブロック情報付き）
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
      .bind(workSessionId)
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

    // レスポンスを構築
    const notes = (notesResult.results || []).map((note) => ({
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
      photos: notePhotos
        .filter((p) => p.note_id === note.id)
        .map((p) => ({
          id: p.id,
          imageData: p.image_data,
          createdAt: p.created_at,
        })),
    }))

    return NextResponse.json(notes)
  } catch (error) {
    console.error('Failed to fetch work session notes:', error)
    return NextResponse.json(
      { error: 'メモの取得に失敗しました' },
      { status: 500 }
    )
  }
}
