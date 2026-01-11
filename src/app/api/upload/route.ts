import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

// R2の公開ドメイン
const R2_PUBLIC_DOMAIN = 'pub-372d9b9361ec437c8c65f250c96b9e42.r2.dev'

// 許可されるファイルタイプ
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  try {
    // Cookieヘッダーから認証を確認（ミドルウェアをバイパスするため独自チェック）
    const cookieHeader = request.headers.get('cookie') || ''
    const hasSession = cookieHeader.includes('authjs.session-token') ||
                       cookieHeader.includes('__Secure-authjs.session-token')
    if (!hasSession) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const businessId = formData.get('businessId') as string | null
    const manualId = formData.get('manualId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'ファイルが選択されていません' }, { status: 400 })
    }

    if (!businessId || !manualId) {
      return NextResponse.json({ error: '事業IDとマニュアルIDが必要です' }, { status: 400 })
    }

    // ファイルタイプチェック
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: '許可されていないファイル形式です。JPEG, PNG, GIF, WebPのみ使用できます。' },
        { status: 400 }
      )
    }

    // ファイルサイズチェック
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'ファイルサイズが大きすぎます。10MB以下のファイルを選択してください。' },
        { status: 400 }
      )
    }

    // R2バインディングを取得
    const { env } = await getCloudflareContext()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r2 = (env as any).R2 as {
      put(key: string, value: ArrayBuffer, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>
    } | undefined

    if (!r2) {
      console.error('R2 binding not found. Available bindings:', Object.keys(env || {}))
      return NextResponse.json(
        { error: 'ストレージが利用できません' },
        { status: 500 }
      )
    }

    // ファイルをArrayBufferに変換
    const bytes = await file.arrayBuffer()

    // R2にアップロード
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const key = `manuals/${businessId}/${manualId}/${timestamp}-${sanitizedFileName}`

    await r2.put(key, bytes, {
      httpMetadata: { contentType: file.type },
    })

    const url = `https://${R2_PUBLIC_DOMAIN}/${key}`

    return NextResponse.json({
      url,
      key,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    })
  } catch (error) {
    console.error('Upload error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'ファイルのアップロードに失敗しました', details: errorMessage },
      { status: 500 }
    )
  }
}
