import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

// R2Bucket型の定義（Cloudflare Workers環境用）
export interface R2BucketBinding {
  put(key: string, value: ArrayBuffer | string, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>
  get(key: string): Promise<{ arrayBuffer(): Promise<ArrayBuffer> } | null>
  delete(key: string): Promise<void>
}

// Cloudflare R2 クライアント
export const r2Client = new S3Client({
  region: process.env.R2_REGION || 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
})

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || ''

// 公開URLを生成（R2のPublic Access URLまたはカスタムドメイン）
export function getPublicUrl(key: string): string {
  // R2のPublic Access URLを使用（要設定）
  // カスタムドメインがある場合は環境変数で設定
  const publicDomain = process.env.R2_PUBLIC_DOMAIN
  if (publicDomain) {
    return `https://${publicDomain}/${key}`
  }
  // R2.devのサブドメイン（要有効化）
  return `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev/${key}`
}

// ファイルをR2にアップロード
export async function uploadToR2(
  file: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
  })

  await r2Client.send(command)
  return getPublicUrl(key)
}

// ファイルをR2から削除
export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  })

  await r2Client.send(command)
}

// ファイル名からキーを生成
export function generateFileKey(
  businessId: string,
  manualId: string,
  fileName: string
): string {
  const timestamp = Date.now()
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `manuals/${businessId}/${manualId}/${timestamp}-${sanitizedFileName}`
}

// 許可されるファイルタイプ
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// ========================================
// Cloudflare Workers R2 Binding 対応
// ========================================

// R2Bucket型は src/types/cloudflare.d.ts でグローバルに定義

/**
 * Base64データURLをR2にアップロード（Workers環境用）
 */
export async function uploadBase64ToR2(
  r2: R2BucketBinding,
  key: string,
  base64DataUrl: string,
): Promise<string> {
  // Base64データURLからバイナリデータを抽出
  const matches = base64DataUrl.match(/^data:(.+);base64,(.+)$/)
  if (!matches) {
    throw new Error('Invalid base64 data URL')
  }

  const contentType = matches[1]
  const base64Data = matches[2]

  // Base64をバイナリに変換
  const binaryString = atob(base64Data)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  // R2にアップロード
  await r2.put(key, bytes.buffer, {
    httpMetadata: { contentType },
  })

  return getPublicUrl(key)
}

/**
 * R2から画像を削除（Workers環境用）
 */
export async function deleteFromR2Binding(
  r2: R2BucketBinding,
  key: string,
): Promise<void> {
  await r2.delete(key)
}

/**
 * 画像キーを生成（写真記録用）
 */
export function generatePhotoKey(
  type: 'photo-record' | 'note-photo',
  sessionId: string,
  blockId: string,
): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${type}/${sessionId}/${blockId}/${timestamp}-${random}.jpg`
}

/**
 * Base64データURLかどうかを判定
 */
export function isBase64DataUrl(url: string): boolean {
  return url.startsWith('data:')
}

/**
 * 画像を保存（環境に応じてR2またはBase64）
 *
 * @param imageData - Base64データURL
 * @param key - R2キー
 * @param r2 - R2バインディング（Workers環境で利用可能）
 * @returns 保存された画像のURL（R2 URLまたはBase64データURL）
 */
export async function storeImage(
  imageData: string,
  key: string,
  r2?: R2BucketBinding,
): Promise<string> {
  // R2バインディングが利用可能な場合はR2にアップロード
  if (r2) {
    return uploadBase64ToR2(r2, key, imageData)
  }

  // 開発環境ではBase64データをそのまま返す
  return imageData
}
