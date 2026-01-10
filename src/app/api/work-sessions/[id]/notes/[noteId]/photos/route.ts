import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type RouteContext = {
  params: Promise<{ id: string; noteId: string }>
}

// POST /api/work-sessions/:id/notes/:noteId/photos - 申し送りメモに写真を追加
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
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
    const workSession = await prisma.workSession.findUnique({
      where: { id: workSessionId },
    })

    if (!workSession) {
      return NextResponse.json(
        { error: '作業セッションが見つかりません' },
        { status: 404 }
      )
    }

    // 本人のみ追加可能
    if (workSession.userId !== session.user.id) {
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
    const note = await prisma.workSessionNote.findUnique({
      where: { id: noteId },
    })

    if (!note) {
      return NextResponse.json(
        { error: 'メモが見つかりません' },
        { status: 404 }
      )
    }

    if (note.workSessionId !== workSessionId) {
      return NextResponse.json(
        { error: 'メモは指定された作業セッションに属していません' },
        { status: 400 }
      )
    }

    // 写真を保存
    const photo = await prisma.workSessionNotePhoto.create({
      data: {
        noteId,
        imageData,
      },
    })

    return NextResponse.json(photo, { status: 201 })
  } catch (error) {
    console.error('Failed to save note photo:', error)
    return NextResponse.json(
      { error: '写真の保存に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE /api/work-sessions/:id/notes/:noteId/photos/:photoId - 写真を削除
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
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
    const workSession = await prisma.workSession.findUnique({
      where: { id: workSessionId },
    })

    if (!workSession) {
      return NextResponse.json(
        { error: '作業セッションが見つかりません' },
        { status: 404 }
      )
    }

    // 本人のみ削除可能
    if (workSession.userId !== session.user.id) {
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
    const photo = await prisma.workSessionNotePhoto.findUnique({
      where: { id: photoId },
      include: { note: true },
    })

    if (!photo) {
      return NextResponse.json(
        { error: '写真が見つかりません' },
        { status: 404 }
      )
    }

    if (photo.noteId !== noteId) {
      return NextResponse.json(
        { error: '写真は指定されたメモに属していません' },
        { status: 400 }
      )
    }

    // 写真を削除
    await prisma.workSessionNotePhoto.delete({
      where: { id: photoId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete note photo:', error)
    return NextResponse.json(
      { error: '写真の削除に失敗しました' },
      { status: 500 }
    )
  }
}
