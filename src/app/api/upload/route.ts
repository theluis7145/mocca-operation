import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { uploadToR2, generateFileKey, ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from '@/lib/r2'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
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

    // ファイルをBufferに変換
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // R2にアップロード
    const key = generateFileKey(businessId, manualId, file.name)
    const url = await uploadToR2(buffer, key, file.type)

    return NextResponse.json({
      url,
      key,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'ファイルのアップロードに失敗しました' },
      { status: 500 }
    )
  }
}
