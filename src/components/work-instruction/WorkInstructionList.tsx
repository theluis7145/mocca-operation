'use client'

import { ClipboardList } from 'lucide-react'
import { WorkInstructionCard, type WorkInstructionMemo } from './WorkInstructionCard'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { WIMConfig } from './config/WIMConfigPanel'

interface WorkInstructionListProps {
  memos: WorkInstructionMemo[]
  config?: WIMConfig | null
  isArchived?: boolean
  isSuperAdmin?: boolean
  onEdit?: (memo: WorkInstructionMemo) => void
  onDelete?: (id: string) => void
}

export function WorkInstructionList({
  memos,
  config,
  isArchived = false,
  isSuperAdmin = false,
  onEdit,
  onDelete,
}: WorkInstructionListProps) {
  if (memos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-4 rounded-full bg-muted mb-4">
          <ClipboardList className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-1">
          {isArchived ? 'アーカイブはありません' : '作業指示メモはありません'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {isArchived
            ? '宿泊終了日を過ぎたメモがここに表示されます'
            : '現在、アクティブな作業指示メモはありません'}
        </p>
      </div>
    )
  }

  return (
    <ScrollArea className="max-h-[60vh]">
      <div className="space-y-3 pr-4">
        {memos.map((memo) => (
          <WorkInstructionCard
            key={memo.id}
            memo={memo}
            config={config}
            isArchived={isArchived}
            isSuperAdmin={isSuperAdmin}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </ScrollArea>
  )
}
