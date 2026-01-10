import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  findWorkSessionById,
  findBlockById,
  findPhotoRecordsBySession,
  findPhotoRecordsByBlock,
  createPhotoRecord,
} from '@/lib/d1'
import type { D1PhotoRecord } from '@/lib/d1'

// Helper to convert photo record to camelCase response
function toPhotoRecordResponse(photo: D1PhotoRecord) {
  return {
    id: photo.id,
    workSessionId: photo.work_session_id,
    blockId: photo.block_id,
    imageData: photo.image_data,
    createdAt: photo.created_at,
  }
}

// GET /api/work-sessions/[id]/photos - 写真一覧を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id: workSessionId } = await params
    const { searchParams } = new URL(request.url)
    const blockId = searchParams.get('blockId')

    // 作業セッションの存在確認
    const workSession = await findWorkSessionById(workSessionId)

    if (!workSession) {
      return NextResponse.json({ error: '作業セッションが見つかりません' }, { status: 404 })
    }

    // 写真を取得
    let photos: D1PhotoRecord[]
    if (blockId) {
      photos = await findPhotoRecordsByBlock(workSessionId, blockId)
    } else {
      photos = await findPhotoRecordsBySession(workSessionId)
    }

    return NextResponse.json(photos.map(toPhotoRecordResponse))
  } catch (error) {
    console.error('Failed to fetch photos:', error)
    return NextResponse.json(
      { error: '写真の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST /api/work-sessions/[id]/photos - 写真を追加
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id: workSessionId } = await params
    const body = await request.json()
    const { blockId, imageData } = body

    if (!blockId || !imageData) {
      return NextResponse.json(
        { error: 'blockIdとimageDataは必須です' },
        { status: 400 }
      )
    }

    // 作業セッションの存在確認と権限チェック
    const workSession = await findWorkSessionById(workSessionId)

    if (!workSession) {
      return NextResponse.json({ error: '作業セッションが見つかりません' }, { status: 404 })
    }

    if (workSession.user_id !== session.user.id) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    if (workSession.status !== 'IN_PROGRESS') {
      return NextResponse.json({ error: '完了した作業セッションには写真を追加できません' }, { status: 400 })
    }

    // ブロックの存在確認
    const block = await findBlockById(blockId)

    if (!block) {
      return NextResponse.json({ error: 'ブロックが見つかりません' }, { status: 404 })
    }

    // 写真を保存
    const photo = await createPhotoRecord({
      work_session_id: workSessionId,
      block_id: blockId,
      image_data: imageData,
    })

    return NextResponse.json(toPhotoRecordResponse(photo))
  } catch (error) {
    console.error('Failed to save photo:', error)
    return NextResponse.json(
      { error: '写真の保存に失敗しました' },
      { status: 500 }
    )
  }
}
