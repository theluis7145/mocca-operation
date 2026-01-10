'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  User,
  FileText,
  CheckCircle2,
  ExternalLink,
  Camera,
  AlertTriangle,
  Clock,
  Timer,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface NotePhoto {
  id: string
  imageData: string
  createdAt: string
}

interface WorkSessionNote {
  id: string
  blockId: string
  content: string
  createdAt: string
  photos?: NotePhoto[]
  block: {
    id: string
    type: string
    content: unknown
    sortOrder: number
  }
}

interface PhotoRecord {
  id: string
  blockId: string
  imageData: string
  createdAt: string
  block: {
    id: string
    type: string
    content: unknown
    sortOrder: number
  }
}

interface WorkSession {
  id: string
  status: 'IN_PROGRESS' | 'COMPLETED'
  startedAt: string
  completedAt: string | null
  user: {
    id: string
    name: string
    email: string
  }
  manual: {
    id: string
    title: string
    description: string | null
    businessId: string
    business: {
      id: string
      name: string
    }
    blocks: Array<{
      id: string
      type: string
      content: unknown
      sortOrder: number
    }>
  }
  notes: WorkSessionNote[]
  photoRecords: PhotoRecord[]
}

export default function WorkSessionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [workSession, setWorkSession] = useState<WorkSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewingPhoto, setViewingPhoto] = useState<{ imageData: string; title: string } | null>(null)

  useEffect(() => {
    async function fetchWorkSession() {
      try {
        const response = await fetch(`/api/work-sessions/${params.id}`)
        if (!response.ok) {
          if (response.status === 404) {
            setError('作業報告が見つかりません')
          } else if (response.status === 403) {
            setError('この作業報告へのアクセス権がありません')
          } else {
            setError('作業報告の取得に失敗しました')
          }
          return
        }
        const data = await response.json()
        setWorkSession(data)
      } catch {
        setError('作業報告の取得に失敗しました')
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchWorkSession()
    }
  }, [params.id])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (error || !workSession) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <p className="text-destructive mb-4">{error}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          戻る
        </Button>
      </div>
    )
  }

  // メモをブロックの順序でソート
  const sortedNotes = [...workSession.notes].sort(
    (a, b) => a.block.sortOrder - b.block.sortOrder
  )

  // 写真をブロックの順序でソート
  const sortedPhotos = [...workSession.photoRecords].sort(
    (a, b) => a.block.sortOrder - b.block.sortOrder
  )

  // PHOTO_RECORDブロックの中で写真が撮影されていないものをチェック
  const photoBlocks = workSession.manual.blocks.filter(
    (block) => block.type === 'PHOTO_RECORD'
  )
  const capturedPhotoBlockIds = new Set(
    workSession.photoRecords.map((photo) => photo.blockId)
  )
  const missingPhotoBlocks = photoBlocks.filter(
    (block) => !capturedPhotoBlockIds.has(block.id)
  )

  // 作業時間を計算
  const calculateDuration = (startedAt: string, completedAt: string | null) => {
    if (!completedAt) return null
    const start = new Date(startedAt)
    const end = new Date(completedAt)
    const diffMs = end.getTime() - start.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    if (hours > 0) {
      return `${hours}時間${minutes}分`
    }
    return `${minutes}分`
  }

  // 日時をフォーマット
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // ブロックのコンテンツからタイトルを抽出
  const getBlockTitle = (block: { type: string; content: unknown; sortOrder: number }) => {
    const content = block.content as Record<string, unknown>
    if (content.title) return content.title as string
    if (content.text) {
      const text = content.text as string
      return text.length > 50 ? text.substring(0, 50) + '...' : text
    }
    return `ステップ ${block.sortOrder + 1}`
  }

  return (
    <div className="h-full flex flex-col">
      {/* ヘッダー */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-4 md:px-6 lg:px-8 py-4 md:py-5">
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">戻る</span>
            </Button>
            <Link href={`/manual/${workSession.manual.id}`}>
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                マニュアルを見る
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold">作業完了報告</h1>
            <Badge variant={workSession.status === 'COMPLETED' ? 'default' : 'secondary'}>
              {workSession.status === 'COMPLETED' ? (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  完了
                </>
              ) : (
                '進行中'
              )}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {workSession.manual.business.name}
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
          {/* 基本情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">作業情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">マニュアル</p>
                  <p className="font-medium">{workSession.manual.title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">作業者</p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{workSession.user.name}</span>
                  </div>
                </div>
              </div>
              {/* 日時情報 */}
              <div className="border-t pt-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">作業開始日時</p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{formatDateTime(workSession.startedAt)}</span>
                    </div>
                  </div>
                  {workSession.completedAt && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">作業完了日時</p>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{formatDateTime(workSession.completedAt)}</span>
                      </div>
                    </div>
                  )}
                  {workSession.completedAt && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">作業時間</p>
                      <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{calculateDuration(workSession.startedAt, workSession.completedAt)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 未撮影写真の警告 */}
          {missingPhotoBlocks.length > 0 && (
            <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-5 w-5" />
                  <CardTitle className="text-lg text-amber-700 dark:text-amber-400">
                    未撮影の写真があります
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
                  以下の写真撮影ステップで写真が撮影されていません：
                </p>
                <ul className="space-y-2">
                  {missingPhotoBlocks.map((block) => (
                    <li key={block.id} className="text-sm text-amber-700 dark:text-amber-400">
                      • ステップ {block.sortOrder + 1}: {getBlockTitle(block)}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* 撮影写真 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                <CardTitle className="text-lg">撮影写真 ({sortedPhotos.length}件)</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {sortedPhotos.length > 0 ? (
                <div className="space-y-6">
                  {sortedPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="rounded-lg border bg-muted/30 overflow-hidden"
                    >
                      <div className="flex items-center justify-between p-3 border-b">
                        <p className="text-sm font-medium text-muted-foreground">
                          ステップ {photo.block.sortOrder + 1}: {getBlockTitle(photo.block)}
                        </p>
                        <Link
                          href={`/manual/${workSession.manual.id}?blockId=${photo.blockId}`}
                          className="text-xs text-primary hover:underline"
                        >
                          該当ステップへ
                        </Link>
                      </div>
                      <div className="p-3">
                        <button
                          type="button"
                          className="w-full cursor-pointer"
                          onClick={() => setViewingPhoto({
                            imageData: photo.imageData,
                            title: `ステップ ${photo.block.sortOrder + 1}: ${getBlockTitle(photo.block)}`
                          })}
                        >
                          <img
                            src={photo.imageData}
                            alt={`ステップ ${photo.block.sortOrder + 1} の撮影写真`}
                            className="w-full max-w-md mx-auto rounded-lg hover:opacity-80 transition-opacity"
                          />
                        </button>
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          {new Date(photo.createdAt).toLocaleString('ja-JP')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>撮影写真はありません</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 申し送りメモ */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <CardTitle className="text-lg">申し送りメモ ({sortedNotes.length}件)</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {sortedNotes.length > 0 ? (
                <div className="space-y-4">
                  {sortedNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-4 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          ステップ {note.block.sortOrder + 1}: {getBlockTitle(note.block)}
                        </p>
                        <Link
                          href={`/manual/${workSession.manual.id}?blockId=${note.blockId}`}
                          className="text-xs text-primary hover:underline"
                        >
                          該当ステップへ
                        </Link>
                      </div>
                      <p className="whitespace-pre-wrap">{note.content}</p>
                      {/* 申し送りメモの添付写真 */}
                      {note.photos && note.photos.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm text-muted-foreground mb-2">
                            添付写真 ({note.photos.length}枚)
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {note.photos.map((photo) => (
                              <button
                                key={photo.id}
                                type="button"
                                className="relative cursor-pointer"
                                onClick={() => setViewingPhoto({
                                  imageData: photo.imageData,
                                  title: `ステップ ${note.block.sortOrder + 1} の添付写真`
                                })}
                              >
                                <img
                                  src={photo.imageData}
                                  alt="申し送りメモ添付写真"
                                  className="w-full h-24 object-cover rounded-md hover:opacity-80 transition-opacity"
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>申し送りメモはありません</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      {/* 写真拡大表示モーダル */}
      <Dialog open={!!viewingPhoto} onOpenChange={() => setViewingPhoto(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg">{viewingPhoto?.title}</DialogTitle>
          </DialogHeader>
          {viewingPhoto && (
            <div className="mt-2">
              <img
                src={viewingPhoto.imageData}
                alt={viewingPhoto.title}
                className="w-full rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
