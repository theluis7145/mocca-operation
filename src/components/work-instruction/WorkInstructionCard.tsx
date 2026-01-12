'use client'

import { Calendar, Users, Bed, Utensils, Edit2, Trash2, Archive } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { DynamicFieldDisplay } from './DynamicField'
import type { WIMConfig } from './config/WIMConfigPanel'

export interface WorkInstructionMemo {
  id: string
  businessId?: string
  customerName: string
  stayStartDate: string
  stayEndDate: string
  adultCount: number
  childCount: number
  adultFutonCount: number
  childFutonCount: number
  mealPlan: string
  mealPlanDetail: string | null
  notes: string | null
  fieldValues?: Record<string, string | number | null> | null
  isArchived: boolean
  archivedAt: string | null
  createdAt: string
}

interface WorkInstructionCardProps {
  memo: WorkInstructionMemo
  config?: WIMConfig | null
  isArchived?: boolean
  isSuperAdmin?: boolean
  onEdit?: (memo: WorkInstructionMemo) => void
  onDelete?: (id: string) => void
}

export function WorkInstructionCard({
  memo,
  config,
  isArchived = false,
  isSuperAdmin = false,
  onEdit,
  onDelete,
}: WorkInstructionCardProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
    })
  }

  const formatMealPlan = (plan: string, detail: string | null) => {
    if (plan === 'カスタム' && detail) {
      return detail
    }
    return plan
  }

  // Check if we should use dynamic display
  const visibleFields = config?.fields?.filter(f => f.isVisible) || []
  const useDynamicDisplay = visibleFields.length > 0 && memo.fieldValues

  // Get customer name from fieldValues if available
  const getDisplayName = () => {
    if (useDynamicDisplay && memo.fieldValues) {
      const customerField = visibleFields.find(f =>
        f.fieldKey === 'customer_name' || f.fieldType === 'text'
      )
      if (customerField && memo.fieldValues[customerField.fieldKey]) {
        return `${memo.fieldValues[customerField.fieldKey]} 様`
      }
    }
    return memo.customerName ? `${memo.customerName} 様` : '名前なし'
  }

  // Dynamic display
  if (useDynamicDisplay && memo.fieldValues) {
    // Group fields by type for better display
    const dateFields = visibleFields.filter(f => f.fieldType === 'date')
    const otherFields = visibleFields.filter(f => f.fieldType !== 'date')

    return (
      <Card className={cn('transition-all', isArchived && 'opacity-70')}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-semibold">
              {getDisplayName()}
            </CardTitle>
            {isArchived && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Archive className="h-3 w-3" />
                アーカイブ
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Date fields as a row */}
          {dateFields.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span>
                {dateFields.map((field, i) => {
                  const value = memo.fieldValues![field.fieldKey]
                  if (!value) return null
                  const dateStr = new Date(value as string).toLocaleDateString('ja-JP', {
                    month: 'short',
                    day: 'numeric',
                  })
                  return (
                    <span key={field.id}>
                      {i > 0 && ' 〜 '}
                      {dateStr}
                    </span>
                  )
                })}
              </span>
            </div>
          )}

          {/* Other fields */}
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {otherFields.map((field) => {
              // Skip customer name as it's shown in header
              if (field.fieldKey === 'customer_name') return null

              const value = memo.fieldValues![field.fieldKey]
              if (value === null || value === undefined || value === '') return null

              return (
                <DynamicFieldDisplay
                  key={field.id}
                  field={field}
                  value={value}
                />
              )
            })}
          </dl>

          {/* 管理者アクション */}
          {isSuperAdmin && !isArchived && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1"
                onClick={() => onEdit?.(memo)}
              >
                <Edit2 className="h-4 w-4" />
                編集
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-destructive hover:text-destructive"
                onClick={() => onDelete?.(memo.id)}
              >
                <Trash2 className="h-4 w-4" />
                削除
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Legacy display
  return (
    <Card className={cn('transition-all', isArchived && 'opacity-70')}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold">
            {memo.customerName} 様
          </CardTitle>
          {isArchived && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Archive className="h-3 w-3" />
              アーカイブ
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 宿泊日程 */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>
            {formatDate(memo.stayStartDate)} 〜 {formatDate(memo.stayEndDate)}
          </span>
        </div>

        {/* 宿泊人数 */}
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>
            大人 {memo.adultCount}名
            {memo.childCount > 0 && `、幼児 ${memo.childCount}名`}
          </span>
        </div>

        {/* 布団の数 */}
        <div className="flex items-center gap-2 text-sm">
          <Bed className="h-4 w-4 text-muted-foreground" />
          <span>
            布団: 大人用 {memo.adultFutonCount}組
            {memo.childFutonCount > 0 && `、幼児用 ${memo.childFutonCount}組`}
          </span>
        </div>

        {/* 食事 */}
        <div className="flex items-center gap-2 text-sm">
          <Utensils className="h-4 w-4 text-muted-foreground" />
          <span>{formatMealPlan(memo.mealPlan, memo.mealPlanDetail)}</span>
        </div>

        {/* その他連絡事項 */}
        {memo.notes && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {memo.notes}
            </p>
          </div>
        )}

        {/* 管理者アクション */}
        {isSuperAdmin && !isArchived && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={() => onEdit?.(memo)}
            >
              <Edit2 className="h-4 w-4" />
              編集
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-destructive hover:text-destructive"
              onClick={() => onDelete?.(memo.id)}
            >
              <Trash2 className="h-4 w-4" />
              削除
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
