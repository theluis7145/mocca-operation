'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { MessageSquare, Plus, Send, Trash2, Globe, Lock, X, Pencil, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Memo {
  id: string
  content: string
  visibility: 'PRIVATE' | 'PUBLIC'
  createdAt: string
  user: {
    id: string
    name: string
  }
}

interface BlockMemoProps {
  blockId: string
  memoCount?: number
}

export function BlockMemo({ blockId, memoCount: initialMemoCount = 0 }: BlockMemoProps) {
  const { data: session } = useSession()
  const [memos, setMemos] = useState<Memo[]>([])
  const [displayCount, setDisplayCount] = useState(initialMemoCount)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [newMemoContent, setNewMemoContent] = useState('')
  const [newMemoVisibility, setNewMemoVisibility] = useState<'PRIVATE' | 'PUBLIC'>('PRIVATE')
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editVisibility, setEditVisibility] = useState<'PRIVATE' | 'PUBLIC'>('PRIVATE')

  // 初回マウント時にメモ数のみを取得
  useEffect(() => {
    const fetchMemoCount = async () => {
      try {
        const response = await fetch(`/api/blocks/${blockId}/memos/count`)
        if (response.ok) {
          const data = await response.json()
          setDisplayCount(data.count)
        }
      } catch {
        // エラー時は初期値を使用
      }
    }
    fetchMemoCount()
  }, [blockId])

  useEffect(() => {
    if (isOpen) {
      fetchMemos()
    }
  }, [isOpen, blockId])

  const fetchMemos = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/blocks/${blockId}/memos`)
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setMemos(data)
      setDisplayCount(data.length)
    } catch {
      toast.error('メモの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddMemo = async () => {
    if (!newMemoContent.trim()) return

    try {
      const response = await fetch(`/api/blocks/${blockId}/memos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMemoContent,
          visibility: newMemoVisibility,
        }),
      })

      if (!response.ok) throw new Error('Failed to create')

      const memo = await response.json()
      setMemos([memo, ...memos])
      setDisplayCount((prev) => prev + 1)
      setNewMemoContent('')
      setIsAdding(false)
      toast.success('メモを追加しました')
    } catch {
      toast.error('メモの追加に失敗しました')
    }
  }

  const handleDeleteMemo = async (memoId: string) => {
    if (!confirm('このメモを削除しますか？')) return

    try {
      const response = await fetch(`/api/memos/${memoId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete')

      setMemos(memos.filter((m) => m.id !== memoId))
      setDisplayCount((prev) => Math.max(0, prev - 1))
      toast.success('メモを削除しました')
    } catch {
      toast.error('メモの削除に失敗しました')
    }
  }

  const startEditing = (memo: Memo) => {
    setEditingMemoId(memo.id)
    setEditContent(memo.content)
    setEditVisibility(memo.visibility)
  }

  const cancelEditing = () => {
    setEditingMemoId(null)
    setEditContent('')
    setEditVisibility('PRIVATE')
  }

  const handleEditMemo = async () => {
    if (!editingMemoId || !editContent.trim()) return

    try {
      const response = await fetch(`/api/memos/${editingMemoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editContent,
          visibility: editVisibility,
        }),
      })

      if (!response.ok) throw new Error('Failed to update')

      const updatedMemo = await response.json()
      setMemos(memos.map((m) => (m.id === editingMemoId ? updatedMemo : m)))
      setEditingMemoId(null)
      setEditContent('')
      toast.success('メモを更新しました')
    } catch {
      toast.error('メモの更新に失敗しました')
    }
  }

  const currentMemoCount = displayCount

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'gap-1',
            currentMemoCount > 0 && 'text-primary'
          )}
        >
          <MessageSquare className="h-4 w-4" />
          {currentMemoCount > 0 && (
            <span className="text-xs">{currentMemoCount}</span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>作業メモ</SheetTitle>
          <SheetDescription>
            このブロックに関するメモを追加・閲覧できます
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* メモ追加フォーム */}
          {isAdding ? (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
              <Textarea
                value={newMemoContent}
                onChange={(e) => setNewMemoContent(e.target.value)}
                placeholder="メモを入力..."
                rows={3}
                autoFocus
              />
              <div className="flex items-center justify-between">
                <Select
                  value={newMemoVisibility}
                  onValueChange={(v) => setNewMemoVisibility(v as 'PRIVATE' | 'PUBLIC')}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRIVATE">
                      <span className="flex items-center gap-2">
                        <Lock className="h-3 w-3" />
                        個人用
                      </span>
                    </SelectItem>
                    <SelectItem value="PUBLIC">
                      <span className="flex items-center gap-2">
                        <Globe className="h-3 w-3" />
                        全体向け
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsAdding(false)
                      setNewMemoContent('')
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddMemo}
                    disabled={!newMemoContent.trim()}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    投稿
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              メモを追加
            </Button>
          )}

          {/* メモ一覧 */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : memos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>メモはまだありません</p>
              </div>
            ) : (
              memos.map((memo) => (
                <div
                  key={memo.id}
                  className={cn(
                    'p-4 rounded-lg border',
                    memo.visibility === 'PUBLIC'
                      ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
                      : 'bg-background'
                  )}
                >
                  {editingMemoId === memo.id ? (
                    // 編集モード
                    <div className="space-y-3">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        autoFocus
                      />
                      <div className="flex items-center justify-between">
                        <Select
                          value={editVisibility}
                          onValueChange={(v) => setEditVisibility(v as 'PRIVATE' | 'PUBLIC')}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PRIVATE">
                              <span className="flex items-center gap-2">
                                <Lock className="h-3 w-3" />
                                個人用
                              </span>
                            </SelectItem>
                            <SelectItem value="PUBLIC">
                              <span className="flex items-center gap-2">
                                <Globe className="h-3 w-3" />
                                全体向け
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={cancelEditing}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleEditMemo}
                            disabled={!editContent.trim()}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            保存
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // 表示モード
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-sm">
                            {memo.user.name}
                          </span>
                          <Badge
                            variant={memo.visibility === 'PUBLIC' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {memo.visibility === 'PUBLIC' ? (
                              <><Globe className="h-3 w-3 mr-1" />全体向け</>
                            ) : (
                              <><Lock className="h-3 w-3 mr-1" />個人用</>
                            )}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(memo.createdAt).toLocaleDateString('ja-JP', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{memo.content}</p>
                      </div>
                      {memo.user.id === session?.user?.id && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => startEditing(memo)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteMemo(memo.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {memo.user.id !== session?.user?.id && session?.user?.isSuperAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteMemo(memo.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
