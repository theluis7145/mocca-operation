import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getD1Database,
  findWorkSessionNoteById,
  updateWorkSessionNote,
  deleteWorkSessionNote,
} from '@/lib/d1'
import type { D1WorkSessionNote, D1WorkSession, D1Block } from '@/lib/d1'

type RouteContext = {
  params: Promise<{ id: string; noteId: string }>
}

// Helper type for note with work session
interface NoteWithWorkSession extends D1WorkSessionNote {
  ws_user_id: string
  ws_status: string
}

// Helper to convert note to camelCase response
function toNoteResponse(
  note: D1WorkSessionNote,
  block?: { id: string; sortOrder: number } | null
) {
  return {
    id: note.id,
    workSessionId: note.work_session_id,
    blockId: note.block_id,
    content: note.content,
    createdAt: note.created_at,
    updatedAt: note.updated_at,
    block: block || null,
  }
}

// PATCH /api/work-sessions/:id/notes/:noteId - メモ更新
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id: workSessionId, noteId } = await context.params
    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json({ error: '内容は必須です' }, { status: 400 })
    }

    const db = await getD1Database()

    // メモを取得（作業セッション情報付き）
    const note = await db
      .prepare(
        `
        SELECT n.*, ws.user_id as ws_user_id, ws.status as ws_status
        FROM work_session_notes n
        JOIN work_sessions ws ON n.work_session_id = ws.id
        WHERE n.id = ?
      `
      )
      .bind(noteId)
      .first<NoteWithWorkSession>()

    if (!note) {
      return NextResponse.json({ error: 'メモが見つかりません' }, { status: 404 })
    }

    // セッションIDの確認
    if (note.work_session_id !== workSessionId) {
      return NextResponse.json({ error: 'メモが見つかりません' }, { status: 404 })
    }

    // 本人のみ更新可能
    if (note.ws_user_id !== session.user.id) {
      return NextResponse.json(
        { error: '他のユーザーのメモは更新できません' },
        { status: 403 }
      )
    }

    if (note.ws_status === 'COMPLETED') {
      return NextResponse.json(
        { error: '完了済みの作業セッションのメモは更新できません' },
        { status: 400 }
      )
    }

    // メモを更新
    const updatedNote = await updateWorkSessionNote(noteId, content)

    // ブロック情報を取得
    const block = await db
      .prepare(`SELECT id, sort_order FROM blocks WHERE id = ?`)
      .bind(note.block_id)
      .first<{ id: string; sort_order: number }>()

    const response = toNoteResponse(updatedNote!, block ? { id: block.id, sortOrder: block.sort_order } : null)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to update work session note:', error)
    return NextResponse.json(
      { error: 'メモの更新に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE /api/work-sessions/:id/notes/:noteId - メモ削除
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id: workSessionId, noteId } = await context.params
    const db = await getD1Database()

    // メモを取得（作業セッション情報付き）
    const note = await db
      .prepare(
        `
        SELECT n.*, ws.user_id as ws_user_id, ws.status as ws_status
        FROM work_session_notes n
        JOIN work_sessions ws ON n.work_session_id = ws.id
        WHERE n.id = ?
      `
      )
      .bind(noteId)
      .first<NoteWithWorkSession>()

    if (!note) {
      return NextResponse.json({ error: 'メモが見つかりません' }, { status: 404 })
    }

    // セッションIDの確認
    if (note.work_session_id !== workSessionId) {
      return NextResponse.json({ error: 'メモが見つかりません' }, { status: 404 })
    }

    // 本人のみ削除可能
    if (note.ws_user_id !== session.user.id) {
      return NextResponse.json(
        { error: '他のユーザーのメモは削除できません' },
        { status: 403 }
      )
    }

    if (note.ws_status === 'COMPLETED') {
      return NextResponse.json(
        { error: '完了済みの作業セッションのメモは削除できません' },
        { status: 400 }
      )
    }

    await deleteWorkSessionNote(noteId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete work session note:', error)
    return NextResponse.json(
      { error: 'メモの削除に失敗しました' },
      { status: 500 }
    )
  }
}
