'use client'

import { useState, useEffect, useCallback, useRef, memo } from 'react'
import { FileText, Save, Camera, X, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useDebouncedCallback } from 'use-debounce'
import { optimizeImage } from '@/lib/image-optimizer'

interface NotePhoto {
  id: string
  imageData: string
  createdAt: string
}

interface WorkSessionNoteProps {
  workSessionId: string
  blockId: string
  initialContent?: string
  initialNoteId?: string
  initialPhotos?: NotePhoto[]
  isSessionActive: boolean
}

export const WorkSessionNote = memo(function WorkSessionNote({
  workSessionId,
  blockId,
  initialContent = '',
  initialNoteId,
  initialPhotos = [],
  isSessionActive,
}: WorkSessionNoteProps) {
  const [content, setContent] = useState(initialContent)
  const [savedContent, setSavedContent] = useState(initialContent)
  const [isSaving, setIsSaving] = useState(false)
  const [isExpanded, setIsExpanded] = useState(!!initialContent || initialPhotos.length > 0)
  const [noteId, setNoteId] = useState<string | undefined>(initialNoteId)
  const [photos, setPhotos] = useState<NotePhoto[]>(initialPhotos)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [viewingPhoto, setViewingPhoto] = useState<NotePhoto | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setContent(initialContent)
    setSavedContent(initialContent)
    setNoteId(initialNoteId)
    setPhotos(initialPhotos)
    if (initialContent || initialPhotos.length > 0) {
      setIsExpanded(true)
    }
  }, [initialContent, initialNoteId, initialPhotos])

  const saveNote = useCallback(async (newContent: string): Promise<string | undefined> => {
    if (newContent === savedContent && noteId) return noteId

    setIsSaving(true)
    try {
      const response = await fetch(`/api/work-sessions/${workSessionId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          blockId,
          content: newContent,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save')
      }

      const savedNote = await response.json()
      setSavedContent(newContent)
      setNoteId(savedNote.id)
      return savedNote.id
    } catch {
      toast.error('申し送りメモの保存に失敗しました')
      return undefined
    } finally {
      setIsSaving(false)
    }
  }, [workSessionId, blockId, savedContent, noteId])

  const handlePhotoCapture = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    console.log('[WorkSessionNote] handlePhotoCapture called', { file: file?.name, size: file?.size, workSessionId, noteId })

    if (!file) {
      console.log('[WorkSessionNote] Early return - no file')
      return
    }

    setIsUploadingPhoto(true)
    try {
      // 画像を最適化（失敗した場合は元のファイルを使用）
      let fileToUpload = file
      try {
        const { file: optimizedFile, wasOptimized } = await optimizeImage(file)
        if (wasOptimized) {
          toast.info('画像を最適化しました')
          fileToUpload = optimizedFile
        }
        console.log('[WorkSessionNote] Optimization result:', { wasOptimized, originalSize: file.size, optimizedSize: optimizedFile.size })
      } catch (optimizeError) {
        console.warn('[WorkSessionNote] Optimization failed, using original file:', optimizeError)
      }

      // まずメモを保存してnoteIdを取得
      let currentNoteId = noteId
      if (!currentNoteId) {
        console.log('[WorkSessionNote] Creating new note...')
        currentNoteId = await saveNote(content || ' ') // 空の場合はスペースを入れる
        if (!currentNoteId) {
          throw new Error('Failed to create note')
        }
        console.log('[WorkSessionNote] Note created:', currentNoteId)
      }

      // 画像をBase64に変換
      console.log('[WorkSessionNote] Converting to Base64...')
      const reader = new FileReader()
      const imageData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          console.log('[WorkSessionNote] Base64 conversion complete, length:', (reader.result as string)?.length)
          resolve(reader.result as string)
        }
        reader.onerror = () => reject(new Error('画像の読み込みに失敗しました'))
        reader.readAsDataURL(fileToUpload)
      })

      // 写真をアップロード
      const url = `/api/work-sessions/${workSessionId}/notes/${currentNoteId}/photos`
      console.log('[WorkSessionNote] Sending POST request to', url)
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ imageData }),
      })

      console.log('[WorkSessionNote] Response status:', response.status)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('[WorkSessionNote] Error response:', errorData)
        throw new Error(errorData.error || '写真のアップロードに失敗しました')
      }

      const newPhoto = await response.json()
      console.log('[WorkSessionNote] Photo saved successfully:', newPhoto.id)
      setPhotos((prev) => [...prev, newPhoto])
      toast.success('写真を追加しました')
    } catch (error) {
      console.error('[WorkSessionNote] Photo upload error:', error)
      toast.error(error instanceof Error ? error.message : '写真のアップロードに失敗しました')
    } finally {
      setIsUploadingPhoto(false)
      // ファイル入力をリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [noteId, content, saveNote, workSessionId])

  const handleDeletePhoto = useCallback(async (photoId: string) => {
    if (!noteId) return

    try {
      const response = await fetch(
        `/api/work-sessions/${workSessionId}/notes/${noteId}/photos?photoId=${photoId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      )

      if (!response.ok) {
        throw new Error('Failed to delete photo')
      }

      setPhotos((prev) => prev.filter((p) => p.id !== photoId))
      toast.success('写真を削除しました')
    } catch {
      toast.error('写真の削除に失敗しました')
    }
  }, [noteId, workSessionId])

  const debouncedSave = useDebouncedCallback(saveNote, 1000)

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent)
    if (isSessionActive) {
      debouncedSave(newContent)
    }
  }, [isSessionActive, debouncedSave])

  const handleManualSave = useCallback(async () => {
    debouncedSave.cancel()
    await saveNote(content)
    toast.success('保存しました')
  }, [debouncedSave, saveNote, content])

  const hasUnsavedChanges = content !== savedContent

  if (!isSessionActive && !content && photos.length === 0) {
    return null
  }

  return (
    <div className="mt-3 border-t pt-3">
      {isExpanded ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>申し送りメモ</span>
              {isSaving && (
                <span className="text-xs text-muted-foreground animate-pulse">
                  保存中...
                </span>
              )}
              {hasUnsavedChanges && !isSaving && (
                <span className="text-xs text-amber-600">
                  未保存の変更
                </span>
              )}
            </div>
            {isSessionActive && hasUnsavedChanges && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleManualSave}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-1" />
                保存
              </Button>
            )}
          </div>
          <Textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="作業中の気づきや申し送り事項を記入してください..."
            rows={3}
            disabled={!isSessionActive}
            className={cn(
              'resize-none',
              !isSessionActive && 'bg-muted cursor-not-allowed'
            )}
          />

          {/* 写真セクション */}
          {(photos.length > 0 || isSessionActive) && (
            <div className="space-y-2">
              {photos.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ImageIcon className="h-4 w-4" />
                  <span>添付写真 ({photos.length}枚)</span>
                </div>
              )}

              {/* 写真グリッド */}
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <button
                        type="button"
                        onClick={() => setViewingPhoto(photo)}
                        className="w-full cursor-pointer"
                      >
                        <img
                          src={photo.imageData}
                          alt="申し送り写真"
                          className="w-full h-20 object-cover rounded-md hover:opacity-80 transition-opacity"
                        />
                      </button>
                      {isSessionActive && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeletePhoto(photo.id)
                          }}
                          className="absolute top-1 right-1 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3 text-white" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 写真追加ボタン */}
              {isSessionActive && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoCapture}
                    className="hidden"
                    id={`photo-input-${blockId}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="gap-2"
                  >
                    {isUploadingPhoto ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        アップロード中...
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4" />
                        写真を追加
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {!isSessionActive && (content || photos.length > 0) && (
            <p className="text-xs text-muted-foreground">
              作業セッション終了後のため編集できません
            </p>
          )}
        </div>
      ) : (
        isSessionActive && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => setIsExpanded(true)}
          >
            <FileText className="h-4 w-4 mr-2" />
            申し送りメモを追加
          </Button>
        )
      )}

      {/* 写真拡大表示モーダル */}
      <Dialog open={!!viewingPhoto} onOpenChange={() => setViewingPhoto(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg">申し送り写真</DialogTitle>
          </DialogHeader>
          {viewingPhoto && (
            <div className="mt-2">
              <img
                src={viewingPhoto.imageData}
                alt="申し送り写真"
                className="w-full rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
})
