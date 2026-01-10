import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE /api/work-sessions/[id]/photos/[photoId] - 写真を削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id: workSessionId, photoId } = await params

    // 作業セッションの存在確認と権限チェック
    const workSession = await prisma.workSession.findUnique({
      where: { id: workSessionId },
    })

    if (!workSession) {
      return NextResponse.json({ error: '作業セッションが見つかりません' }, { status: 404 })
    }

    if (workSession.userId !== session.user.id) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    if (workSession.status !== 'IN_PROGRESS') {
      return NextResponse.json({ error: '完了した作業セッションの写真は削除できません' }, { status: 400 })
    }

    // 写真の存在確認
    const photo = await prisma.photoRecord.findUnique({
      where: { id: photoId },
    })

    if (!photo) {
      return NextResponse.json({ error: '写真が見つかりません' }, { status: 404 })
    }

    if (photo.workSessionId !== workSessionId) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    // 写真を削除
    await prisma.photoRecord.delete({
      where: { id: photoId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete photo:', error)
    return NextResponse.json(
      { error: '写真の削除に失敗しました' },
      { status: 500 }
    )
  }
}
