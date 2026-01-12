'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type { Business } from '@prisma/client'

type BusinessWithManuals = Business & {
  manuals?: { genre?: string | null }[]
}

export default function NewManualPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()

  const [businesses, setBusinesses] = useState<BusinessWithManuals[]>([])
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('')
  const [selectedBusinessManuals, setSelectedBusinessManuals] = useState<{ genre?: string | null }[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [genre, setGenre] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // URLパラメータから初期値を設定
  const initialBusinessId = searchParams.get('businessId')

  // 選択された事業の既存ジャンル一覧
  const existingGenres = useMemo(() => {
    const genres = selectedBusinessManuals
      .map((m) => m.genre)
      .filter((g): g is string => Boolean(g))
    return [...new Set(genres)].sort()
  }, [selectedBusinessManuals])

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user?.isSuperAdmin) {
      toast.error('マニュアルを作成する権限がありません')
      router.push('/')
      return
    }

    async function fetchBusinesses() {
      try {
        const response = await fetch('/api/businesses')
        if (!response.ok) throw new Error('Failed to fetch')
        const data = await response.json()
        setBusinesses(data)

        // 初期値を設定
        if (initialBusinessId) {
          setSelectedBusinessId(initialBusinessId)
        } else if (data.length > 0) {
          setSelectedBusinessId(data[0].id)
        }
      } catch {
        toast.error('事業の取得に失敗しました')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBusinesses()
  }, [session, status, router, initialBusinessId])

  // 事業選択が変更されたらマニュアル一覧を取得
  useEffect(() => {
    if (!selectedBusinessId) {
      setSelectedBusinessManuals([])
      return
    }

    async function fetchBusinessManuals() {
      try {
        const response = await fetch(`/api/businesses/${selectedBusinessId}`)
        if (response.ok) {
          const data = await response.json()
          setSelectedBusinessManuals(data.manuals || [])
        }
      } catch {
        // エラー時は空のリストを設定
        setSelectedBusinessManuals([])
      }
    }

    fetchBusinessManuals()
  }, [selectedBusinessId])

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('タイトルを入力してください')
      return
    }

    if (!selectedBusinessId) {
      toast.error('事業を選択してください')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/manuals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: selectedBusinessId,
          title,
          description,
          genre: genre || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create manual')
      }

      const manual = await response.json()
      toast.success('マニュアルを作成しました')
      router.push(`/manual/${manual.id}/edit`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '作成に失敗しました')
    } finally {
      setIsSaving(false)
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
    <div className="h-full flex flex-col">
      {/* ヘッダー */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="px-4 md:px-6 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2 shrink-0">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">戻る</span>
            </Button>
            <h1 className="text-lg font-semibold truncate">新規マニュアル</h1>
          </div>
          <Button onClick={handleSubmit} disabled={isSaving || !title.trim() || !selectedBusinessId} className="gap-2 shrink-0">
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">{isSaving ? '作成中...' : '作成して編集'}</span>
            <span className="sm:hidden">{isSaving ? '...' : '作成'}</span>
          </Button>
        </div>
      </div>

      {/* フォーム */}
      <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="p-4 md:p-6 bg-muted/30 rounded-lg border space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">事業</Label>
              <Select value={selectedBusinessId} onValueChange={setSelectedBusinessId}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="事業を選択" />
                </SelectTrigger>
                <SelectContent>
                  {businesses.map((business) => (
                    <SelectItem key={business.id} value={business.id}>
                      {business.displayNameLine1} {business.displayNameLine2}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">タイトル *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="マニュアルのタイトル"
                className="text-lg font-medium bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">ジャンル（任意）</Label>
              <Input
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="例：清掃、調理、接客など"
                className="bg-background"
                list="genre-suggestions"
              />
              {existingGenres.length > 0 && (
                <datalist id="genre-suggestions">
                  {existingGenres.map((g) => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
              )}
              {existingGenres.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  既存のジャンル: {existingGenres.join('、')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">説明（任意）</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="このマニュアルの概要..."
                rows={3}
                className="bg-background resize-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
