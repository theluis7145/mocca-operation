'use client'

import { useState, useEffect, useRef } from 'react'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { DynamicField, DynamicFieldDisplay } from './DynamicField'
import type { WorkInstructionMemo } from './WorkInstructionCard'
import type { WIMConfig } from './config/WIMConfigPanel'

interface WorkInstructionFormProps {
  memo?: WorkInstructionMemo | null
  businessId?: string
  config?: WIMConfig | null
  onSuccess: () => void
  onCancel: () => void
}

const NUMBER_OPTIONS = Array.from({ length: 11 }, (_, i) => i)
const MEAL_OPTIONS = ['2食付き', 'アラカルト', 'カスタム'] as const

// 日付をYYYY/MM/DD形式でフォーマット
function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  return `${year}/${month}/${day}`
}

// カスタム日付入力コンポーネント
function DateInput({
  id,
  value,
  onChange,
  min,
  disabled,
  placeholder = '年/月/日',
}: {
  id: string
  value: string
  onChange: (value: string) => void
  min?: string
  disabled?: boolean
  placeholder?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    if (!disabled && inputRef.current) {
      try {
        inputRef.current.showPicker()
      } catch {
        // showPicker() not supported, fallback to focus
        inputRef.current.focus()
      }
    }
  }

  return (
    <div className="relative" onClick={handleClick}>
      <input
        ref={inputRef}
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        disabled={disabled}
        placeholder={placeholder}
        className={`h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${
          !value ? 'text-muted-foreground' : ''
        }`}
      />
    </div>
  )
}

export function WorkInstructionForm({
  memo,
  businessId,
  config,
  onSuccess,
  onCancel,
}: WorkInstructionFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // 動的フィールドの値（configがある場合に使用）
  const [fieldValues, setFieldValues] = useState<Record<string, string | number | null>>({})

  // レガシーフィールド（configがない場合に使用）
  const [customerName, setCustomerName] = useState(memo?.customerName ?? '')
  const [stayStartDate, setStayStartDate] = useState(memo?.stayStartDate ?? '')
  const [stayEndDate, setStayEndDate] = useState(memo?.stayEndDate ?? '')
  const [adultCount, setAdultCount] = useState(memo?.adultCount ?? 2)
  const [childCount, setChildCount] = useState(memo?.childCount ?? 0)
  const [adultFutonCount, setAdultFutonCount] = useState(memo?.adultFutonCount ?? 2)
  const [childFutonCount, setChildFutonCount] = useState(memo?.childFutonCount ?? 0)
  const [mealPlan, setMealPlan] = useState(memo?.mealPlan ?? '2食付き')
  const [mealPlanDetail, setMealPlanDetail] = useState(memo?.mealPlanDetail ?? '')
  const [notes, setNotes] = useState(memo?.notes ?? '')

  // Initialize field values from memo when using dynamic fields
  useEffect(() => {
    if (config?.fields && memo?.fieldValues) {
      setFieldValues(memo.fieldValues)
    } else if (config?.fields && memo) {
      // Convert legacy fields to fieldValues format
      const legacyValues: Record<string, string | number | null> = {}
      const visibleFields = config.fields.filter(f => f.isVisible)
      visibleFields.forEach(field => {
        switch (field.fieldKey) {
          case 'customer_name':
            legacyValues[field.fieldKey] = memo.customerName || ''
            break
          case 'stay_start_date':
            legacyValues[field.fieldKey] = memo.stayStartDate || ''
            break
          case 'stay_end_date':
            legacyValues[field.fieldKey] = memo.stayEndDate || ''
            break
          case 'adult_count':
            legacyValues[field.fieldKey] = memo.adultCount ?? 0
            break
          case 'child_count':
            legacyValues[field.fieldKey] = memo.childCount ?? 0
            break
          case 'adult_futon_count':
            legacyValues[field.fieldKey] = memo.adultFutonCount ?? 0
            break
          case 'child_futon_count':
            legacyValues[field.fieldKey] = memo.childFutonCount ?? 0
            break
          case 'meal_plan':
            legacyValues[field.fieldKey] = memo.mealPlan || ''
            break
          case 'notes':
            legacyValues[field.fieldKey] = memo.notes || ''
            break
        }
      })
      setFieldValues(legacyValues)
    }
  }, [config, memo])

  const handleFieldChange = (fieldKey: string, value: string | number | null) => {
    setFieldValues(prev => ({ ...prev, [fieldKey]: value }))
  }

  const handleShowPreviewDynamic = (e: React.FormEvent) => {
    e.preventDefault()

    if (!businessId) {
      toast.error('事業IDが必要です')
      return
    }

    setShowPreview(true)
  }

  const handleSubmitDynamic = async () => {
    setIsLoading(true)
    try {
      const payload = {
        businessId,
        fieldValues,
      }

      const url = memo
        ? `/api/work-instruction-memos/${memo.id}`
        : '/api/work-instruction-memos'
      const method = memo ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '保存に失敗しました')
      }

      toast.success(memo ? '作業指示メモを更新しました' : '作業指示メモを作成しました')
      onSuccess()
    } catch (error) {
      console.error('Failed to save work instruction memo:', error)
      toast.error(error instanceof Error ? error.message : '保存に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleShowPreviewLegacy = (e: React.FormEvent) => {
    e.preventDefault()
    setShowPreview(true)
  }

  const handleSubmitLegacy = async () => {
    setIsLoading(true)
    try {
      const payload = {
        businessId,
        customerName: customerName.trim(),
        stayStartDate,
        stayEndDate,
        adultCount,
        childCount,
        adultFutonCount,
        childFutonCount,
        mealPlan,
        mealPlanDetail: mealPlan === 'カスタム' ? mealPlanDetail : null,
        notes: notes.trim() || null,
      }

      const url = memo
        ? `/api/work-instruction-memos/${memo.id}`
        : '/api/work-instruction-memos'
      const method = memo ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '保存に失敗しました')
      }

      toast.success(memo ? '作業指示メモを更新しました' : '作業指示メモを作成しました')
      onSuccess()
    } catch (error) {
      console.error('Failed to save work instruction memo:', error)
      toast.error(error instanceof Error ? error.message : '保存に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  // Use dynamic form if config has fields
  const visibleFields = config?.fields?.filter(f => f.isVisible) || []
  const useDynamicForm = visibleFields.length > 0

  // Dynamic form preview
  if (useDynamicForm && showPreview && !memo) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon" onClick={() => setShowPreview(false)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h3 className="font-medium">プレビュー</h3>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
          <dl className="grid grid-cols-1 gap-3">
            {visibleFields.map((field) => (
              <DynamicFieldDisplay
                key={field.id}
                field={field}
                value={fieldValues[field.fieldKey]}
              />
            ))}
          </dl>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPreview(false)}
            disabled={isLoading}
          >
            戻る
          </Button>
          <Button onClick={handleSubmitDynamic} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            作成する
          </Button>
        </div>
      </div>
    )
  }

  // Dynamic form
  if (useDynamicForm) {
    return (
      <form onSubmit={memo ? handleSubmitDynamic : handleShowPreviewDynamic} className="space-y-4">
        {visibleFields.map((field) => (
          <DynamicField
            key={field.id}
            field={field}
            value={fieldValues[field.fieldKey]}
            onChange={(value) => handleFieldChange(field.fieldKey, value)}
            disabled={isLoading}
          />
        ))}

        {/* ボタン */}
        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            キャンセル
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {memo ? '更新する' : '作成する'}
          </Button>
        </div>
      </form>
    )
  }

  // Legacy form preview
  if (showPreview && !memo) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon" onClick={() => setShowPreview(false)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h3 className="font-medium">プレビュー</h3>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
          <dl className="grid grid-cols-1 gap-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">お客様のお名前</dt>
              <dd className="font-medium">{customerName || 'なし'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">宿泊日程</dt>
              <dd className="font-medium">
                {stayStartDate ? formatDateDisplay(stayStartDate) : 'なし'} 〜 {stayEndDate ? formatDateDisplay(stayEndDate) : 'なし'}
              </dd>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <dt className="text-xs text-muted-foreground">大人人数</dt>
                <dd className="font-medium">{adultCount}名</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">幼児人数</dt>
                <dd className="font-medium">{childCount}名</dd>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <dt className="text-xs text-muted-foreground">大人用布団</dt>
                <dd className="font-medium">{adultFutonCount}組</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">幼児用布団</dt>
                <dd className="font-medium">{childFutonCount}組</dd>
              </div>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">食事</dt>
              <dd className="font-medium">
                {mealPlan === 'カスタム' && mealPlanDetail ? mealPlanDetail : mealPlan || 'なし'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">その他連絡事項</dt>
              <dd className="font-medium whitespace-pre-wrap">{notes || 'なし'}</dd>
            </div>
          </dl>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPreview(false)}
            disabled={isLoading}
          >
            戻る
          </Button>
          <Button onClick={handleSubmitLegacy} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            作成する
          </Button>
        </div>
      </div>
    )
  }

  // Legacy form
  return (
    <form onSubmit={memo ? handleSubmitLegacy : handleShowPreviewLegacy} className="space-y-4">
      {/* お客様のお名前 */}
      <div className="space-y-2">
        <Label htmlFor="customerName">お客様のお名前</Label>
        <Input
          id="customerName"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="例: 山田太郎"
          disabled={isLoading}
        />
      </div>

      {/* 宿泊日程 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="stayStartDate">宿泊開始日</Label>
          <DateInput
            id="stayStartDate"
            value={stayStartDate}
            onChange={setStayStartDate}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stayEndDate">宿泊終了日</Label>
          <DateInput
            id="stayEndDate"
            value={stayEndDate}
            onChange={setStayEndDate}
            min={stayStartDate}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* 宿泊人数 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>大人人数</Label>
          <Select
            value={String(adultCount)}
            onValueChange={(v) => setAdultCount(Number(v))}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NUMBER_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}名
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>幼児人数</Label>
          <Select
            value={String(childCount)}
            onValueChange={(v) => setChildCount(Number(v))}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NUMBER_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}名
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 布団の数 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>大人用布団</Label>
          <Select
            value={String(adultFutonCount)}
            onValueChange={(v) => setAdultFutonCount(Number(v))}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NUMBER_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}組
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>幼児用布団</Label>
          <Select
            value={String(childFutonCount)}
            onValueChange={(v) => setChildFutonCount(Number(v))}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NUMBER_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}組
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 食事 */}
      <div className="space-y-2">
        <Label>食事</Label>
        <Select
          value={mealPlan}
          onValueChange={setMealPlan}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MEAL_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* カスタム食事詳細 */}
      {mealPlan === 'カスタム' && (
        <div className="space-y-2">
          <Label htmlFor="mealPlanDetail">食事詳細</Label>
          <Textarea
            id="mealPlanDetail"
            value={mealPlanDetail}
            onChange={(e) => setMealPlanDetail(e.target.value)}
            placeholder="食事に関する詳細情報を入力..."
            rows={2}
            disabled={isLoading}
          />
        </div>
      )}

      {/* その他連絡事項 */}
      <div className="space-y-2">
        <Label htmlFor="notes">その他連絡事項</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="特記事項があれば入力..."
          rows={3}
          disabled={isLoading}
        />
      </div>

      {/* ボタン */}
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          キャンセル
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {memo ? '更新する' : '作成する'}
        </Button>
      </div>
    </form>
  )
}
