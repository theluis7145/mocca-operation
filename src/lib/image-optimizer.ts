/**
 * 画像最適化ユーティリティ
 * クライアントサイドでCanvas APIを使用して画像をリサイズ・圧縮する
 */

// 最大ファイルサイズ (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024

// 最適化後の目標サイズ (8MB - 余裕を持たせる)
const TARGET_FILE_SIZE = 8 * 1024 * 1024

// 最大解像度 (長辺)
const MAX_DIMENSION = 2048

// 最小品質
const MIN_QUALITY = 0.5

// 品質の減少ステップ
const QUALITY_STEP = 0.1

interface OptimizeResult {
  file: File
  wasOptimized: boolean
  originalSize: number
  optimizedSize: number
  originalDimensions?: { width: number; height: number }
  optimizedDimensions?: { width: number; height: number }
}

/**
 * 画像ファイルを最適化する
 * ファイルサイズが上限を超えている場合、解像度と品質を調整して最適化する
 */
export async function optimizeImage(file: File): Promise<OptimizeResult> {
  const originalSize = file.size

  // ファイルサイズが上限以下の場合はそのまま返す
  if (file.size <= MAX_FILE_SIZE) {
    return {
      file,
      wasOptimized: false,
      originalSize,
      optimizedSize: file.size,
    }
  }

  // 画像をCanvasに読み込む
  const img = await loadImage(file)
  const originalDimensions = { width: img.width, height: img.height }

  // 解像度を計算
  const { width, height } = calculateDimensions(img.width, img.height, MAX_DIMENSION)
  const optimizedDimensions = { width, height }

  // Canvasで画像をリサイズ
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas context not available')
  }

  // 高品質なリサイズのための設定
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, width, height)

  // 品質を下げながら目標サイズ以下になるまで圧縮
  let quality = 0.9
  let optimizedBlob: Blob | null = null

  // 出力形式を決定 (GIFとPNGはWebPに変換、それ以外はJPEG)
  const outputType = file.type === 'image/png' || file.type === 'image/gif'
    ? 'image/webp'
    : 'image/jpeg'

  while (quality >= MIN_QUALITY) {
    optimizedBlob = await canvasToBlob(canvas, outputType, quality)

    if (optimizedBlob.size <= TARGET_FILE_SIZE) {
      break
    }

    quality -= QUALITY_STEP
  }

  // 品質を下げても目標サイズに達しない場合、さらに解像度を下げる
  if (optimizedBlob && optimizedBlob.size > TARGET_FILE_SIZE) {
    let currentMaxDimension = MAX_DIMENSION * 0.75

    while (currentMaxDimension >= 800 && optimizedBlob.size > TARGET_FILE_SIZE) {
      const { width: newWidth, height: newHeight } = calculateDimensions(
        img.width,
        img.height,
        currentMaxDimension
      )

      canvas.width = newWidth
      canvas.height = newHeight
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, newWidth, newHeight)

      optimizedDimensions.width = newWidth
      optimizedDimensions.height = newHeight

      // 再度品質調整
      quality = 0.8
      while (quality >= MIN_QUALITY) {
        optimizedBlob = await canvasToBlob(canvas, outputType, quality)
        if (optimizedBlob.size <= TARGET_FILE_SIZE) {
          break
        }
        quality -= QUALITY_STEP
      }

      currentMaxDimension *= 0.75
    }
  }

  if (!optimizedBlob) {
    throw new Error('画像の最適化に失敗しました')
  }

  // 拡張子を更新したファイル名を生成
  const extension = outputType === 'image/webp' ? '.webp' : '.jpg'
  const baseName = file.name.replace(/\.[^.]+$/, '')
  const optimizedFileName = `${baseName}_optimized${extension}`

  const optimizedFile = new File([optimizedBlob], optimizedFileName, {
    type: outputType,
  })

  return {
    file: optimizedFile,
    wasOptimized: true,
    originalSize,
    optimizedSize: optimizedFile.size,
    originalDimensions,
    optimizedDimensions,
  }
}

/**
 * 画像ファイルをImageオブジェクトとして読み込む
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('画像の読み込みに失敗しました'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * アスペクト比を維持しながら最大サイズに収まる寸法を計算
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxDimension: number
): { width: number; height: number } {
  if (originalWidth <= maxDimension && originalHeight <= maxDimension) {
    return { width: originalWidth, height: originalHeight }
  }

  const aspectRatio = originalWidth / originalHeight

  if (originalWidth > originalHeight) {
    return {
      width: maxDimension,
      height: Math.round(maxDimension / aspectRatio),
    }
  } else {
    return {
      width: Math.round(maxDimension * aspectRatio),
      height: maxDimension,
    }
  }
}

/**
 * CanvasをBlobに変換
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Blob conversion failed'))
        }
      },
      type,
      quality
    )
  })
}

/**
 * ファイルサイズを人間が読みやすい形式に変換
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
}
