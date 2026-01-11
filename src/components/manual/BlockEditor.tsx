'use client'

import { useState, useRef } from 'react'
import { FileText, Image, Video, AlertTriangle, CheckCircle, Upload, Loader2, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { optimizeImage, formatFileSize } from '@/lib/image-optimizer'
import { toast } from 'sonner'

type BlockType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'WARNING' | 'CHECKPOINT' | 'PHOTO_RECORD'

const blockTypes: { type: BlockType; label: string; icon: React.ElementType; description: string }[] = [
  { type: 'TEXT', label: 'テキスト', icon: FileText, description: '文章でステップを説明' },
  { type: 'IMAGE', label: '画像', icon: Image, description: '画像で視覚的に説明' },
  { type: 'VIDEO', label: 'YouTube動画', icon: Video, description: '動画で詳しく説明' },
  { type: 'WARNING', label: '注意事項', icon: AlertTriangle, description: '重要な注意点を強調' },
  { type: 'CHECKPOINT', label: 'チェックポイント', icon: CheckCircle, description: '確認項目のリスト' },
  { type: 'PHOTO_RECORD', label: '写真撮影', icon: Camera, description: '作業中に写真を撮影' },
]

interface BlockEditorProps {
  onSave: (type: string, content: Record<string, unknown>) => void
  onCancel: () => void
  businessId?: string
  manualId?: string
}

export function BlockEditor({ onSave, onCancel, businessId, manualId }: BlockEditorProps) {
  const [selectedType, setSelectedType] = useState<BlockType | null>(null)

  if (!selectedType) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ブロックタイプを選択</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {blockTypes.map(({ type, label, icon: Icon, description }) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-lg border',
                  'hover:bg-accent hover:border-primary transition-colors',
                  'text-center'
                )}
              >
                <Icon className="h-6 w-6" />
                <span className="font-medium text-sm">{label}</span>
                <span className="text-xs text-muted-foreground">{description}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="ghost" onClick={onCancel}>
              キャンセル
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          {blockTypes.find((t) => t.type === selectedType)?.label}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedType(null)}
            className="ml-auto"
          >
            タイプを変更
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <BlockContentEditor
          type={selectedType}
          onSave={(content) => onSave(selectedType, content)}
          onCancel={onCancel}
          businessId={businessId}
          manualId={manualId}
        />
      </CardContent>
    </Card>
  )
}

interface BlockContentEditorProps {
  type: BlockType
  onSave: (content: Record<string, unknown>) => void
  onCancel: () => void
  businessId?: string
  manualId?: string
}

function BlockContentEditor({ type, onSave, onCancel, businessId, manualId }: BlockContentEditorProps) {
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [alt, setAlt] = useState('')
  const [caption, setCaption] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [title, setTitle] = useState('')
  const [warningLevel, setWarningLevel] = useState<'info' | 'warning' | 'danger'>('warning')
  const [checkItems, setCheckItems] = useState<string[]>([''])
  const [photoDescription, setPhotoDescription] = useState('')
  const [isRequired, setIsRequired] = useState(false)

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

  const handleSave = () => {
    switch (type) {
      case 'TEXT':
        if (!text.trim()) return
        onSave({ type: 'text', text, format: 'plain' })
        break
      case 'IMAGE':
        if (!url.trim()) return
        onSave({ type: 'image', url, alt, caption })
        break
      case 'VIDEO': {
        const videoId = extractYouTubeId(videoUrl)
        if (!videoId) return
        onSave({ type: 'video', provider: 'youtube', videoId, title })
        break
      }
      case 'WARNING':
        if (!text.trim()) return
        onSave({ type: 'warning', level: warningLevel, title, text })
        break
      case 'CHECKPOINT': {
        const items = checkItems.filter((item) => item.trim())
        if (items.length === 0) return
        onSave({ type: 'checkpoint', title, items })
        break
      }
      case 'PHOTO_RECORD':
        if (!title.trim()) return
        onSave({ type: 'photo_record', title, description: photoDescription, required: isRequired })
        break
    }
  }

  switch (type) {
    case 'TEXT':
      return (
        <div className="space-y-4">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="ステップの内容を入力..."
            rows={4}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onCancel}>
              キャンセル
            </Button>
            <Button onClick={handleSave} disabled={!text.trim()}>
              追加
            </Button>
          </div>
        </div>
      )

    case 'IMAGE': {
      const processFile = async (file: File) => {
        if (!businessId || !manualId) {
          toast.error('事業IDまたはマニュアルIDが指定されていません')
          return
        }

        // ファイルタイプチェック
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
          toast.error('JPEG、PNG、GIF、WebP形式のみ対応しています')
          return
        }

        setIsUploading(true)
        try {
          // 画像を最適化（10MB超の場合は自動でリサイズ・圧縮）
          const optimizeResult = await optimizeImage(file)

          if (optimizeResult.wasOptimized) {
            toast.info(`画像を最適化しました: ${formatFileSize(optimizeResult.originalSize)} → ${formatFileSize(optimizeResult.optimizedSize)}`)
          }

          const formData = new FormData()
          formData.append('file', optimizeResult.file)
          formData.append('businessId', businessId)
          formData.append('manualId', manualId)

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            const data = await response.json()
            throw new Error(data.error || 'アップロードに失敗しました')
          }

          const data = await response.json()
          setUrl(data.url)
          toast.success('画像をアップロードしました')
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'アップロードに失敗しました')
        } finally {
          setIsUploading(false)
        }
      }

      const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
          await processFile(file)
        }
      }

      const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
      }

      const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
      }

      const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        const file = e.dataTransfer.files[0]
        if (file) {
          await processFile(file)
        }
      }

      return (
        <div className="space-y-4">
          <div>
            <Label>画像をアップロード</Label>
            <div
              className={cn(
                'mt-2 border-2 border-dashed rounded-lg p-6 text-center transition-colors',
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50',
                isUploading && 'opacity-50 pointer-events-none'
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
              />
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">アップロード中...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    ドラッグ&ドロップまたは
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    ファイルを選択
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    JPEG、PNG、GIF、WebP（最大10MB）
                  </p>
                </div>
              )}
            </div>
          </div>
          <div>
            <Label>または画像URL</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              disabled={isUploading}
            />
          </div>
          {url && (
            <div className="border rounded-lg p-2">
              <p className="text-xs text-muted-foreground mb-2">プレビュー:</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt="プレビュー"
                className="max-w-full max-h-48 rounded"
                onError={() => toast.error('画像の読み込みに失敗しました')}
              />
            </div>
          )}
          <div>
            <Label>代替テキスト（任意）</Label>
            <Input
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="画像の説明"
            />
          </div>
          <div>
            <Label>キャプション（任意）</Label>
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="画像の下に表示するテキスト"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onCancel} disabled={isUploading}>
              キャンセル
            </Button>
            <Button onClick={handleSave} disabled={!url.trim() || isUploading}>
              追加
            </Button>
          </div>
        </div>
      )
    }

    case 'VIDEO':
      return (
        <div className="space-y-4">
          <div>
            <Label>YouTube URL</Label>
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-1">
              YouTubeの動画URLまたは埋め込みURLを入力してください
            </p>
          </div>
          <div>
            <Label>タイトル（任意）</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="動画のタイトル"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onCancel}>
              キャンセル
            </Button>
            <Button onClick={handleSave} disabled={!extractYouTubeId(videoUrl)}>
              追加
            </Button>
          </div>
        </div>
      )

    case 'WARNING':
      return (
        <div className="space-y-4">
          <div>
            <Label>重要度</Label>
            <div className="flex gap-2 mt-1">
              {[
                { value: 'info', label: '情報' },
                { value: 'warning', label: '注意' },
                { value: 'danger', label: '危険' },
              ].map((level) => (
                <Button
                  key={level.value}
                  variant={warningLevel === level.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setWarningLevel(level.value as typeof warningLevel)}
                >
                  {level.label}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label>タイトル（任意）</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="注意"
            />
          </div>
          <div>
            <Label>内容</Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="注意事項の内容..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onCancel}>
              キャンセル
            </Button>
            <Button onClick={handleSave} disabled={!text.trim()}>
              追加
            </Button>
          </div>
        </div>
      )

    case 'CHECKPOINT':
      return (
        <div className="space-y-4">
          <div>
            <Label>タイトル（任意）</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="確認ポイント"
            />
          </div>
          <div>
            <Label>チェック項目</Label>
            <div className="space-y-2 mt-1">
              {checkItems.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => {
                      const newItems = [...checkItems]
                      newItems[index] = e.target.value
                      setCheckItems(newItems)
                    }}
                    placeholder={`項目 ${index + 1}`}
                  />
                  {checkItems.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setCheckItems(checkItems.filter((_, i) => i !== index))
                      }}
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCheckItems([...checkItems, ''])}
              >
                + 項目を追加
              </Button>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onCancel}>
              キャンセル
            </Button>
            <Button
              onClick={handleSave}
              disabled={!checkItems.some((item) => item.trim())}
            >
              追加
            </Button>
          </div>
        </div>
      )

    case 'PHOTO_RECORD':
      return (
        <div className="space-y-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
            <p className="text-sm text-purple-700 dark:text-purple-300">
              このブロックは作業中にスマートフォンで写真を撮影して記録するためのものです。
              PCからは撮影できません。
            </p>
          </div>
          <div>
            <Label>撮影対象 *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 清掃後の洗面台"
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-1">
              何を撮影すべきかを具体的に入力してください
            </p>
          </div>
          <div>
            <Label>説明（任意）</Label>
            <Textarea
              value={photoDescription}
              onChange={(e) => setPhotoDescription(e.target.value)}
              placeholder="撮影の注意点や確認すべきポイントなど"
              rows={2}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="photo-required"
              checked={isRequired}
              onChange={(e) => setIsRequired(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="photo-required" className="text-sm font-normal cursor-pointer">
              必須項目にする
            </Label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onCancel}>
              キャンセル
            </Button>
            <Button onClick={handleSave} disabled={!title.trim()}>
              追加
            </Button>
          </div>
        </div>
      )

    default:
      return null
  }
}
