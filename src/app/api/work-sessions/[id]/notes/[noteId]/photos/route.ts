import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getD1Database,
  findWorkSessionById,
  findWorkSessionNoteById,
  findWorkSessionNotePhotoById,
  createWorkSessionNotePhoto,
  deleteWorkSessionNotePhoto,
} from '@/lib/d1'
import type { D1WorkSessionNotePhoto } from '@/lib/d1'

type RouteContext = {
  params: Promise<{ id: string; noteId: string }>
}

// Helper to convert photo to camelCase response
function toPhotoResponse(photo: D1WorkSessionNotePhoto) {
  return {
    id: photo.id,
    noteId: photo.note_id,
    imageData: photo.image_data,
    createdAt: photo.created_at,
  }
}

// POST /api/work-sessions/:id/notes/:noteId/photos - 申し送りメモに写真を追加
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id: workSessionId, noteId } = await context.params
    const body = await request.json()
    const { imageData } = body

    if (!imageData) {
      return NextResponse.json(
        { error: '画像データは必須です' },
        { status: 400 }
      )
    }

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
        { error: '他のユーザーの作業セッションに写真は追加できません' },
        { status: 403 }
      )
    }

    if (workSession.status === 'COMPLETED') {
      return NextResponse.json(
        { error: '完了済みの作業セッションに写真は追加できません' },
        { status: 400 }
      )
    }

    // メモの存在確認
    const note = await findWorkSessionNoteById(noteId)

    if (!note) {
      return NextResponse.json(
        { error: 'メモが見つかりません' },
        { status: 404 }
      )
    }

    if (note.work_session_id !== workSessionId) {
      return NextResponse.json(
        { error: 'メモは指定された作業セッションに属していません' },
        { status: 400 }
      )
    }

    // 写真を保存
    const photo = await createWorkSessionNotePhoto(noteId, imageData)

    return NextResponse.json(toPhotoResponse(photo), { status: 201 })
  } catch (error) {
    console.error('Failed to save note photo:', error)
    return NextResponse.json(
      { error: '写真の保存に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE /api/work-sessions/:id/notes/:noteId/photos/:photoId - 写真を削除
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id: workSessionId, noteId } = await context.params
    const { searchParams } = new URL(request.url)
    const photoId = searchParams.get('photoId')

    if (!photoId) {
      return NextResponse.json(
        { error: '写真IDは必須です' },
        { status: 400 }
      )
    }

    // 作業セッションを取得
    const workSession = await findWorkSessionById(workSessionId)

    if (!workSession) {
      return NextResponse.json(
        { error: '作業セッションが見つかりません' },
        { status: 404 }
      )
    }

    // 本人のみ削除可能
    if (workSession.user_id !== session.user.id) {
      return NextResponse.json(
        { error: '他のユーザーの写真は削除できません' },
        { status: 403 }
      )
    }

    if (workSession.status === 'COMPLETED') {
      return NextResponse.json(
        { error: '完了済みの作業セッションの写真は削除できません' },
        { status: 400 }
      )
    }

    // 写真の存在確認
    const photo = await findWorkSessionNotePhotoById(photoId)

    if (!photo) {
      return NextResponse.json(
        { error: '写真が見つかりません' },
        { status: 404 }
      )
    }

    if (photo.note_id !== noteId) {
      return NextResponse.json(
        { error: '写真は指定されたメモに属していません' },
        { status: 400 }
      )
    }

    // 写真を削除
    await deleteWorkSessionNotePhoto(photoId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete note photo:', error)
    return NextResponse.json(
      { error: '写真の削除に失敗しました' },
      { status: 500 }
    )
  }
}
