'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, FileText, ChevronRight, Shield } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Manual } from '@prisma/client'

// マニュアルの表示に必要な最小限のフィールド
type ManualSummary = Pick<Manual, 'id' | 'title' | 'status' | 'description' | 'updatedAt' | 'adminOnly'>

interface DraggableManualCardProps {
  manual: ManualSummary
  isAdmin: boolean
  onClick: () => void
}

export function DraggableManualCard({
  manual,
  isAdmin,
  onClick,
}: DraggableManualCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: manual.id, disabled: !isAdmin })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'transition-all duration-200',
        'border-l-4',
        manual.status === 'PUBLISHED' ? 'border-l-primary' : 'border-l-muted',
        isDragging && 'opacity-50 shadow-lg z-50',
        !isDragging && 'hover:shadow-lg hover:-translate-y-1'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          {/* ドラッグハンドル（管理者のみ） */}
          {isAdmin && (
            <div
              {...attributes}
              {...listeners}
              className="flex-shrink-0 p-1.5 -ml-1 cursor-grab active:cursor-grabbing touch-none rounded hover:bg-muted transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
          )}

          {/* カード本体（クリック可能） */}
          <div
            className="flex items-start gap-3 min-w-0 flex-1 cursor-pointer"
            onClick={onClick}
          >
            <div className={cn(
              'p-2 rounded-lg flex-shrink-0',
              manual.status === 'PUBLISHED' ? 'bg-primary/10' : 'bg-muted'
            )}>
              <FileText className={cn(
                'h-5 w-5',
                manual.status === 'PUBLISHED' ? 'text-primary' : 'text-muted-foreground'
              )} />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base font-semibold line-clamp-2">{manual.title}</CardTitle>
              {manual.description && (
                <CardDescription className="mt-1 text-sm line-clamp-2">{manual.description}</CardDescription>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 cursor-pointer" onClick={onClick}>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2 flex-wrap">
            {manual.status === 'DRAFT' && (
              <Badge variant="outline" className="text-xs">
                非公開
              </Badge>
            )}
            {manual.adminOnly && (
              <Badge variant="outline" className="text-xs gap-1">
                <Shield className="h-3 w-3" />
                管理者限定
              </Badge>
            )}
            <span className="text-xs">
              {new Date(manual.updatedAt).toLocaleDateString('ja-JP')}
            </span>
          </div>
          <ChevronRight className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  )
}
