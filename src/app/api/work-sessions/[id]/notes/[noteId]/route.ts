import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type RouteContext = {
  params: Promise<{ id: string; noteId: string }>
}

// PATCH /api/work-sessions/:id/notes/:noteId - メモ更新
export async function PATCH(
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
    const { content } = body

    if (!content) {
      return NextResponse.json(
        { error: '内容は必須です' },
        { status: 400 }
      )
    }

    // メモを取得
    const note = await prisma.workSessionNote.findUnique({
      where: { id: noteId },
      include: {
        workSession: true,
      },
    })

    if (!note) {
      return NextResponse.json(
        { error: 'メモが見つかりません' },
        { status: 404 }
      )
    }

    // セッションIDの確認
    if (note.workSessionId !== workSessionId) {
      return NextResponse.json(
        { error: 'メモが見つかりません' },
        { status: 404 }
      )
    }

    // 本人のみ更新可能
    if (note.workSession.userId !== session.user.id) {
      return NextResponse.json(
        { error: '他のユーザーのメモは更新できません' },
        { status: 403 }
      )
    }

    if (note.workSession.status === 'COMPLETED') {
      return NextResponse.json(
        { error: '完了済みの作業セッションのメモは更新できません' },
        { status: 400 }
      )
    }

    const updatedNote = await prisma.workSessionNote.update({
      where: { id: noteId },
      data: { content },
      include: {
        block: {
          select: { id: true, sortOrder: true },
        },
      },
    })

    return NextResponse.json(updatedNote)
  } catch (error) {
    console.error('Failed to update work session note:', error)
    return NextResponse.json(
      { error: 'メモの更新に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE /api/work-sessions/:id/notes/:noteId - メモ削除
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

    // メモを取得
    const note = await prisma.workSessionNote.findUnique({
      where: { id: noteId },
      include: {
        workSession: true,
      },
    })

    if (!note) {
      return NextResponse.json(
        { error: 'メモが見つかりません' },
        { status: 404 }
      )
    }

    // セッションIDの確認
    if (note.workSessionId !== workSessionId) {
      return NextResponse.json(
        { error: 'メモが見つかりません' },
        { status: 404 }
      )
    }

    // 本人のみ削除可能
    if (note.workSession.userId !== session.user.id) {
      return NextResponse.json(
        { error: '他のユーザーのメモは削除できません' },
        { status: 403 }
      )
    }

    if (note.workSession.status === 'COMPLETED') {
      return NextResponse.json(
        { error: '完了済みの作業セッションのメモは削除できません' },
        { status: 400 }
      )
    }

    await prisma.workSessionNote.delete({
      where: { id: noteId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete work session note:', error)
    return NextResponse.json(
      { error: 'メモの削除に失敗しました' },
      { status: 500 }
    )
  }
}
