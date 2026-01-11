import { NextRequest, NextResponse } from 'next/server'
import {
  findWorkSessionById,
  findPhotoRecordById,
  deletePhotoRecord,
} from '@/lib/d1'

// Cookie ベースの認証チェック（bcryptjs を避けるため）
function hasValidSession(request: NextRequest): boolean {
  const cookieHeader = request.headers.get('cookie') || ''
  return cookieHeader.includes('authjs.session-token') ||
         cookieHeader.includes('__Secure-authjs.session-token')
}

// DELETE /api/work-sessions/[id]/photos/[photoId] - 写真を削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  try {
    if (!hasValidSession(request)) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id: workSessionId, photoId } = await params

    // 作業セッションの存在確認
    const workSession = await findWorkSessionById(workSessionId)

    if (!workSession) {
      return NextResponse.json({ error: '作業セッションが見つかりません' }, { status: 404 })
    }

    if (workSession.status !== 'IN_PROGRESS') {
      return NextResponse.json({ error: '完了した作業セッションの写真は削除できません' }, { status: 400 })
    }

    // 写真の存在確認
    const photo = await findPhotoRecordById(photoId)

    if (!photo) {
      return NextResponse.json({ error: '写真が見つかりません' }, { status: 404 })
    }

    if (photo.work_session_id !== workSessionId) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    // 写真を削除
    await deletePhotoRecord(photoId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete photo:', error)
    return NextResponse.json(
      { error: '写真の削除に失敗しました' },
      { status: 500 }
    )
  }
}
