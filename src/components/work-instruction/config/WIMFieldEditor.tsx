'use client'

import { useState } from 'react'
import { ArrowLeft, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type { WIMField } from './WIMConfigPanel'

interface WIMFieldEditorProps {
  businessId: string
  configId: string
  field: WIMField | null
  onSave: () => void
  onCancel: () => void
}

type FieldType = 'text' | 'number' | 'date' | 'select' | 'textarea'

interface FieldOptions {
  min?: number
  max?: number
  step?: number
  unit?: string
  options?: { value: string; label: string }[]
  maxLength?: number
  placeholder?: string
  rows?: number
}

export function WIMFieldEditor({
  businessId,
  // configId is passed for future use (e.g., multi-config support)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  configId: _configId,
  field,
  onSave,
  onCancel,
}: WIMFieldEditorProps) {
  // fieldKey is read-only after initial creation
  const fieldKey = field?.fieldKey || ''
  const [fieldType, setFieldType] = useState<FieldType>(field?.fieldType || 'text')
  const [label, setLabel] = useState(field?.label || '')
  const [options, setOptions] = useState<FieldOptions>(field?.options || {})
  const [isSaving, setIsSaving] = useState(false)

  // Select options management
  const [selectOptions, setSelectOptions] = useState<{ value: string; label: string }[]>(
    field?.options?.options || [{ value: '', label: '' }]
  )

  const generateFieldKey = (labelText: string) => {
    // Generate unique field key with timestamp suffix
    const timestamp = Date.now().toString(36)
    const baseKey = labelText
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '_')
      .slice(0, 20) || 'field'
    return `${baseKey}_${timestamp}`
  }

  const handleLabelChange = (value: string) => {
    setLabel(value)
  }

  const handleTypeChange = (type: FieldType) => {
    setFieldType(type)
    // Reset options when type changes
    if (type === 'number') {
      setOptions({ min: 0, max: 10, step: 1, unit: '' })
    } else if (type === 'select') {
      setOptions({ options: selectOptions })
    } else if (type === 'textarea') {
      setOptions({ rows: 3 })
    } else {
      setOptions({})
    }
  }

  const handleAddSelectOption = () => {
    setSelectOptions([...selectOptions, { value: '', label: '' }])
  }

  const handleRemoveSelectOption = (index: number) => {
    if (selectOptions.length > 1) {
      setSelectOptions(selectOptions.filter((_, i) => i !== index))
    }
  }

  const handleSelectOptionChange = (index: number, key: 'value' | 'label', value: string) => {
    const newOptions = [...selectOptions]
    newOptions[index][key] = value
    // Auto-fill value from label if value is empty
    if (key === 'label' && !newOptions[index].value) {
      newOptions[index].value = value
    }
    setSelectOptions(newOptions)
  }

  const handleSubmit = async () => {
    if (!label.trim()) {
      toast.error('ラベルを入力してください')
      return
    }

    // 新規作成時はフィールドキーを自動生成
    const finalFieldKey = field ? fieldKey : generateFieldKey(label)

    setIsSaving(true)

    try {
      // Build options based on field type
      let finalOptions: FieldOptions | null = null
      if (fieldType === 'number') {
        finalOptions = {
          min: options.min ?? 0,
          max: options.max ?? 10,
          step: options.step ?? 1,
          unit: options.unit || '',
        }
      } else if (fieldType === 'select') {
        const validOptions = selectOptions.filter(o => o.value && o.label)
        if (validOptions.length === 0) {
          toast.error('選択肢を1つ以上追加してください')
          setIsSaving(false)
          return
        }
        finalOptions = { options: validOptions }
      } else if (fieldType === 'textarea') {
        finalOptions = { rows: options.rows ?? 3 }
      } else if (fieldType === 'text') {
        finalOptions = options.maxLength ? { maxLength: options.maxLength } : null
      }

      const body = {
        fieldKey: finalFieldKey,
        fieldType,
        label: label.trim(),
        isRequired: false,
        options: finalOptions,
      }

      const url = field
        ? `/api/businesses/${businessId}/work-instruction-config/fields/${field.id}`
        : `/api/businesses/${businessId}/work-instruction-config/fields`
      const method = field ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success(field ? 'フィールドを更新しました' : 'フィールドを追加しました')
        onSave()
      } else {
        const data = await res.json()
        toast.error(data.error || '保存に失敗しました')
      }
    } catch (error) {
      console.error('Failed to save field:', error)
      toast.error('保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-medium">
          {field ? 'フィールドを編集' : '新しいフィールド'}
        </h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>ラベル</Label>
          <Input
            value={label}
            onChange={(e) => handleLabelChange(e.target.value)}
            placeholder="お客様のお名前"
          />
        </div>

        {/* フィールドキーは編集時のみ表示（読み取り専用） */}
        {field && (
          <div className="space-y-1.5">
            <Label>フィールドキー</Label>
            <Input
              value={fieldKey}
              readOnly
              className="font-mono text-sm bg-muted"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label>タイプ</Label>
          <Select value={fieldType} onValueChange={(v) => handleTypeChange(v as FieldType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">テキスト</SelectItem>
              <SelectItem value="number">数値プルダウン</SelectItem>
              <SelectItem value="date">日付</SelectItem>
              <SelectItem value="select">選択</SelectItem>
              <SelectItem value="textarea">複数行テキスト</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Number type options */}
        {fieldType === 'number' && (
          <div className="space-y-3 p-3 bg-muted/50 rounded-md">
            <Label className="text-sm">数値設定</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">最小値</Label>
                <Input
                  type="number"
                  value={options.min ?? 0}
                  onChange={(e) => setOptions({ ...options, min: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label className="text-xs">最大値</Label>
                <Input
                  type="number"
                  value={options.max ?? 10}
                  onChange={(e) => setOptions({ ...options, max: parseInt(e.target.value) || 10 })}
                />
              </div>
              <div>
                <Label className="text-xs">ステップ</Label>
                <Input
                  type="number"
                  value={options.step ?? 1}
                  onChange={(e) => setOptions({ ...options, step: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label className="text-xs">単位</Label>
                <Input
                  value={options.unit || ''}
                  onChange={(e) => setOptions({ ...options, unit: e.target.value })}
                  placeholder="名"
                />
              </div>
            </div>
          </div>
        )}

        {/* Select type options */}
        {fieldType === 'select' && (
          <div className="space-y-3 p-3 bg-muted/50 rounded-md">
            <Label className="text-sm">選択肢</Label>
            <div className="space-y-2">
              {selectOptions.map((opt, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={opt.label}
                    onChange={(e) => handleSelectOptionChange(index, 'label', e.target.value)}
                    placeholder="表示名"
                    className="flex-1"
                  />
                  <Input
                    value={opt.value}
                    onChange={(e) => handleSelectOptionChange(index, 'value', e.target.value)}
                    placeholder="値"
                    className="flex-1 font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveSelectOption(index)}
                    disabled={selectOptions.length <= 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSelectOption}
              >
                <Plus className="h-4 w-4 mr-1" />
                選択肢を追加
              </Button>
            </div>
          </div>
        )}

        {/* Textarea type options */}
        {fieldType === 'textarea' && (
          <div className="space-y-3 p-3 bg-muted/50 rounded-md">
            <Label className="text-sm">テキストエリア設定</Label>
            <div>
              <Label className="text-xs">行数</Label>
              <Input
                type="number"
                value={options.rows ?? 3}
                onChange={(e) => setOptions({ ...options, rows: parseInt(e.target.value) || 3 })}
                min={1}
                max={10}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onCancel}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? '保存中...' : field ? '更新' : '追加'}
          </Button>
        </div>
      </div>
    </div>
  )
}
