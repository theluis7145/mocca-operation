'use client'

import { useState, useEffect, useCallback, memo } from 'react'
import { AlertTriangle, CheckCircle, Info, Check, Camera, Video, Smartphone, Image as ImageIcon, Trash2, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { BlockMemo } from './BlockMemo'
import { WorkSessionNote } from './WorkSessionNote'
import { toast } from 'sonner'
import { optimizeImage } from '@/lib/image-optimizer'
import type { Block } from '@prisma/client'
import type {
  TextBlockContent,
  ImageBlockContent,
  VideoBlockContent,
  WarningBlockContent,
  CheckpointBlockContent,
  CheckItem,
  PhotoRecordBlockContent,
} from '@/types'

interface NotePhoto {
  id: string
  imageData: string
  createdAt: string
}

interface WorkSessionNoteData {
  id: string
  blockId: string
  content: string
  photos?: NotePhoto[]
}

interface BlockItemProps {
  block: Block
  index: number
  showMemo?: boolean
  workSessionId?: string
  workSessionNote?: WorkSessionNoteData
  isWorkSessionActive?: boolean
}

export function BlockItem({
  block,
  index,
  showMemo = true,
  workSessionId,
  workSessionNote,
  isWorkSessionActive = false,
}: BlockItemProps) {
  const content = block.content as unknown
  const workSessionProps = {
    workSessionId,
    workSessionNote,
    isWorkSessionActive,
  }

  switch (block.type) {
    case 'TEXT':
      return <TextBlock content={content as TextBlockContent} index={index} blockId={block.id} showMemo={showMemo} {...workSessionProps} />
    case 'IMAGE':
      return <ImageBlock content={content as ImageBlockContent} index={index} blockId={block.id} showMemo={showMemo} {...workSessionProps} />
    case 'VIDEO':
      return <VideoBlock content={content as VideoBlockContent} index={index} blockId={block.id} showMemo={showMemo} {...workSessionProps} />
    case 'WARNING':
      return <WarningBlock content={content as WarningBlockContent} index={index} blockId={block.id} showMemo={showMemo} {...workSessionProps} />
    case 'CHECKPOINT':
      return <CheckpointBlock content={content as CheckpointBlockContent} index={index} blockId={block.id} showMemo={showMemo} {...workSessionProps} />
    case 'PHOTO_RECORD':
      return <PhotoRecordBlock content={content as PhotoRecordBlockContent} index={index} blockId={block.id} showMemo={showMemo} {...workSessionProps} />
    default:
      return null
  }
}

interface BlockTypeProps {
  index: number
  blockId: string
  showMemo: boolean
  workSessionId?: string
  workSessionNote?: WorkSessionNoteData
  isWorkSessionActive: boolean
}

const TextBlock = memo(function TextBlock({ content, index, blockId, showMemo, workSessionId, workSessionNote, isWorkSessionActive }: BlockTypeProps & { content: TextBlockContent }) {
  return (
    <Card id={`block-${blockId}`} className="transition-all duration-300 scroll-mt-24">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-muted-foreground">ステップ {index + 1}</CardTitle>
          {showMemo && <BlockMemo blockId={blockId} />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          {content.format === 'markdown' ? (
            <div dangerouslySetInnerHTML={{ __html: content.text }} />
          ) : (
            <p className="whitespace-pre-wrap">{content.text}</p>
          )}
        </div>
        {workSessionId && (
          <WorkSessionNote
            workSessionId={workSessionId}
            blockId={blockId}
            initialContent={workSessionNote?.content || ''}
            initialNoteId={workSessionNote?.id}
            initialPhotos={workSessionNote?.photos || []}
            isSessionActive={isWorkSessionActive}
          />
        )}
      </CardContent>
    </Card>
  )
})

const ImageBlock = memo(function ImageBlock({ content, index, blockId, showMemo, workSessionId, workSessionNote, isWorkSessionActive }: BlockTypeProps & { content: ImageBlockContent }) {
  const [viewingImage, setViewingImage] = useState(false)

  const handleOpenImage = useCallback(() => setViewingImage(true), [])
  const handleCloseImage = useCallback(() => setViewingImage(false), [])

  return (
    <>
      <Card id={`block-${blockId}`} className="transition-all duration-300 scroll-mt-24">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-muted-foreground">ステップ {index + 1}</CardTitle>
            {showMemo && <BlockMemo blockId={blockId} />}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <button
            type="button"
            onClick={handleOpenImage}
            className="cursor-pointer w-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={content.url}
              alt={content.alt || ''}
              className="rounded-lg max-w-full h-auto mx-auto hover:opacity-80 transition-opacity"
            />
          </button>
          {content.caption && (
            <p className="text-sm text-muted-foreground text-center">{content.caption}</p>
          )}
          {workSessionId && (
            <WorkSessionNote
              workSessionId={workSessionId}
              blockId={blockId}
              initialContent={workSessionNote?.content || ''}
              initialNoteId={workSessionNote?.id}
              initialPhotos={workSessionNote?.photos || []}
              isSessionActive={isWorkSessionActive}
            />
          )}
        </CardContent>
      </Card>

      {/* 画像拡大表示モーダル */}
      <Dialog open={viewingImage} onOpenChange={handleCloseImage}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg">{content.caption || content.alt || '画像'}</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={content.url}
              alt={content.alt || ''}
              className="w-full rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
})

const VideoBlock = memo(function VideoBlock({ content, index, blockId, showMemo, workSessionId, workSessionNote, isWorkSessionActive }: BlockTypeProps & { content: VideoBlockContent }) {
  return (
    <Card id={`block-${blockId}`} className="transition-all duration-300 scroll-mt-24">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-muted-foreground">ステップ {index + 1}</CardTitle>
          {showMemo && <BlockMemo blockId={blockId} />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${content.videoId}`}
            title={content.title || 'YouTube video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full rounded-lg"
          />
        </div>
        {content.title && (
          <p className="text-sm text-muted-foreground mt-2">{content.title}</p>
        )}
        {workSessionId && (
          <WorkSessionNote
            workSessionId={workSessionId}
            blockId={blockId}
            initialContent={workSessionNote?.content || ''}
            initialNoteId={workSessionNote?.id}
            initialPhotos={workSessionNote?.photos || []}
            isSessionActive={isWorkSessionActive}
          />
        )}
      </CardContent>
    </Card>
  )
})

const WarningBlock = memo(function WarningBlock({ content, index, blockId, showMemo, workSessionId, workSessionNote, isWorkSessionActive }: BlockTypeProps & { content: WarningBlockContent }) {
  const levelConfig = {
    info: {
      icon: Info,
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-700 dark:text-blue-300',
      iconColor: 'text-blue-500',
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50 dark:bg-yellow-950',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      textColor: 'text-yellow-700 dark:text-yellow-300',
      iconColor: 'text-yellow-500',
    },
    danger: {
      icon: AlertTriangle,
      bgColor: 'bg-red-50 dark:bg-red-950',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-700 dark:text-red-300',
      iconColor: 'text-red-500',
    },
  }

  const config = levelConfig[content.level] || levelConfig.warning
  const Icon = config.icon

  return (
    <Card id={`block-${blockId}`} className={cn(config.bgColor, config.borderColor, 'border', 'transition-all duration-300 scroll-mt-24')}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-muted-foreground">ステップ {index + 1}</CardTitle>
          {showMemo && <BlockMemo blockId={blockId} />}
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn('flex items-start gap-3', config.textColor)}>
          <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', config.iconColor)} />
          <div>
            {content.title && (
              <p className="font-semibold mb-1">{content.title}</p>
            )}
            <p className="whitespace-pre-wrap">{content.text}</p>
          </div>
        </div>
        {workSessionId && (
          <WorkSessionNote
            workSessionId={workSessionId}
            blockId={blockId}
            initialContent={workSessionNote?.content || ''}
            initialNoteId={workSessionNote?.id}
            initialPhotos={workSessionNote?.photos || []}
            isSessionActive={isWorkSessionActive}
          />
        )}
      </CardContent>
    </Card>
  )
})

const CheckpointBlock = memo(function CheckpointBlock({ content, index, blockId, showMemo, workSessionId, workSessionNote, isWorkSessionActive }: BlockTypeProps & { content: CheckpointBlockContent }) {
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set())
  const [viewingImage, setViewingImage] = useState<{ url: string; text: string } | null>(null)
  const [viewingVideo, setViewingVideo] = useState<{ videoId: string; text: string } | null>(null)

  // 後方互換性: string を CheckItem に変換
  const normalizedItems: CheckItem[] = content.items.map(item =>
    typeof item === 'string' ? { text: item } : item
  )

  const toggleItem = useCallback((itemIndex: number) => {
    setCheckedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(itemIndex)) {
        newSet.delete(itemIndex)
      } else {
        newSet.add(itemIndex)
      }
      return newSet
    })
  }, [])

  const extractYouTubeId = useCallback((url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    ]
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }, [])

  const handleImageClick = useCallback((e: React.MouseEvent, item: CheckItem) => {
    e.stopPropagation()
    if (item.imageUrl) {
      setViewingImage({ url: item.imageUrl, text: item.text })
    }
  }, [])

  const handleVideoClick = useCallback((e: React.MouseEvent, item: CheckItem) => {
    e.stopPropagation()
    if (item.videoUrl) {
      const videoId = extractYouTubeId(item.videoUrl)
      if (videoId) {
        setViewingVideo({ videoId, text: item.text })
      }
    }
  }, [extractYouTubeId])

  const handleCloseImage = useCallback(() => setViewingImage(null), [])
  const handleCloseVideo = useCallback(() => setViewingVideo(null), [])

  return (
    <>
      <Card id={`block-${blockId}`} className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 transition-all duration-300 scroll-mt-24">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-muted-foreground">ステップ {index + 1}</CardTitle>
            {showMemo && <BlockMemo blockId={blockId} />}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {content.title && (
              <p className="font-semibold text-green-700 dark:text-green-300 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                {content.title}
              </p>
            )}
            <ul className="space-y-2">
              {normalizedItems.map((item, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 text-green-700 dark:text-green-300 cursor-pointer select-none"
                  onClick={() => toggleItem(i)}
                >
                  <div
                    className={cn(
                      'h-5 w-5 rounded border-2 border-green-400 flex-shrink-0 flex items-center justify-center transition-colors',
                      checkedItems.has(i) && 'bg-green-500 border-green-500'
                    )}
                  >
                    {checkedItems.has(i) && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <span className={cn('flex-1', checkedItems.has(i) && 'line-through opacity-70')}>
                    {item.text}
                  </span>
                  {item.imageUrl && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-green-600 hover:text-green-800 hover:bg-green-100"
                      onClick={(e) => handleImageClick(e, item)}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  )}
                  {item.videoUrl && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-green-600 hover:text-green-800 hover:bg-green-100"
                      onClick={(e) => handleVideoClick(e, item)}
                    >
                      <Video className="h-4 w-4" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </div>
          {workSessionId && (
            <WorkSessionNote
              workSessionId={workSessionId}
              blockId={blockId}
              initialContent={workSessionNote?.content || ''}
              initialNoteId={workSessionNote?.id}
              initialPhotos={workSessionNote?.photos || []}
              isSessionActive={isWorkSessionActive}
            />
          )}
        </CardContent>
      </Card>

      {/* 画像表示モーダル */}
      <Dialog open={!!viewingImage} onOpenChange={handleCloseImage}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg">{viewingImage?.text}</DialogTitle>
          </DialogHeader>
          {viewingImage && (
            <div className="mt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={viewingImage.url}
                alt={viewingImage.text}
                className="w-full rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 動画表示モーダル */}
      <Dialog open={!!viewingVideo} onOpenChange={handleCloseVideo}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg">{viewingVideo?.text}</DialogTitle>
          </DialogHeader>
          {viewingVideo && (
            <div className="mt-2 aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${viewingVideo.videoId}`}
                title={viewingVideo.text}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
})

interface PhotoRecord {
  id: string
  imageData: string
  createdAt: string
}

const PhotoRecordBlock = memo(function PhotoRecordBlock({ content, index, blockId, showMemo, workSessionId, workSessionNote, isWorkSessionActive }: BlockTypeProps & { content: PhotoRecordBlockContent }) {
  const [photos, setPhotos] = useState<PhotoRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null)

  const fetchPhotos = useCallback(async () => {
    if (!workSessionId) return
    try {
      const response = await fetch(`/api/work-sessions/${workSessionId}/photos?blockId=${blockId}`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setPhotos(data)
      }
    } catch {
      // エラー時は空
    }
  }, [workSessionId, blockId])

  // モバイル判定（クライアントサイドでのみ実行）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent.toLowerCase()
      const mobileKeywords = ['android', 'iphone', 'ipad', 'ipod', 'mobile', 'tablet']
      const isMobileDevice = mobileKeywords.some(keyword => userAgent.includes(keyword))
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsMobile(isMobileDevice)
    }
  }, [])

  // 作業セッションの写真を取得
  useEffect(() => {
    if (workSessionId && isWorkSessionActive) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchPhotos()
    }
  }, [workSessionId, isWorkSessionActive, fetchPhotos])

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    console.log('[PhotoRecord] handleCapture called', { file: file?.name, size: file?.size, workSessionId })

    if (!file || !workSessionId) {
      console.log('[PhotoRecord] Early return - no file or workSessionId')
      return
    }

    setIsLoading(true)
    try {
      // 画像を最適化（失敗した場合は元のファイルを使用）
      let fileToUpload = file
      try {
        const { file: optimizedFile, wasOptimized } = await optimizeImage(file)
        if (wasOptimized) {
          toast.info('画像を最適化しました')
          fileToUpload = optimizedFile
        }
        console.log('[PhotoRecord] Optimization result:', { wasOptimized, originalSize: file.size, optimizedSize: optimizedFile.size })
      } catch (optimizeError) {
        console.warn('[PhotoRecord] Optimization failed, using original file:', optimizeError)
      }

      // ファイルをBase64に変換
      console.log('[PhotoRecord] Converting to Base64...')
      const reader = new FileReader()
      const imageData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          console.log('[PhotoRecord] Base64 conversion complete, length:', (reader.result as string)?.length)
          resolve(reader.result as string)
        }
        reader.onerror = () => reject(new Error('画像の読み込みに失敗しました'))
        reader.readAsDataURL(fileToUpload)
      })

      console.log('[PhotoRecord] Sending POST request to /api/work-sessions/' + workSessionId + '/photos')
      const response = await fetch(`/api/work-sessions/${workSessionId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ blockId, imageData }),
      })

      console.log('[PhotoRecord] Response status:', response.status)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('[PhotoRecord] Error response:', errorData)
        throw new Error(errorData.error || '写真のアップロードに失敗しました')
      }

      const newPhoto = await response.json()
      console.log('[PhotoRecord] Photo saved successfully:', newPhoto.id)
      setPhotos(prev => [...prev, newPhoto])
      toast.success('写真を保存しました')
    } catch (error) {
      console.error('[PhotoRecord] Photo capture error:', error)
      toast.error(error instanceof Error ? error.message : '写真のアップロードに失敗しました')
    } finally {
      setIsLoading(false)
      // inputをリセット
      e.target.value = ''
    }
  }

  const handleDelete = useCallback(async (photoId: string) => {
    if (!workSessionId) return
    try {
      const response = await fetch(`/api/work-sessions/${workSessionId}/photos/${photoId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (response.ok) {
        setPhotos(prev => prev.filter(p => p.id !== photoId))
      }
    } catch {
      // エラー時は無視
    }
  }, [workSessionId])

  const handleClosePhoto = useCallback(() => setViewingPhoto(null), [])
  const handleViewPhoto = useCallback((imageData: string) => setViewingPhoto(imageData), [])
  const handleViewReferenceImage = useCallback(() => {
    if (content.referenceImageUrl) {
      setViewingPhoto(content.referenceImageUrl)
    }
  }, [content.referenceImageUrl])

  return (
    <>
      <Card id={`block-${blockId}`} className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800 transition-all duration-300 scroll-mt-24">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-muted-foreground">ステップ {index + 1}</CardTitle>
            {showMemo && <BlockMemo blockId={blockId} />}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
              <Camera className="h-5 w-5" />
              <p className="font-semibold">{content.title}</p>
              {content.required && <span className="text-xs text-red-500">*必須</span>}
            </div>

            {content.description && (
              <p className="text-sm text-purple-600 dark:text-purple-400">{content.description}</p>
            )}

            {/* 参考画像の表示 */}
            {content.referenceImageUrl && (
              <div className="mt-3 p-3 bg-white dark:bg-purple-900 rounded-lg border border-purple-200 dark:border-purple-700">
                <p className="text-xs text-purple-600 dark:text-purple-400 mb-2 flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  撮影の参考画像（タップで拡大）
                </p>
                <button
                  type="button"
                  onClick={handleViewReferenceImage}
                  className="cursor-pointer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={content.referenceImageUrl}
                    alt="参考画像"
                    className="max-h-32 rounded-lg border border-purple-100 dark:border-purple-800 hover:opacity-80 transition-opacity"
                  />
                </button>
              </div>
            )}

            {/* 作業セッション中の場合のみ撮影機能を表示 */}
            {workSessionId && isWorkSessionActive ? (
              <div className="mt-4 space-y-3">
                {/* 撮影済み写真の表示 */}
                {photos.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {photos.map((photo) => (
                      <div key={photo.id} className="relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.imageData}
                          alt="撮影した写真"
                          className="w-full h-32 object-cover rounded-lg cursor-pointer"
                          onClick={() => handleViewPhoto(photo.imageData)}
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDelete(photo.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 撮影ボタン */}
                {isMobile ? (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleCapture}
                      className="hidden"
                      id={`photo-input-${blockId}`}
                      disabled={isLoading}
                    />
                    <label htmlFor={`photo-input-${blockId}`}>
                      <Button
                        variant="outline"
                        className="w-full gap-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 border-purple-300 dark:border-purple-700"
                        disabled={isLoading}
                        asChild
                      >
                        <span>
                          {isLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              アップロード中...
                            </>
                          ) : (
                            <>
                              <Camera className="h-4 w-4" />
                              写真を撮影
                            </>
                          )}
                        </span>
                      </Button>
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400">
                    <Smartphone className="h-5 w-5" />
                    <span className="text-sm">※スマートフォンからのみ利用可能です</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400">
                <ImageIcon className="h-5 w-5" />
                <span className="text-sm">作業開始後に写真を撮影できます</span>
              </div>
            )}
          </div>

          {workSessionId && (
            <WorkSessionNote
              workSessionId={workSessionId}
              blockId={blockId}
              initialContent={workSessionNote?.content || ''}
              initialNoteId={workSessionNote?.id}
              initialPhotos={workSessionNote?.photos || []}
              isSessionActive={isWorkSessionActive}
            />
          )}
        </CardContent>
      </Card>

      {/* 写真表示モーダル */}
      <Dialog open={!!viewingPhoto} onOpenChange={handleClosePhoto}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg">{content.title}</DialogTitle>
          </DialogHeader>
          {viewingPhoto && (
            <div className="mt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={viewingPhoto}
                alt={content.title}
                className="w-full rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
})
