'use client'

import { useRef } from 'react'
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
import type { WIMField } from './config/WIMConfigPanel'

interface DynamicFieldProps {
  field: WIMField
  value: string | number | null | undefined
  onChange: (value: string | number | null) => void
  disabled?: boolean
}

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

export function DynamicField({ field, value, onChange, disabled }: DynamicFieldProps) {
  const renderField = () => {
    switch (field.fieldType) {
      case 'text':
        return (
          <Input
            id={field.fieldKey}
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.options?.placeholder || ''}
            maxLength={field.options?.maxLength}
            disabled={disabled}
          />
        )

      case 'number': {
        const min = field.options?.min ?? 0
        const max = field.options?.max ?? 10
        const step = field.options?.step ?? 1
        const unit = field.options?.unit || ''
        const options: number[] = []
        for (let i = min; i <= max; i += step) {
          options.push(i)
        }

        return (
          <Select
            value={String(value ?? min)}
            onValueChange={(v) => onChange(Number(v))}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}{unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      }

      case 'date':
        return (
          <DateInput
            id={field.fieldKey}
            value={(value as string) || ''}
            onChange={(v) => onChange(v)}
            disabled={disabled}
          />
        )

      case 'select': {
        const selectOptions = field.options?.options || []
        return (
          <Select
            value={(value as string) || ''}
            onValueChange={(v) => onChange(v)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="選択してください" />
            </SelectTrigger>
            <SelectContent>
              {selectOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      }

      case 'textarea':
        return (
          <Textarea
            id={field.fieldKey}
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.options?.placeholder || ''}
            rows={field.options?.rows ?? 3}
            maxLength={field.options?.maxLength}
            disabled={disabled}
          />
        )

      default:
        return (
          <Input
            id={field.fieldKey}
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
        )
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={field.fieldKey}>
        {field.label}
      </Label>
      {renderField()}
    </div>
  )
}

// フィールド値の表示用コンポーネント
export function DynamicFieldDisplay({
  field,
  value,
}: {
  field: WIMField
  value: string | number | null | undefined
}) {
  const formatValue = (): string => {
    switch (field.fieldType) {
      case 'number': {
        const unit = field.options?.unit || ''
        const numValue = value ?? 0
        return `${numValue}${unit}`
      }
      case 'date':
        if (!value) return 'なし'
        return formatDateDisplay(value as string)
      case 'select': {
        if (!value) return 'なし'
        const selectOptions = field.options?.options || []
        const option = selectOptions.find((opt) => opt.value === value)
        return option?.label || (value as string)
      }
      case 'text':
      case 'textarea':
        if (value === null || value === undefined || value === '') return 'なし'
        return String(value)
      default:
        if (value === null || value === undefined || value === '') return 'なし'
        return String(value)
    }
  }

  return (
    <div>
      <dt className="text-xs text-muted-foreground">{field.label}</dt>
      <dd className="font-medium">{formatValue()}</dd>
    </div>
  )
}
