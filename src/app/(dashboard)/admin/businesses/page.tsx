'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, Building2, Edit, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { useBusinessStore, type BusinessWithManuals } from '@/stores/useBusinessStore'

export default function AdminBusinessesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { setBusinesses: setGlobalBusinesses } = useBusinessStore()
  const [businesses, setBusinesses] = useState<BusinessWithManuals[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBusiness, setEditingBusiness] = useState<BusinessWithManuals | null>(null)

  // フォーム状態
  const [displayNameLine1, setDisplayNameLine1] = useState('')
  const [displayNameLine2, setDisplayNameLine2] = useState('')
  const [description, setDescription] = useState('')
  const [themeColors, setThemeColors] = useState<string[]>(['#000000'])

  const fetchBusinesses = useCallback(async () => {
    try {
      const response = await fetch('/api/businesses')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setBusinesses(data)
      // グローバルストアも更新してヘッダーのテーマカラーを即時反映
      setGlobalBusinesses(data)
    } catch {
      toast.error('事業の取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [setGlobalBusinesses])

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user?.isSuperAdmin) {
      router.push('/')
      return
    }

    fetchBusinesses()
  }, [session, status, router, fetchBusinesses])

  const resetForm = () => {
    setDisplayNameLine1('')
    setDisplayNameLine2('')
    setDescription('')
    setThemeColors(['#000000'])
    setEditingBusiness(null)
  }

  // システム名を自動生成（表示名から英数字のスラッグを生成）
  const generateSystemName = (line1: string, line2: string) => {
    const combined = `${line1}-${line2}`
    // 日本語をそのまま使用し、スペースをハイフンに変換、特殊文字を除去
    return combined
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf-]/g, '')
      .slice(0, 50) || `business-${Date.now()}`
  }

  const handleOpenDialog = (business?: BusinessWithManuals) => {
    if (business) {
      setEditingBusiness(business)
      setDisplayNameLine1(business.displayNameLine1)
      setDisplayNameLine2(business.displayNameLine2)
      setDescription(business.description || '')
      // themeColorsがあればそれを使用、なければcolorから変換、どちらもなければデフォルト
      if (business.themeColors && business.themeColors.length > 0) {
        setThemeColors(business.themeColors)
      } else if (business.color) {
        setThemeColors([business.color])
      } else {
        setThemeColors(['#000000'])
      }
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!displayNameLine1 || !displayNameLine2) {
      toast.error('表示名を入力してください')
      return
    }

    // システム名を自動生成（編集時は既存のnameを使用）
    const systemName = editingBusiness
      ? editingBusiness.name
      : generateSystemName(displayNameLine1, displayNameLine2)

    try {
      const url = editingBusiness
        ? `/api/businesses/${editingBusiness.id}`
        : '/api/businesses'
      const method = editingBusiness ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: systemName,
          displayNameLine1,
          displayNameLine2,
          description,
          themeColors: themeColors.filter(c => c), // 空の色を除外
          color: themeColors[0] || '#000000', // 後方互換性のため1色目をcolorにも保存
        }),
      })

      if (!response.ok) throw new Error('Failed to save')

      toast.success(editingBusiness ? '事業を更新しました' : '事業を作成しました')
      setIsDialogOpen(false)
      resetForm()
      fetchBusinesses()
    } catch {
      toast.error('保存に失敗しました')
    }
  }

  const handleDelete = async (business: BusinessWithManuals) => {
    if (!confirm(`「${business.displayNameLine1} ${business.displayNameLine2}」を削除しますか？`)) {
      return
    }

    try {
      const response = await fetch(`/api/businesses/${business.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete')

      toast.success('事業を削除しました')
      fetchBusinesses()
    } catch {
      toast.error('削除に失敗しました')
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">事業管理</h1>
          <p className="text-muted-foreground text-sm">事業の追加・編集・削除</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              新規事業
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingBusiness ? '事業を編集' : '新規事業'}
              </DialogTitle>
              <DialogDescription>
                事業情報を入力してください
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>表示名1行目</Label>
                <Input
                  value={displayNameLine1}
                  onChange={(e) => setDisplayNameLine1(e.target.value)}
                  placeholder="お食事処"
                />
              </div>
              <div>
                <Label>表示名2行目</Label>
                <Input
                  value={displayNameLine2}
                  onChange={(e) => setDisplayNameLine2(e.target.value)}
                  placeholder="もっか"
                />
              </div>
              <div>
                <Label>説明（任意）</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="事業の説明..."
                  rows={2}
                />
              </div>
              <div>
                <Label>テーマカラー（グラデーション：最大3色）</Label>
                <div className="space-y-2 mt-2">
                  {themeColors.map((color, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        type="color"
                        value={color}
                        onChange={(e) => {
                          const newColors = [...themeColors]
                          newColors[index] = e.target.value
                          setThemeColors(newColors)
                        }}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={color}
                        onChange={(e) => {
                          const newColors = [...themeColors]
                          newColors[index] = e.target.value
                          setThemeColors(newColors)
                        }}
                        placeholder="#000000"
                        className="flex-1"
                      />
                      {themeColors.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setThemeColors(themeColors.filter((_, i) => i !== index))
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {themeColors.length < 3 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setThemeColors([...themeColors, '#888888'])}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      色を追加
                    </Button>
                  )}
                </div>
                {/* プレビュー */}
                <div className="mt-3">
                  <Label className="text-xs text-muted-foreground">プレビュー</Label>
                  <div
                    className="h-8 rounded-md mt-1"
                    style={{
                      background: themeColors.length === 1
                        ? themeColors[0]
                        : `linear-gradient(to right, ${themeColors.join(', ')})`
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleSubmit}>
                  {editingBusiness ? '更新' : '作成'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {businesses.map((business) => (
          <Card key={business.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      background: business.themeColors && business.themeColors.length > 0
                        ? business.themeColors.length === 1
                          ? business.themeColors[0]
                          : `linear-gradient(135deg, ${business.themeColors.join(', ')})`
                        : business.color || '#e5e7eb'
                    }}
                  >
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      {business.displayNameLine1}
                      <br />
                      {business.displayNameLine2}
                    </CardTitle>
                  </div>
                </div>
                <Badge variant={business.isActive ? 'default' : 'secondary'}>
                  {business.isActive ? '有効' : '無効'}
                </Badge>
              </div>
              {business.description && (
                <CardDescription className="mt-2">
                  {business.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenDialog(business)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  編集
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(business)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  削除
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {businesses.length === 0 && (
          <Card className="col-span-full p-8 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              事業がまだ登録されていません
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
