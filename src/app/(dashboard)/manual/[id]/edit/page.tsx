'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { ArrowLeft, EyeOff, Plus, FileText, Copy, MoreHorizontal, Check, Save, History, Shield, Users, Archive } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { DraggableBlock } from '@/components/manual/DraggableBlock'
import { BlockEditor } from '@/components/manual/BlockEditor'
import { VersionHistory } from '@/components/manual/VersionHistory'
import { useNavigationStore } from '@/stores/useNavigationStore'
import { useBusinessStore } from '@/stores/useBusinessStore'
import type { Block, Manual } from '@prisma/client'

type ManualWithBlocks = Manual & {
  blocks: Block[]
  business: { id: string; displayNameLine1: string; displayNameLine2: string }
  adminOnly: boolean
}

export default function ManualEditPage() {
  const params = useParams()
  const router = useRouter()
  const { setCurrentManual, clearNavigation } = useNavigationStore()
  const { selectBusinessById } = useBusinessStore()
  const [manual, setManual] = useState<ManualWithBlocks | null>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null)
  const [isAddingBlock, setIsAddingBlock] = useState(false)
  const [isSavingVersion, setIsSavingVersion] = useState(false)
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    async function fetchManual() {
      try {
        const response = await fetch(`/api/manuals/${params.id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch manual')
        }
        const data = await response.json()
        setManual(data)
        setBlocks(data.blocks || [])
        setTitle(data.title)
        setDescription(data.description || '')

        // マニュアルが属する事業を選択
        if (data.business?.id) {
          selectBusinessById(data.business.id)
        }

        // ナビゲーション情報を設定
        setCurrentManual({ id: data.id, title: data.title })
      } catch {
        toast.error('マニュアルの取得に失敗しました')
        router.back()
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchManual()
    }

    // クリーンアップ時にナビゲーションをクリア
    return () => {
      clearNavigation()
    }
  }, [params.id, router, setCurrentManual, clearNavigation, selectBusinessById])

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event

      if (over && active.id !== over.id) {
        const oldIndex = blocks.findIndex((b) => b.id === active.id)
        const newIndex = blocks.findIndex((b) => b.id === over.id)

        const newBlocks = arrayMove(blocks, oldIndex, newIndex)
        setBlocks(newBlocks)

        // サーバーに保存
        try {
          await fetch(`/api/manuals/${params.id}/blocks/reorder`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              blockIds: newBlocks.map((b) => b.id),
            }),
          })
          toast.success('並び替えを保存しました')
        } catch {
          toast.error('並び替えの保存に失敗しました')
        }
      }
    },
    [blocks, params.id]
  )

  const handleSaveTitleAndDescription = useCallback(async () => {
    if (!manual) return
    const hasChanges = title !== manual.title || description !== (manual.description || '')
    if (!hasChanges) {
      toast.info('変更がありません')
      return
    }
    try {
      const response = await fetch(`/api/manuals/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      })
      if (!response.ok) throw new Error('Failed to save')
      setManual(prev => prev ? { ...prev, title, description } : null)
      toast.success('保存しました')
    } catch {
      toast.error('保存に失敗しました')
    }
  }, [manual, params.id, title, description])

  const handleDuplicate = async () => {
    if (!manual) return

    try {
      const response = await fetch(`/api/manuals/${params.id}/duplicate`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to duplicate')
      }

      const newManual = await response.json()
      toast.success('マニュアルを複製しました')
      router.push(`/manual/${newManual.id}/edit`)
    } catch {
      toast.error('マニュアルの複製に失敗しました')
    }
  }

  const handleDeleteManual = async () => {
    if (!manual) return
    if (!confirm('このマニュアルをアーカイブに移動しますか？\n\n※アーカイブされたマニュアルは一覧に表示されなくなりますが、アーカイブ一覧から復元または完全に削除できます。')) return

    try {
      const response = await fetch(`/api/manuals/${params.id}/archive`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to archive')
      }

      toast.success('マニュアルをアーカイブに移動しました')
      router.push(`/business/${manual.business.id}`)
    } catch {
      toast.error('アーカイブへの移動に失敗しました')
    }
  }

  const handleToggleStatus = async () => {
    if (!manual) return

    const newStatus = manual.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'

    try {
      const response = await fetch(`/api/manuals/${params.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      const updated = await response.json()
      setManual(updated)
      toast.success(newStatus === 'PUBLISHED' ? '公開しました' : '非公開にしました')
    } catch {
      toast.error('ステータスの更新に失敗しました')
    }
  }

  const handleToggleAdminOnly = async () => {
    if (!manual) return

    const newAdminOnly = !manual.adminOnly

    try {
      const response = await fetch(`/api/manuals/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminOnly: newAdminOnly }),
      })

      if (!response.ok) {
        throw new Error('Failed to update admin only setting')
      }

      const updated = await response.json()
      setManual(updated)
      toast.success(newAdminOnly ? '管理者にのみ公開に設定しました' : '全員に公開に設定しました')
    } catch {
      toast.error('公開対象の更新に失敗しました')
    }
  }

  const handleAddBlock = async (type: string, content: Record<string, unknown>) => {
    try {
      const response = await fetch(`/api/manuals/${params.id}/blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, content }),
      })

      if (!response.ok) {
        throw new Error('Failed to add block')
      }

      const newBlock = await response.json()
      setBlocks([...blocks, newBlock])
      setIsAddingBlock(false)
      toast.success('ブロックを追加しました')
    } catch {
      toast.error('ブロックの追加に失敗しました')
    }
  }

  const handleUpdateBlock = useCallback(async (blockId: string, content: Record<string, unknown>) => {
    try {
      const response = await fetch(`/api/blocks/${blockId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        throw new Error('Failed to update block')
      }

      const updated = await response.json()
      setBlocks(prevBlocks => prevBlocks.map((b) => (b.id === blockId ? updated : b)))
      setEditingBlockId(null)
      toast.success('ブロックを更新しました')
    } catch {
      toast.error('ブロックの更新に失敗しました')
    }
  }, [])

  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm('このブロックを削除しますか？')) return

    try {
      const response = await fetch(`/api/blocks/${blockId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete block')
      }

      setBlocks(blocks.filter((b) => b.id !== blockId))
      toast.success('ブロックを削除しました')
    } catch {
      toast.error('ブロックの削除に失敗しました')
    }
  }

  const handleSaveVersion = async () => {
    if (!manual) return

    setIsSavingVersion(true)
    try {
      const response = await fetch(`/api/manuals/${params.id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: `バージョン ${manual.version} を保存`,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save version')
      }

      toast.success('バージョンを保存しました')
    } catch {
      toast.error('バージョンの保存に失敗しました')
    } finally {
      setIsSavingVersion(false)
    }
  }

  const handleVersionRestore = async () => {
    // マニュアルを再取得
    try {
      const response = await fetch(`/api/manuals/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setManual(data)
        setBlocks(data.blocks || [])
        setTitle(data.title)
        setDescription(data.description || '')
      }
    } catch {
      // エラー時はページをリロード
      window.location.reload()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!manual) {
    return null
  }

  return (
    <div className="h-full flex flex-col">
      {/* ツールバー */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="px-4 md:px-6 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2 shrink-0">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">戻る</span>
            </Button>
            <Badge
              variant={manual.status === 'PUBLISHED' ? 'default' : 'secondary'}
              className="shrink-0"
            >
              {manual.status === 'PUBLISHED' ? '公開中' : '非公開'}
            </Badge>
            {manual.adminOnly && (
              <Badge variant="outline" className="shrink-0 gap-1">
                <Shield className="h-3 w-3" />
                管理者にのみ公開
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* デスクトップ表示 */}
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveVersion}
                disabled={isSavingVersion}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {isSavingVersion ? '保存中...' : 'バージョン保存'}
              </Button>
              <VersionHistory
                manualId={manual.id}
                currentVersion={manual.version}
                onRestore={handleVersionRestore}
              />
              <Button variant="outline" size="sm" onClick={handleToggleStatus} className="gap-2">
                {manual.status === 'PUBLISHED' ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    非公開にする
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    公開する
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={handleToggleAdminOnly} className="gap-2">
                {manual.adminOnly ? (
                  <>
                    <Users className="h-4 w-4" />
                    全員に公開
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    管理者にのみ公開
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDuplicate}
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                複製
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteManual}
                className="gap-2 text-destructive hover:text-destructive"
              >
                <Archive className="h-4 w-4" />
                削除
              </Button>
            </div>
            {/* モバイル：メニュー（ドロップダウン） */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={handleSaveVersion}
                  disabled={isSavingVersion}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSavingVersion ? '保存中...' : 'バージョン保存'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsVersionHistoryOpen(true)}>
                  <History className="h-4 w-4 mr-2" />
                  バージョン履歴
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleToggleStatus}>
                  {manual.status === 'PUBLISHED' ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      非公開にする
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      公開する
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleToggleAdminOnly}>
                  {manual.adminOnly ? (
                    <>
                      <Users className="h-4 w-4 mr-2" />
                      全員に公開
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      管理者にのみ公開
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDuplicate}>
                  <Copy className="h-4 w-4 mr-2" />
                  複製
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDeleteManual}
                  className="text-destructive focus:text-destructive"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  削除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* モバイル用：バージョン履歴（トリガーなし） */}
            <div className="md:hidden">
              <VersionHistory
                manualId={manual.id}
                currentVersion={manual.version}
                onRestore={handleVersionRestore}
                open={isVersionHistoryOpen}
                onOpenChange={setIsVersionHistoryOpen}
                showTrigger={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* エディタ */}
      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto space-y-6 md:space-y-8">
          {/* タイトルと説明 */}
          <div className="space-y-4 p-4 md:p-6 bg-muted/30 rounded-lg border">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">タイトル</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="マニュアルタイトル"
                className="text-lg font-medium bg-background"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">説明（任意）</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="このマニュアルの概要..."
                rows={2}
                className="bg-background resize-none"
              />
            </div>
            <Button
              variant="default"
              onClick={handleSaveTitleAndDescription}
              className="w-full sm:w-auto"
            >
              <Save className="h-4 w-4 mr-2" />
              保存
            </Button>
          </div>

          {/* ブロック一覧 */}
          <div className="space-y-4 md:space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">ステップ</h2>
              {blocks.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  全{blocks.length}ステップ
                </span>
              )}
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={blocks.map((b) => b.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3 md:space-y-4">
                  {blocks.map((block, index) => (
                    <DraggableBlock
                      key={block.id}
                      block={block}
                      index={index}
                      isEditing={editingBlockId === block.id}
                      onEdit={() => setEditingBlockId(block.id)}
                      onSave={handleUpdateBlock}
                      onCancel={() => setEditingBlockId(null)}
                      onDelete={() => handleDeleteBlock(block.id)}
                      businessId={manual.business.id}
                      manualId={manual.id}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {blocks.length === 0 && !isAddingBlock && (
              <div className="flex flex-col items-center justify-center py-12 md:py-16 border-2 border-dashed rounded-lg bg-muted/20">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-1">ステップがありません</h3>
                <p className="text-sm text-muted-foreground mb-4 text-center px-4">
                  下の「ステップを追加」から最初のステップを作成しましょう
                </p>
              </div>
            )}

            {/* ブロック追加 */}
            {isAddingBlock ? (
              <BlockEditor
                onSave={(type, content) => handleAddBlock(type, content)}
                onCancel={() => setIsAddingBlock(false)}
                businessId={manual.business.id}
                manualId={params.id as string}
              />
            ) : (
              <Button
                variant="outline"
                className="w-full h-12 border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-colors"
                onClick={() => setIsAddingBlock(true)}
              >
                <Plus className="h-5 w-5 mr-2" />
                ステップを追加
              </Button>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
