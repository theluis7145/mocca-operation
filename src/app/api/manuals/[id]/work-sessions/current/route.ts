import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  findManualById,
  findActiveWorkSession,
  findWorkSessionNotesBySession,
  findWorkSessionNotePhotosByNote,
  findPhotoRecordsBySession,
  findBlockById,
  findUserById,
  type D1WorkSession,
  type D1WorkSessionNote,
  type D1WorkSessionNotePhoto,
  type D1PhotoRecord,
} from '@/lib/d1'
import { getPermissionLevel, canViewManual } from '@/lib/permissions'

type RouteContext = {
  params: Promise<{ id: string }>
}

// D1のノートフォトをcamelCaseに変換
function toNotePhotoResponse(photo: D1WorkSessionNotePhoto) {
  return {
    id: photo.id,
    imageData: photo.image_data,
    createdAt: photo.created_at,
  }
}

// D1のノートをcamelCaseに変換（ブロック情報とフォト付き）
function toNoteResponse(
  note: D1WorkSessionNote,
  block?: { id: string; sortOrder: number },
  photos?: D1WorkSessionNotePhoto[]
) {
  return {
    id: note.id,
    workSessionId: note.work_session_id,
    blockId: note.block_id,
    content: note.content,
    createdAt: note.created_at,
    updatedAt: note.updated_at,
    block,
    photos: photos?.map(toNotePhotoResponse) || [],
  }
}

// D1のPhotoRecordをcamelCaseに変換
function toPhotoRecordResponse(record: D1PhotoRecord) {
  return {
    id: record.id,
    blockId: record.block_id,
    createdAt: record.created_at,
  }
}

// D1のWorkSessionをcamelCaseに変換
function toWorkSessionResponse(
  session: D1WorkSession,
  options?: {
    user?: { id: string; name: string }
    notes?: Array<ReturnType<typeof toNoteResponse>>
    photoRecords?: D1PhotoRecord[]
  }
) {
  return {
    id: session.id,
    manualId: session.manual_id,
    userId: session.user_id,
    status: session.status,
    startedAt: session.started_at,
    completedAt: session.completed_at,
    user: options?.user,
    notes: options?.notes || [],
    photoRecords: options?.photoRecords?.map(toPhotoRecordResponse) || [],
  }
}

// GET /api/manuals/:id/work-sessions/current - 現在の進行中セッションを取得
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id: manualId } = await context.params

    // マニュアルを取得
    const manual = await findManualById(manualId)

    if (!manual) {
      return NextResponse.json(
        { error: 'マニュアルが見つかりません' },
        { status: 404 }
      )
    }

    const level = await getPermissionLevel(session.user.id, manual.business_id)

    if (!canViewManual(level)) {
      return NextResponse.json(
        { error: 'このマニュアルへのアクセス権がありません' },
        { status: 403 }
      )
    }

    // 現在進行中のセッションを取得
    const workSession = await findActiveWorkSession(manualId, session.user.id)

    if (!workSession) {
      return NextResponse.json(null)
    }

    // ユーザー情報を取得
    const user = await findUserById(workSession.user_id)

    // ノートを取得
    const notes = await findWorkSessionNotesBySession(workSession.id)

    // 各ノートにブロック情報とフォトを追加
    const notesWithRelations = await Promise.all(
      notes.map(async (note) => {
        const block = await findBlockById(note.block_id)
        const photos = await findWorkSessionNotePhotosByNote(note.id)
        return toNoteResponse(
          note,
          block ? { id: block.id, sortOrder: block.sort_order } : undefined,
          photos
        )
      })
    )

    // フォトレコードを取得
    const photoRecords = await findPhotoRecordsBySession(workSession.id)

    return NextResponse.json(
      toWorkSessionResponse(workSession, {
        user: user ? { id: user.id, name: user.name } : undefined,
        notes: notesWithRelations,
        photoRecords,
      })
    )
  } catch (error) {
    console.error('Failed to fetch current work session:', error)
    return NextResponse.json(
      { error: '作業セッションの取得に失敗しました' },
      { status: 500 }
    )
  }
}
