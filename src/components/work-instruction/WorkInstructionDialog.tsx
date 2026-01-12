'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Archive, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { WorkInstructionList } from './WorkInstructionList'
import { WorkInstructionForm } from './WorkInstructionForm'
import type { WorkInstructionMemo } from './WorkInstructionCard'
import type { WIMConfig } from './config/WIMConfigPanel'

interface WorkInstructionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  businessId?: string
  onCountChange?: (count: number) => void
}

export function WorkInstructionDialog({
  open,
  onOpenChange,
  businessId,
  onCountChange,
}: WorkInstructionDialogProps) {
  const { data: session } = useSession()
  const isSuperAdmin = session?.user?.isSuperAdmin

  const [view, setView] = useState<'active' | 'archived'>('active')
  const [showForm, setShowForm] = useState(false)
  const [editingMemo, setEditingMemo] = useState<WorkInstructionMemo | null>(null)
  const [memos, setMemos] = useState<WorkInstructionMemo[]>([])
  const [archivedMemos, setArchivedMemos] = useState<WorkInstructionMemo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [config, setConfig] = useState<WIMConfig | null>(null)

  const fetchConfig = useCallback(async () => {
    if (!businessId) return

    try {
      const res = await fetch(`/api/businesses/${businessId}/work-instruction-config`)
      if (res.ok) {
        const data = await res.json()
        setConfig(data)
      }
    } catch (error) {
      console.error('Failed to fetch WIM config:', error)
    }
  }, [businessId])

  const fetchMemos = useCallback(async () => {
    try {
      const url = businessId
        ? `/api/work-instruction-memos?businessId=${businessId}`
        : '/api/work-instruction-memos'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setMemos(data)
        onCountChange?.(data.length)
      }
    } catch (error) {
      console.error('Failed to fetch work instruction memos:', error)
    }
  }, [businessId, onCountChange])

  const fetchArchivedMemos = useCallback(async () => {
    try {
      const url = businessId
        ? `/api/work-instruction-memos/archived?businessId=${businessId}`
        : '/api/work-instruction-memos/archived'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setArchivedMemos(data)
      }
    } catch (error) {
      console.error('Failed to fetch archived work instruction memos:', error)
    }
  }, [businessId])

  useEffect(() => {
    if (open) {
      let isMounted = true
      const loadData = async () => {
        if (isMounted) setIsLoading(true)
        try {
          await Promise.all([fetchConfig(), fetchMemos(), fetchArchivedMemos()])
        } finally {
          if (isMounted) setIsLoading(false)
        }
      }
      loadData()
      return () => { isMounted = false }
    }
  }, [open, fetchConfig, fetchMemos, fetchArchivedMemos])

  const handleCreateSuccess = () => {
    setShowForm(false)
    setEditingMemo(null)
    fetchMemos()
    fetchArchivedMemos()
  }

  const handleEdit = (memo: WorkInstructionMemo) => {
    setEditingMemo(memo)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この作業指示メモを削除しますか？')) return

    try {
      const res = await fetch(`/api/work-instruction-memos/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchMemos()
        fetchArchivedMemos()
      }
    } catch (error) {
      console.error('Failed to delete work instruction memo:', error)
    }
  }

  // フォーム表示中
  if (showForm) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto w-[calc(100vw-2rem)] sm:w-full p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {editingMemo ? '作業指示メモを編集' : '新しい作業指示メモ'}
            </DialogTitle>
          </DialogHeader>
          <WorkInstructionForm
            memo={editingMemo}
            businessId={businessId}
            config={config}
            onSuccess={handleCreateSuccess}
            onCancel={() => {
              setShowForm(false)
              setEditingMemo(null)
            }}
          />
        </DialogContent>
      </Dialog>
    )
  }

  // リスト表示
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto w-[calc(100vw-2rem)] sm:w-full p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pr-8">
            <span>作業指示メモ</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant={view === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('active')}
              >
                アクティブ ({memos.length})
              </Button>
              <Button
                variant={view === 'archived' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('archived')}
              >
                <Archive className="h-4 w-4 mr-1" />
                アーカイブ
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {isSuperAdmin && view === 'active' && (
          <Button onClick={() => setShowForm(true)} className="w-full mb-4">
            <Plus className="h-4 w-4 mr-2" />
            新しい作業指示を追加
          </Button>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <WorkInstructionList
            memos={view === 'active' ? memos : archivedMemos}
            config={config}
            isArchived={view === 'archived'}
            isSuperAdmin={isSuperAdmin}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
