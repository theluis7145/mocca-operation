'use client'

import { useState } from 'react'
import { CheckCircle2, FileText, Loader2, AlertTriangle, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'sonner'

interface NotePhoto {
  id: string
  imageData: string
  createdAt: string
}

interface WorkSessionNote {
  id: string
  blockId: string
  content: string
  photos?: NotePhoto[]
  block: {
    id: string
    sortOrder: number
  }
}

interface PhotoBlock {
  id: string
  sortOrder: number
  content: {
    title?: string
  }
}

interface CapturedPhoto {
  blockId: string
}

interface WorkCompleteDialogProps {
  isOpen: boolean
  onClose: () => void
  workSessionId: string
  manualTitle: string
  notes: WorkSessionNote[]
  photoBlocks: PhotoBlock[]
  capturedPhotos: CapturedPhoto[]
  onComplete: () => void
}

export function WorkCompleteDialog({
  isOpen,
  onClose,
  workSessionId,
  manualTitle,
  notes,
  photoBlocks,
  capturedPhotos,
  onComplete,
}: WorkCompleteDialogProps) {
  const [isCompleting, setIsCompleting] = useState(false)

  // 未撮影の写真ブロックをチェック
  const capturedPhotoBlockIds = new Set(capturedPhotos.map((photo) => photo.blockId))
  const missingPhotoBlocks = photoBlocks.filter((block) => !capturedPhotoBlockIds.has(block.id))
  const hasMissingPhotos = missingPhotoBlocks.length > 0

  const handleComplete = async () => {
    setIsCompleting(true)
    try {
      const response = await fetch(`/api/work-sessions/${workSessionId}/complete`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '完了処理に失敗しました')
      }

      toast.success('作業完了報告を送信しました', {
        description: '管理者に通知されます',
      })
      onComplete()
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '作業完了処理に失敗しました')
    } finally {
      setIsCompleting(false)
    }
  }

  const sortedNotes = [...notes].sort((a, b) => a.block.sortOrder - b.block.sortOrder)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            作業完了確認
          </DialogTitle>
          <DialogDescription>
            「{manualTitle}」の作業を完了します。
            <br />
            完了すると管理者に通知されます。
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* 未撮影写真の警告 */}
          {hasMissingPhotos && (
            <Alert variant="destructive" className="bg-amber-50 border-amber-500 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-600">
              <AlertTriangle className="h-4 w-4 !text-amber-600 dark:!text-amber-400" />
              <AlertTitle className="text-amber-800 dark:text-amber-400">未撮影の写真があります</AlertTitle>
              <AlertDescription className="text-amber-700 dark:text-amber-400/90">
                <p className="mb-2">以下の写真が撮影されていません。このまま作業を完了しますか？</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {missingPhotoBlocks.map((block) => (
                    <li key={block.id}>
                      ステップ {block.sortOrder + 1}{block.content?.title ? `: ${block.content.title}` : ''}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* 撮影写真情報 */}
          {photoBlocks.length > 0 && !hasMissingPhotos && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/20 p-3 rounded-md">
              <Camera className="h-4 w-4" />
              <span>すべての写真が撮影されています ({capturedPhotos.length}枚)</span>
            </div>
          )}

          {sortedNotes.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4" />
                申し送りメモ一覧 ({sortedNotes.length}件)
              </div>
              <ScrollArea className="h-[200px] rounded-md border p-3">
                <div className="space-y-3">
                  {sortedNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3 rounded-lg bg-muted/50"
                    >
                      <div className="text-xs text-muted-foreground mb-1">
                        ステップ {note.block.sortOrder + 1}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                      {note.photos && note.photos.length > 0 && (
                        <div className="mt-2 flex gap-1 flex-wrap">
                          {note.photos.map((photo) => (
                            <img
                              key={photo.id}
                              src={photo.imageData}
                              alt="添付写真"
                              className="w-12 h-12 object-cover rounded"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>申し送りメモはありません</p>
              <p className="text-xs mt-1">メモなしで作業を完了できます</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isCompleting}>
            キャンセル
          </Button>
          <Button onClick={handleComplete} disabled={isCompleting}>
            {isCompleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                送信中...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                作業完了
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
