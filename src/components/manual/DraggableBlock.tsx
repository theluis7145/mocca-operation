'use client'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Edit, Trash2, Camera, Video, X, Upload, Loader2 } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { Block } from '@prisma/client'
import type { TextBlockContent, CheckItem } from '@/types'

interface DraggableBlockProps {
  block: Block
  index: number
  isEditing: boolean
  onEdit: () => void
  onSave: (blockId: string, content: Record<string, unknown>) => void | Promise<void>
  onCancel: () => void
  onDelete: () => void
  businessId?: string
  manualId?: string
}

export function DraggableBlock({
  block,
  index,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  businessId,
  manualId,
}: DraggableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // 各ブロックタイプごとの編集状態
  const [editText, setEditText] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editUrl, setEditUrl] = useState('')
  const [editAlt, setEditAlt] = useState('')
  const [editCaption, setEditCaption] = useState('')
  const [editVideoUrl, setEditVideoUrl] = useState('')
  const [editWarningLevel, setEditWarningLevel] = useState<'info' | 'warning' | 'danger'>('warning')
  const [editCheckItems, setEditCheckItems] = useState<CheckItem[]>([{ text: '' }])
  const [editPhotoDescription, setEditPhotoDescription] = useState('')
  const [editPhotoRequired, setEditPhotoRequired] = useState(false)
  const [editPhotoReferenceImage, setEditPhotoReferenceImage] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isImageDragging, setIsImageDragging] = useState(false)

  // チェックリスト項目用のセンサー
  const checkItemSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleCheckItemDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = editCheckItems.findIndex((_, i) => `check-item-${i}` === active.id)
      const newIndex = editCheckItems.findIndex((_, i) => `check-item-${i}` === over.id)
      setEditCheckItems(arrayMove(editCheckItems, oldIndex, newIndex))
    }
  }

  // 編集開始時に既存のコンテンツを読み込む
  useEffect(() => {
    if (isEditing) {
      const blockContent = block.content as Record<string, unknown>
      switch (block.type) {
        case 'TEXT':
          setEditText((blockContent.text as string) || '')
          break
        case 'IMAGE':
          setEditUrl((blockContent.url as string) || '')
          setEditAlt((blockContent.alt as string) || '')
          setEditCaption((blockContent.caption as string) || '')
          break
        case 'VIDEO':
          setEditTitle((blockContent.title as string) || '')
          setEditVideoUrl(blockContent.videoId ? `https://www.youtube.com/watch?v=${blockContent.videoId}` : '')
          break
        case 'WARNING':
          setEditTitle((blockContent.title as string) || '')
          setEditText((blockContent.text as string) || '')
          setEditWarningLevel((blockContent.level as 'info' | 'warning' | 'danger') || 'warning')
          break
        case 'CHECKPOINT':
          setEditTitle((blockContent.title as string) || '')
          // 後方互換性: string[] を CheckItem[] に変換
          const rawItems = (blockContent.items as (string | CheckItem)[]) || []
          const normalizedItems: CheckItem[] = rawItems.map(item =>
            typeof item === 'string' ? { text: item } : item
          )
          setEditCheckItems(normalizedItems.length > 0 ? normalizedItems : [{ text: '' }])
          break
        case 'PHOTO_RECORD':
          setEditTitle((blockContent.title as string) || '')
          setEditPhotoDescription((blockContent.description as string) || '')
          setEditPhotoRequired((blockContent.required as boolean) || false)
          setEditPhotoReferenceImage((blockContent.referenceImageUrl as string) || '')
          break
      }
    }
  }, [isEditing, block])

  const handleStartEdit = () => {
    onEdit()
  }

  // 画像アップロードハンドラ
  const handleImageUpload = async (file: File) => {
    if (!businessId || !manualId) {
      console.error('businessId or manualId is missing')
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('businessId', businessId)
      formData.append('manualId', manualId)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const data = await response.json()
      setEditUrl(data.url)
    } catch (error) {
      console.error('Upload error:', error)
      alert(error instanceof Error ? error.message : 'アップロードに失敗しました')
    } finally {
      setIsUploading(false)
    }
  }

  // 画像ドラッグ&ドロップハンドラ
  const handleImageDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsImageDragging(true)
  }

  const handleImageDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsImageDragging(false)
  }

  const handleImageDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsImageDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      await handleImageUpload(file)
    }
  }

  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    ]
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  const handleSave = useCallback(() => {
    let newContent: Record<string, unknown>

    switch (block.type) {
      case 'TEXT':
        newContent = { type: 'text', text: editText, format: 'plain' }
        break
      case 'IMAGE':
        newContent = { type: 'image', url: editUrl, alt: editAlt, caption: editCaption }
        break
      case 'VIDEO': {
        const videoId = extractYouTubeId(editVideoUrl)
        newContent = { type: 'video', provider: 'youtube', videoId, title: editTitle }
        break
      }
      case 'WARNING':
        newContent = { type: 'warning', level: editWarningLevel, title: editTitle, text: editText }
        break
      case 'CHECKPOINT':
        newContent = {
          type: 'checkpoint',
          title: editTitle,
          items: editCheckItems.filter(item => item.text.trim())
        }
        break
      case 'PHOTO_RECORD':
        newContent = {
          type: 'photo_record',
          title: editTitle,
          description: editPhotoDescription,
          required: editPhotoRequired,
          referenceImageUrl: editPhotoReferenceImage || undefined
        }
        break
      default:
        // Fallback: just use the current content
        newContent = block.content as Record<string, unknown>
    }

    onSave(block.id, newContent)
  }, [block.id, block.type, block.content, editText, editUrl, editAlt, editCaption, editVideoUrl, editTitle, editWarningLevel, editCheckItems, editPhotoDescription, editPhotoRequired, editPhotoReferenceImage, onSave])

  const renderEditor = () => {
    switch (block.type) {
      case 'TEXT':
        return (
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="ステップの内容を入力..."
            rows={4}
            autoFocus
          />
        )
      case 'IMAGE':
        return (
          <div className="space-y-3">
            {/* ドラッグ&ドロップエリア */}
            <div>
              <Label className="text-xs">画像をアップロード</Label>
              <div
                className={cn(
                  'mt-1 border-2 border-dashed rounded-lg p-4 text-center transition-colors',
                  isImageDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50',
                  isUploading && 'opacity-50 pointer-events-none'
                )}
                onDragOver={handleImageDragOver}
                onDragLeave={handleImageDragLeave}
                onDrop={handleImageDrop}
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  id={`image-upload-${block.id}`}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file)
                  }}
                  disabled={isUploading}
                />
                {isUploading ? (
                  <div className="flex flex-col items-center gap-1">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">アップロード中...</p>
                  </div>
                ) : (
                  <label htmlFor={`image-upload-${block.id}`} className="cursor-pointer">
                    <div className="flex flex-col items-center gap-1">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        ドラッグ&ドロップまたはクリック
                      </p>
                      <p className="text-xs text-muted-foreground">
                        JPEG, PNG, GIF, WebP（最大10MB）
                      </p>
                    </div>
                  </label>
                )}
              </div>
            </div>
            {/* URL入力（代替手段） */}
            <div>
              <Label className="text-xs">または画像URL</Label>
              <Input
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                placeholder="https://..."
                disabled={isUploading}
              />
            </div>
            {/* プレビュー */}
            {editUrl && (
              <div className="border rounded p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={editUrl} alt="プレビュー" className="max-h-40 rounded" />
              </div>
            )}
            <div>
              <Label className="text-xs">代替テキスト（任意）</Label>
              <Input
                value={editAlt}
                onChange={(e) => setEditAlt(e.target.value)}
                placeholder="画像の説明"
              />
            </div>
            <div>
              <Label className="text-xs">キャプション（任意）</Label>
              <Input
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                placeholder="画像の下に表示するテキスト"
              />
            </div>
          </div>
        )
      case 'VIDEO':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">YouTube URL</Label>
              <Input
                value={editVideoUrl}
                onChange={(e) => setEditVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
            <div>
              <Label className="text-xs">タイトル（任意）</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="動画のタイトル"
              />
            </div>
          </div>
        )
      case 'WARNING':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">重要度</Label>
              <div className="flex gap-2 mt-1">
                {[
                  { value: 'info', label: '情報' },
                  { value: 'warning', label: '注意' },
                  { value: 'danger', label: '危険' },
                ].map((level) => (
                  <Button
                    key={level.value}
                    type="button"
                    variant={editWarningLevel === level.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEditWarningLevel(level.value as typeof editWarningLevel)}
                  >
                    {level.label}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs">タイトル（任意）</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="注意"
              />
            </div>
            <div>
              <Label className="text-xs">内容</Label>
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder="注意事項の内容..."
                rows={3}
              />
            </div>
          </div>
        )
      case 'CHECKPOINT':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">タイトル（任意）</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="確認ポイント"
              />
            </div>
            <div>
              <Label className="text-xs">チェック項目</Label>
              <div className="space-y-2 mt-1">
                <DndContext
                  sensors={checkItemSensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleCheckItemDragEnd}
                >
                  <SortableContext
                    items={editCheckItems.map((_, i) => `check-item-${i}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    {editCheckItems.map((item, idx) => (
                      <SortableCheckItem
                        key={`check-item-${idx}`}
                        id={`check-item-${idx}`}
                        item={item}
                        onTextChange={(text) => {
                          const newItems = [...editCheckItems]
                          newItems[idx] = { ...newItems[idx], text }
                          setEditCheckItems(newItems)
                        }}
                        onImageChange={(imageUrl) => {
                          const newItems = [...editCheckItems]
                          newItems[idx] = { ...newItems[idx], imageUrl: imageUrl || undefined }
                          setEditCheckItems(newItems)
                        }}
                        onVideoChange={(videoUrl) => {
                          const newItems = [...editCheckItems]
                          newItems[idx] = { ...newItems[idx], videoUrl: videoUrl || undefined }
                          setEditCheckItems(newItems)
                        }}
                        onDelete={editCheckItems.length > 1 ? () => setEditCheckItems(editCheckItems.filter((_, i) => i !== idx)) : undefined}
                        placeholder={`項目 ${idx + 1}`}
                        businessId={businessId}
                        manualId={manualId}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditCheckItems([...editCheckItems, { text: '' }])}
                >
                  + 項目を追加
                </Button>
              </div>
            </div>
          </div>
        )
      case 'PHOTO_RECORD':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">タイトル</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="写真撮影箇所の名前（例: バスルーム清掃完了）"
                autoFocus
              />
            </div>
            <div>
              <Label className="text-xs">説明（任意）</Label>
              <Textarea
                value={editPhotoDescription}
                onChange={(e) => setEditPhotoDescription(e.target.value)}
                placeholder="撮影に関する補足説明..."
                rows={2}
              />
            </div>
            {/* 参考画像アップロード */}
            <div>
              <Label className="text-xs">参考画像（任意）</Label>
              <p className="text-xs text-muted-foreground mb-2">
                撮影時の見本となる画像を設定できます
              </p>
              <div
                className={cn(
                  'mt-1 border-2 border-dashed rounded-lg p-4 text-center transition-colors',
                  isImageDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50',
                  isUploading && 'opacity-50 pointer-events-none'
                )}
                onDragOver={handleImageDragOver}
                onDragLeave={handleImageDragLeave}
                onDrop={async (e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsImageDragging(false)
                  const file = e.dataTransfer.files[0]
                  if (file && businessId && manualId) {
                    setIsUploading(true)
                    try {
                      const formData = new FormData()
                      formData.append('file', file)
                      formData.append('businessId', businessId)
                      formData.append('manualId', manualId)
                      const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData,
                      })
                      if (response.ok) {
                        const data = await response.json()
                        setEditPhotoReferenceImage(data.url)
                      }
                    } catch (error) {
                      console.error('Upload error:', error)
                    } finally {
                      setIsUploading(false)
                    }
                  }
                }}
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  id={`photo-ref-upload-${block.id}`}
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file && businessId && manualId) {
                      setIsUploading(true)
                      try {
                        const formData = new FormData()
                        formData.append('file', file)
                        formData.append('businessId', businessId)
                        formData.append('manualId', manualId)
                        const response = await fetch('/api/upload', {
                          method: 'POST',
                          body: formData,
                        })
                        if (response.ok) {
                          const data = await response.json()
                          setEditPhotoReferenceImage(data.url)
                        }
                      } catch (error) {
                        console.error('Upload error:', error)
                      } finally {
                        setIsUploading(false)
                      }
                    }
                  }}
                  disabled={isUploading}
                />
                {isUploading ? (
                  <div className="flex flex-col items-center gap-1">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">アップロード中...</p>
                  </div>
                ) : (
                  <label htmlFor={`photo-ref-upload-${block.id}`} className="cursor-pointer">
                    <div className="flex flex-col items-center gap-1">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        ドラッグ&ドロップまたはクリック
                      </p>
                    </div>
                  </label>
                )}
              </div>
              {/* 参考画像プレビュー */}
              {editPhotoReferenceImage && (
                <div className="mt-2 relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={editPhotoReferenceImage}
                    alt="参考画像"
                    className="max-h-32 rounded border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => setEditPhotoReferenceImage('')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`photo-required-${block.id}`}
                checked={editPhotoRequired}
                onChange={(e) => setEditPhotoRequired(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor={`photo-required-${block.id}`} className="text-xs cursor-pointer">
                写真撮影を必須にする
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              ※スマートフォンからのみ写真撮影が可能です
            </p>
          </div>
        )
      default:
        return <p className="text-sm text-muted-foreground">このブロックタイプは編集できません</p>
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && 'opacity-50')}
    >
      <Card className="relative">
        <CardHeader className="py-2 px-3 flex flex-row items-center gap-2">
          {/* ドラッグハンドル */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab hover:bg-accent rounded p-1"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>

          <span className="text-sm text-muted-foreground flex-1">
            ステップ {index + 1}
          </span>

          {/* アクションボタン */}
          <div className="flex items-center gap-1">
            {isEditing ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onCancel()
                  }}
                >
                  キャンセル
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleSave()
                  }}
                >
                  保存
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="icon" onClick={handleStartEdit}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDelete}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="py-3">
          {isEditing ? renderEditor() : <BlockPreview block={block} />}
        </CardContent>
      </Card>
    </div>
  )
}

function BlockPreview({ block }: { block: Block }) {
  const content = block.content as Record<string, unknown>

  switch (block.type) {
    case 'TEXT':
      return (
        <p className="whitespace-pre-wrap text-sm">
          {(content.text as string) || '(内容なし)'}
        </p>
      )
    case 'IMAGE': {
      const imageUrl = content.url as string
      const imageAlt = (content.alt as string) || ''
      const imageCaption = content.caption as string | undefined
      return (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={imageAlt}
            className="max-h-40 rounded"
          />
          {imageCaption && (
            <p className="text-sm text-muted-foreground">{imageCaption}</p>
          )}
        </div>
      )
    }
    case 'VIDEO':
      return (
        <div className="text-sm text-muted-foreground">
          YouTube動画: {(content.title as string) || content.videoId as string}
        </div>
      )
    case 'WARNING':
      return (
        <div className="text-sm">
          <span className="font-medium">{(content.title as string) || '注意'}: </span>
          {content.text as string}
        </div>
      )
    case 'CHECKPOINT': {
      const items = ((content.items as (string | CheckItem)[]) || []).map(item =>
        typeof item === 'string' ? { text: item } : item
      )
      return (
        <div className="text-sm">
          <span className="font-medium">{(content.title as string) || 'チェックポイント'}</span>
          <ul className="mt-1 space-y-1">
            {items.map((item, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-current rounded-full flex-shrink-0" />
                <span>{item.text}</span>
                {item.imageUrl && <Camera className="h-3 w-3 text-muted-foreground" />}
                {item.videoUrl && <Video className="h-3 w-3 text-muted-foreground" />}
              </li>
            ))}
          </ul>
        </div>
      )
    }
    case 'PHOTO_RECORD':
      return (
        <div className="text-sm">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-blue-500" />
            <span className="font-medium">{(content.title as string) || '写真撮影'}</span>
            {(content.required as boolean) && (
              <span className="text-xs text-red-500">※必須</span>
            )}
          </div>
          {(content.description as string) && (
            <p className="mt-1 text-muted-foreground text-xs">{content.description as string}</p>
          )}
          {(content.referenceImageUrl as string) && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground mb-1">参考画像:</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={content.referenceImageUrl as string}
                alt="参考画像"
                className="max-h-24 rounded border"
              />
            </div>
          )}
        </div>
      )
    default:
      return <p className="text-sm text-muted-foreground">(不明なブロックタイプ)</p>
  }
}

// チェックリスト項目用のソート可能コンポーネント
interface SortableCheckItemProps {
  id: string
  item: CheckItem
  onTextChange: (text: string) => void
  onImageChange: (imageUrl: string) => void
  onVideoChange: (videoUrl: string) => void
  onDelete?: () => void
  placeholder: string
  businessId?: string
  manualId?: string
}

function SortableCheckItem({ id, item, onTextChange, onImageChange, onVideoChange, onDelete, placeholder, businessId, manualId }: SortableCheckItemProps) {
  const [showImageInput, setShowImageInput] = useState(false)
  const [showVideoInput, setShowVideoInput] = useState(false)
  const [isItemUploading, setIsItemUploading] = useState(false)
  const [isItemDragging, setIsItemDragging] = useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // 画像アップロードハンドラ
  const handleItemImageUpload = async (file: File) => {
    if (!businessId || !manualId) {
      alert('事業IDまたはマニュアルIDが指定されていません')
      return
    }

    // ファイルサイズチェック（10MB）
    if (file.size > 10 * 1024 * 1024) {
      alert('ファイルサイズが10MBを超えています')
      return
    }

    // ファイルタイプチェック
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('JPEG、PNG、GIF、WebP形式のみ対応しています')
      return
    }

    setIsItemUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('businessId', businessId)
      formData.append('manualId', manualId)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const data = await response.json()
      onImageChange(data.url)
    } catch (error) {
      console.error('Upload error:', error)
      alert(error instanceof Error ? error.message : 'アップロードに失敗しました')
    } finally {
      setIsItemUploading(false)
    }
  }

  const handleItemDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsItemDragging(true)
  }

  const handleItemDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsItemDragging(false)
  }

  const handleItemDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsItemDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      await handleItemImageUpload(file)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-md border p-2 space-y-2',
        isDragging && 'opacity-50 bg-accent'
      )}
    >
      <div className="flex gap-2 items-center">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab hover:bg-accent rounded p-1 touch-none"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <Input
          value={item.text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          type="button"
          variant={item.imageUrl ? 'default' : 'outline'}
          size="icon"
          onClick={() => setShowImageInput(!showImageInput)}
          title="画像を追加"
        >
          <Camera className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={item.videoUrl ? 'default' : 'outline'}
          size="icon"
          onClick={() => setShowVideoInput(!showVideoInput)}
          title="動画を追加"
        >
          <Video className="h-4 w-4" />
        </Button>
        {onDelete && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDelete}
          >
            ×
          </Button>
        )}
      </div>

      {/* 画像入力・アップロード */}
      {(showImageInput || item.imageUrl) && (
        <div className="ml-8 space-y-2">
          {/* ドラッグ&ドロップエリア */}
          {!item.imageUrl && (
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-3 text-center transition-colors',
                isItemDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50',
                isItemUploading && 'opacity-50 pointer-events-none'
              )}
              onDragOver={handleItemDragOver}
              onDragLeave={handleItemDragLeave}
              onDrop={handleItemDrop}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                id={`check-image-upload-${id}`}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleItemImageUpload(file)
                }}
                disabled={isItemUploading}
              />
              {isItemUploading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">アップロード中...</span>
                </div>
              ) : (
                <label htmlFor={`check-image-upload-${id}`} className="cursor-pointer">
                  <div className="flex flex-col items-center gap-1">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      ドラッグ&ドロップまたはクリック
                    </p>
                  </div>
                </label>
              )}
            </div>
          )}
          {/* URL入力（代替手段） */}
          <div className="flex gap-2 items-center">
            <Input
              value={item.imageUrl || ''}
              onChange={(e) => onImageChange(e.target.value)}
              placeholder="または画像URL (https://...)"
              className="flex-1 text-sm"
              disabled={isItemUploading}
            />
            {item.imageUrl && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  onImageChange('')
                  setShowImageInput(false)
                }}
                title="画像を削除"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {/* プレビュー */}
          {item.imageUrl && (
            <div className="border rounded p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageUrl}
                alt="プレビュー"
                className="max-h-24 rounded"
              />
            </div>
          )}
        </div>
      )}

      {/* 動画URL入力 */}
      {(showVideoInput || item.videoUrl) && (
        <div className="ml-8 space-y-2">
          <div className="flex gap-2 items-center">
            <Input
              value={item.videoUrl || ''}
              onChange={(e) => onVideoChange(e.target.value)}
              placeholder="YouTube URL (https://www.youtube.com/watch?v=...)"
              className="flex-1 text-sm"
            />
            {item.videoUrl && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  onVideoChange('')
                  setShowVideoInput(false)
                }}
                title="動画を削除"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {item.videoUrl && (
            <div className="text-xs text-muted-foreground">
              <Video className="h-3 w-3 inline mr-1" />
              YouTube動画が添付されています
            </div>
          )}
        </div>
      )}
    </div>
  )
}
