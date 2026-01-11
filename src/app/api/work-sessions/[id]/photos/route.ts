import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import {
  findWorkSessionById,
  findBlockById,
  findPhotoRecordsBySession,
  findPhotoRecordsByBlock,
  createPhotoRecord,
} from '@/lib/d1'
import type { D1PhotoRecord } from '@/lib/d1'

// R2の公開ドメイン
const R2_PUBLIC_DOMAIN = 'pub-372d9b9361ec437c8c65f250c96b9e42.r2.dev'

// Cookie ベースの認証チェック（bcryptjs を避けるため）
function hasValidSession(request: NextRequest): boolean {
  const cookieHeader = request.headers.get('cookie') || ''
  return cookieHeader.includes('authjs.session-token') ||
         cookieHeader.includes('__Secure-authjs.session-token')
}

// Base64データをArrayBufferに変換
function base64ToArrayBuffer(base64: string): { buffer: ArrayBuffer; mimeType: string } {
  // data:image/jpeg;base64,xxxxx 形式からMIMEタイプとBase64データを抽出
  const matches = base64.match(/^data:([^;]+);base64,(.+)$/)
  if (!matches) {
    throw new Error('Invalid base64 data format')
  }
  const mimeType = matches[1]
  const base64Data = matches[2]
  const binaryString = atob(base64Data)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return { buffer: bytes.buffer, mimeType }
}

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
    if (!hasValidSession(request)) {
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
    if (!hasValidSession(request)) {
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

    // 作業セッションの存在確認
    const workSession = await findWorkSessionById(workSessionId)

    if (!workSession) {
      return NextResponse.json({ error: '作業セッションが見つかりません' }, { status: 404 })
    }

    if (workSession.status !== 'IN_PROGRESS') {
      return NextResponse.json({ error: '完了した作業セッションには写真を追加できません' }, { status: 400 })
    }

    // ブロックの存在確認
    const block = await findBlockById(blockId)

    if (!block) {
      return NextResponse.json({ error: 'ブロックが見つかりません' }, { status: 404 })
    }

    // R2にアップロード
    const { env } = await getCloudflareContext()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r2 = (env as any).R2 as {
      put(key: string, value: ArrayBuffer, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>
    } | undefined

    if (!r2) {
      console.error('R2 binding not found')
      return NextResponse.json(
        { error: 'ストレージが利用できません' },
        { status: 500 }
      )
    }

    // Base64をArrayBufferに変換
    const { buffer, mimeType } = base64ToArrayBuffer(imageData)

    // R2にアップロード
    const timestamp = Date.now()
    const extension = mimeType.split('/')[1] || 'jpg'
    const key = `work-sessions/${workSessionId}/${blockId}/${timestamp}.${extension}`

    await r2.put(key, buffer, {
      httpMetadata: { contentType: mimeType },
    })

    const imageUrl = `https://${R2_PUBLIC_DOMAIN}/${key}`

    // データベースにはURLを保存
    const photo = await createPhotoRecord({
      work_session_id: workSessionId,
      block_id: blockId,
      image_data: imageUrl,
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
