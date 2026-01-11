import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import {
  findWorkSessionById,
  findWorkSessionNoteById,
  findWorkSessionNotePhotoById,
  createWorkSessionNotePhoto,
  deleteWorkSessionNotePhoto,
} from '@/lib/d1'
import type { D1WorkSessionNotePhoto } from '@/lib/d1'

// R2の公開ドメイン
const R2_PUBLIC_DOMAIN = 'pub-372d9b9361ec437c8c65f250c96b9e42.r2.dev'

type RouteContext = {
  params: Promise<{ id: string; noteId: string }>
}

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
    if (!hasValidSession(request)) {
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
    const key = `work-sessions/${workSessionId}/notes/${noteId}/${timestamp}.${extension}`

    await r2.put(key, buffer, {
      httpMetadata: { contentType: mimeType },
    })

    const imageUrl = `https://${R2_PUBLIC_DOMAIN}/${key}`

    // 写真を保存（URLを保存）
    const photo = await createWorkSessionNotePhoto(noteId, imageUrl)

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
    if (!hasValidSession(request)) {
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
