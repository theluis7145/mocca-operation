'use client'

import { useState, useEffect, useCallback } from 'react'
import { History, RotateCcw, Eye, Loader2, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface Version {
  id: string
  version: number
  title: string
  description: string | null
  blocks: Array<{
    type: string
    content: Record<string, unknown>
    sortOrder: number
  }>
  comment: string | null
  createdAt: string
  creator: {
    id: string
    name: string
  }
}

interface VersionHistoryProps {
  manualId: string
  currentVersion: number
  onRestore?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  showTrigger?: boolean
}

export function VersionHistory({
  manualId,
  currentVersion,
  onRestore,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  showTrigger = true,
}: VersionHistoryProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  // 外部制御または内部制御
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen
  const setIsOpen = externalOnOpenChange || setInternalOpen
  const [versions, setVersions] = useState<Version[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set())

  const fetchVersions = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/manuals/${manualId}/versions`)
      if (response.ok) {
        const data = await response.json()
        setVersions(data)
      }
    } catch (error) {
      console.error('Failed to fetch versions:', error)
      toast.error('バージョン履歴の取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [manualId])

  useEffect(() => {
    if (isOpen) {
      fetchVersions()
    }
  }, [isOpen, fetchVersions])

  const handleRestore = async () => {
    if (!selectedVersion) return

    setIsRestoring(true)
    try {
      const response = await fetch(
        `/api/manuals/${manualId}/versions/${selectedVersion.id}`,
        { method: 'POST' }
      )

      if (!response.ok) {
        throw new Error('復元に失敗しました')
      }

      toast.success(`バージョン ${selectedVersion.version} を復元しました`)
      setIsRestoreDialogOpen(false)
      setIsOpen(false)
      onRestore?.()
    } catch {
      toast.error('バージョンの復元に失敗しました')
    } finally {
      setIsRestoring(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedVersion) return

    setIsDeleting(true)
    try {
      const response = await fetch(
        `/api/manuals/${manualId}/versions/${selectedVersion.id}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        throw new Error('削除に失敗しました')
      }

      toast.success(`バージョン ${selectedVersion.version} を削除しました`)
      setIsDeleteDialogOpen(false)
      setSelectedVersion(null)
      // バージョン一覧を再取得
      fetchVersions()
    } catch {
      toast.error('バージョンの削除に失敗しました')
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleExpanded = (versionId: string) => {
    setExpandedVersions((prev) => {
      const next = new Set(prev)
      if (next.has(versionId)) {
        next.delete(versionId)
      } else {
        next.add(versionId)
      }
      return next
    })
  }

  const getBlockTypeName = (type: string) => {
    switch (type) {
      case 'TEXT': return 'テキスト'
      case 'IMAGE': return '画像'
      case 'VIDEO': return '動画'
      case 'WARNING': return '注意事項'
      case 'CHECKPOINT': return 'チェックポイント'
      default: return type
    }
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        {showTrigger && (
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">バージョン履歴</span>
            </Button>
          </SheetTrigger>
        )}
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              バージョン履歴
            </SheetTitle>
            <SheetDescription>
              過去のバージョンを確認・復元できます（現在: v{currentVersion}）
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="mt-6 h-[calc(100vh-200px)]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>保存されたバージョンはありません</p>
                <p className="text-sm mt-1">編集ページで「バージョンを保存」するとここに表示されます</p>
              </div>
            ) : (
              <div className="space-y-3">
                {versions.map((version) => (
                  <Collapsible
                    key={version.id}
                    open={expandedVersions.has(version.id)}
                    onOpenChange={() => toggleExpanded(version.id)}
                  >
                    <div className="border rounded-lg overflow-hidden">
                      <CollapsibleTrigger asChild>
                        <button className="w-full p-4 text-left hover:bg-accent/50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline">v{version.version}</Badge>
                                <span className="font-medium truncate">{version.title}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{version.creator.name}</span>
                                <span>·</span>
                                <span>
                                  {new Date(version.createdAt).toLocaleDateString('ja-JP', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              {version.comment && (
                                <p className="text-sm text-muted-foreground mt-1 truncate">
                                  {version.comment}
                                </p>
                              )}
                            </div>
                            {expandedVersions.has(version.id) ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-4 pb-4 border-t bg-muted/30">
                          <div className="pt-3 space-y-3">
                            {/* ブロック概要 */}
                            <div>
                              <p className="text-sm font-medium mb-2">内容 ({version.blocks.length}ステップ)</p>
                              <div className="space-y-1">
                                {version.blocks.slice(0, 5).map((block, index) => (
                                  <div
                                    key={index}
                                    className="text-sm text-muted-foreground flex items-center gap-2"
                                  >
                                    <span className="w-5">{index + 1}.</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {getBlockTypeName(block.type)}
                                    </Badge>
                                  </div>
                                ))}
                                {version.blocks.length > 5 && (
                                  <p className="text-sm text-muted-foreground ml-5">
                                    ...他 {version.blocks.length - 5} ステップ
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* アクションボタン */}
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  setSelectedVersion(version)
                                  setIsPreviewOpen(true)
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                プレビュー
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  setSelectedVersion(version)
                                  setIsRestoreDialogOpen(true)
                                }}
                              >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                復元
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  setSelectedVersion(version)
                                  setIsDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* プレビューダイアログ */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              バージョン {selectedVersion?.version} のプレビュー
            </DialogTitle>
            <DialogDescription>
              {selectedVersion?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="space-y-3 pr-2">
              {selectedVersion?.blocks.map((block, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-muted-foreground">ステップ {index + 1}</span>
                    <Badge variant="secondary" className="text-xs">
                      {getBlockTypeName(block.type)}
                    </Badge>
                  </div>
                  <div className="text-sm">
                    {block.type === 'TEXT' && (
                      <p className="whitespace-pre-wrap">
                        {(block.content as { text?: string }).text || ''}
                      </p>
                    )}
                    {block.type === 'WARNING' && (
                      <p className="whitespace-pre-wrap text-yellow-700">
                        {(block.content as { text?: string }).text || ''}
                      </p>
                    )}
                    {block.type === 'CHECKPOINT' && (
                      <div>
                        <p className="font-medium">
                          {(block.content as { title?: string }).title || 'チェックポイント'}
                        </p>
                        <ul className="list-disc list-inside mt-1">
                          {((block.content as { items?: Array<string | { text: string }> }).items || []).map(
                            (item, i) => (
                              <li key={i}>
                                {typeof item === 'string' ? item : item.text}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                    {block.type === 'IMAGE' && (
                      <div className="space-y-2">
                        {(block.content as { url?: string }).url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={(block.content as { url?: string }).url}
                            alt={(block.content as { alt?: string }).alt || ''}
                            className="rounded-lg max-w-full h-auto max-h-64 object-contain"
                          />
                        ) : (
                          <p className="text-muted-foreground">[画像URL未設定]</p>
                        )}
                        {(block.content as { caption?: string }).caption && (
                          <p className="text-muted-foreground text-center">
                            {(block.content as { caption?: string }).caption}
                          </p>
                        )}
                      </div>
                    )}
                    {block.type === 'VIDEO' && (
                      <div className="space-y-2">
                        {(block.content as { videoId?: string }).videoId ? (
                          <div className="aspect-video">
                            <iframe
                              src={`https://www.youtube.com/embed/${(block.content as { videoId?: string }).videoId}`}
                              title={(block.content as { title?: string }).title || 'YouTube video'}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="w-full h-full rounded-lg"
                            />
                          </div>
                        ) : (
                          <p className="text-muted-foreground">[動画ID未設定]</p>
                        )}
                        {(block.content as { title?: string }).title && (
                          <p className="text-muted-foreground">
                            {(block.content as { title?: string }).title}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 復元確認ダイアログ */}
      <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>バージョンを復元しますか？</DialogTitle>
            <DialogDescription>
              バージョン {selectedVersion?.version}（{selectedVersion?.title}）を復元します。
              現在の内容は自動的にバックアップされます。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRestoreDialogOpen(false)}
              disabled={isRestoring}
            >
              キャンセル
            </Button>
            <Button onClick={handleRestore} disabled={isRestoring}>
              {isRestoring ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  復元中...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  復元する
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>バージョンを削除しますか？</DialogTitle>
            <DialogDescription>
              バージョン {selectedVersion?.version}（{selectedVersion?.title}）を削除します。
              この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  削除中...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  削除する
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
