'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, GripVertical, Trash2, Edit2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { WIMFieldEditor } from './WIMFieldEditor'

export interface WIMField {
  id: string
  configId: string
  fieldKey: string
  fieldType: 'text' | 'number' | 'date' | 'select' | 'textarea'
  label: string
  isRequired: boolean
  isVisible: boolean
  sortOrder: number
  options: {
    min?: number
    max?: number
    step?: number
    unit?: string
    options?: { value: string; label: string }[]
    maxLength?: number
    placeholder?: string
    rows?: number
  } | null
  createdAt: string
  updatedAt: string
}

export interface WIMConfig {
  id: string
  businessId: string
  isEnabled: boolean
  createdAt: string
  updatedAt: string
  fields: WIMField[]
}

interface WIMConfigPanelProps {
  businessId: string
}

export function WIMConfigPanel({ businessId }: WIMConfigPanelProps) {
  const [config, setConfig] = useState<WIMConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editingField, setEditingField] = useState<WIMField | null>(null)
  const [showFieldEditor, setShowFieldEditor] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch(`/api/businesses/${businessId}/work-instruction-config`)
      if (res.ok) {
        const data = await res.json()
        setConfig(data)
      }
    } catch (error) {
      console.error('Failed to fetch WIM config:', error)
      toast.error('設定の取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [businessId])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const handleToggleEnabled = async (enabled: boolean) => {
    if (!config) return

    setIsSaving(true)
    try {
      const res = await fetch(`/api/businesses/${businessId}/work-instruction-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: enabled }),
      })

      if (res.ok) {
        setConfig({ ...config, isEnabled: enabled })
        toast.success(enabled ? '作業指示メモを有効にしました' : '作業指示メモを無効にしました')
      } else {
        toast.error('設定の更新に失敗しました')
      }
    } catch (error) {
      console.error('Failed to update config:', error)
      toast.error('設定の更新に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddField = () => {
    setEditingField(null)
    setShowFieldEditor(true)
  }

  const handleEditField = (field: WIMField) => {
    setEditingField(field)
    setShowFieldEditor(true)
  }

  const handleDeleteField = async (fieldId: string) => {
    if (!confirm('このフィールドを削除しますか？')) return

    try {
      const res = await fetch(
        `/api/businesses/${businessId}/work-instruction-config/fields/${fieldId}?hard=true`,
        { method: 'DELETE' }
      )

      if (res.ok) {
        toast.success('フィールドを削除しました')
        fetchConfig()
      } else {
        toast.error('フィールドの削除に失敗しました')
      }
    } catch (error) {
      console.error('Failed to delete field:', error)
      toast.error('フィールドの削除に失敗しました')
    }
  }

  const handleFieldSaved = () => {
    setShowFieldEditor(false)
    setEditingField(null)
    fetchConfig()
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    // Reorder locally for visual feedback
    if (config) {
      const newFields = [...config.fields]
      const [draggedItem] = newFields.splice(draggedIndex, 1)
      newFields.splice(index, 0, draggedItem)
      setConfig({ ...config, fields: newFields })
      setDraggedIndex(index)
    }
  }

  const handleDragEnd = async () => {
    if (draggedIndex === null || !config) {
      setDraggedIndex(null)
      return
    }

    // Save new order to server
    try {
      const fieldIds = config.fields.map(f => f.id)
      const res = await fetch(`/api/businesses/${businessId}/work-instruction-config/fields`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldIds }),
      })

      if (!res.ok) {
        toast.error('並び順の保存に失敗しました')
        fetchConfig() // Revert
      }
    } catch (error) {
      console.error('Failed to reorder fields:', error)
      toast.error('並び順の保存に失敗しました')
      fetchConfig() // Revert
    } finally {
      setDraggedIndex(null)
    }
  }

  const fieldTypeLabels: Record<string, string> = {
    text: 'テキスト',
    number: '数値',
    date: '日付',
    select: '選択',
    textarea: '複数行',
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (showFieldEditor) {
    return (
      <WIMFieldEditor
        businessId={businessId}
        configId={config?.id || ''}
        field={editingField}
        onSave={handleFieldSaved}
        onCancel={() => {
          setShowFieldEditor(false)
          setEditingField(null)
        }}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="wim-enabled" className="text-base font-medium">
            作業指示メモ
          </Label>
          <p className="text-sm text-muted-foreground">
            この事業で作業指示メモ機能を使用する
          </p>
        </div>
        <Switch
          id="wim-enabled"
          checked={config?.isEnabled ?? false}
          onCheckedChange={handleToggleEnabled}
          disabled={isSaving}
        />
      </div>

      {config?.isEnabled && (
        <>
          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">フィールド設定</Label>
              <Button size="sm" variant="outline" onClick={handleAddField}>
                <Plus className="h-4 w-4 mr-1" />
                追加
              </Button>
            </div>

            <div className="space-y-2">
              {config.fields.filter(f => f.isVisible).map((field, index) => (
                <div
                  key={field.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-2 p-2 bg-muted/50 rounded-md border cursor-move ${
                    draggedIndex === index ? 'opacity-50' : ''
                  }`}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{field.label}</span>
                      {field.isRequired && (
                        <span className="text-xs text-destructive">*</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{fieldTypeLabels[field.fieldType] || field.fieldType}</span>
                      <span>·</span>
                      <span className="font-mono">{field.fieldKey}</span>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => handleEditField(field)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteField(field.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {config.fields.filter(f => f.isVisible).length === 0 && (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  フィールドがありません
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
