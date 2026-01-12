'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { Plus, FileText, Archive, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { DraggableManualCard } from '@/components/manual/DraggableManualCard'
import type { Business, Manual } from '@prisma/client'

type ManualWithGenre = Manual & {
  genre?: string | null
}

type BusinessWithManuals = Business & {
  manuals: ManualWithGenre[]
}

export default function BusinessPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [business, setBusiness] = useState<BusinessWithManuals | null>(null)
  const [manuals, setManuals] = useState<ManualWithGenre[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [selectedGenre, setSelectedGenre] = useState<string>('all')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    async function fetchBusiness() {
      try {
        const [businessRes, permissionRes] = await Promise.all([
          fetch(`/api/businesses/${params.id}`, { cache: 'no-store' }),
          fetch(`/api/businesses/${params.id}/members/me`, { cache: 'no-store' }),
        ])

        if (!businessRes.ok) {
          throw new Error('Failed to fetch business')
        }

        const data = await businessRes.json()
        setBusiness(data)
        setManuals(data.manuals || [])

        // 管理者権限を確認
        if (permissionRes.ok) {
          const permissionData = await permissionRes.json()
          const adminStatus = permissionData.isSuperAdmin || permissionData.role === 'ADMIN'
          setIsAdmin(adminStatus)
        }
      } catch {
        toast.error('事業の取得に失敗しました')
        router.push('/')
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id && session) {
      fetchBusiness()
    }
  }, [params.id, router, session])

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event

      if (over && active.id !== over.id) {
        const oldIndex = manuals.findIndex((m) => m.id === active.id)
        const newIndex = manuals.findIndex((m) => m.id === over.id)

        const newManuals = arrayMove(manuals, oldIndex, newIndex)
        setManuals(newManuals)

        // サーバーに保存
        try {
          await fetch(`/api/businesses/${params.id}/manuals/reorder`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              manualIds: newManuals.map((m) => m.id),
            }),
          })
          toast.success('並び替えを保存しました')
        } catch {
          toast.error('並び替えの保存に失敗しました')
          // 失敗時は元に戻す
          setManuals(manuals)
        }
      }
    },
    [manuals, params.id]
  )

  // ジャンルの一覧を取得（重複排除）
  const availableGenres = useMemo(() => {
    const genres = manuals
      .map((m) => m.genre)
      .filter((g): g is string => Boolean(g))
    return [...new Set(genres)].sort()
  }, [manuals])

  // ジャンルでフィルタリングされたマニュアル
  const filteredManuals = useMemo(() => {
    if (selectedGenre === 'all') return manuals
    return manuals.filter((m) => m.genre === selectedGenre)
  }, [manuals, selectedGenre])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!business) {
    return null
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* ヘッダー */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground mb-1">
              {business.displayNameLine1}
            </p>
            <h1 className="text-2xl md:text-3xl font-bold truncate">
              {business.displayNameLine2}
            </h1>
          </div>
          <div className="flex items-center justify-between gap-2">
            {availableGenres.length > 0 && (
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger className="w-[120px] sm:w-[140px] h-8">
                    <SelectValue placeholder="絞り込み" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    {availableGenres.map((genre) => (
                      <SelectItem key={genre} value={genre}>
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {isAdmin && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => router.push(`/business/${business.id}/archived`)}
                  title="アーカイブ"
                >
                  <Archive className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  className="gap-1"
                  onClick={() => router.push(`/manual/new?businessId=${business.id}`)}
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">新規マニュアル</span>
                  <span className="sm:hidden">新規</span>
                </Button>
              </div>
            )}
          </div>
        </div>
        {isAdmin && manuals.length > 1 && (
          <p className="text-sm text-muted-foreground">
            ドラッグ&ドロップでマニュアルの順番を変更できます
          </p>
        )}
      </div>

      {/* マニュアル一覧 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={filteredManuals.map((m) => m.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredManuals.map((manual) => (
              <DraggableManualCard
                key={manual.id}
                manual={manual}
                isAdmin={isAdmin}
                onClick={() => router.push(`/manual/${manual.id}`)}
              />
            ))}

            {filteredManuals.length === 0 && manuals.length > 0 && (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="p-4 rounded-full bg-muted mb-4">
                    <Filter className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">該当するマニュアルがありません</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    ジャンル「{selectedGenre}」のマニュアルは見つかりませんでした
                  </p>
                  <Button variant="outline" onClick={() => setSelectedGenre('all')}>
                    すべて表示
                  </Button>
                </CardContent>
              </Card>
            )}

            {manuals.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="p-4 rounded-full bg-muted mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">マニュアルがありません</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    最初のマニュアルを作成しましょう
                  </p>
                  {isAdmin && (
                    <Button onClick={() => router.push(`/manual/new?businessId=${business.id}`)}>
                      <Plus className="h-4 w-4 mr-2" />
                      マニュアルを作成
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
