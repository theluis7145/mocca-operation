'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
import { Building2, FileText, ChevronRight, Plus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useBusinessStore } from '@/stores/useBusinessStore'
import { DraggableManualCard } from '@/components/manual/DraggableManualCard'
import type { Manual } from '@prisma/client'

type ManualSummary = Pick<Manual, 'id' | 'title' | 'status' | 'description' | 'updatedAt' | 'adminOnly'>

export default function DashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { selectedBusiness, businesses, isLoading, setSelectedBusiness } = useBusinessStore()
  const [manuals, setManuals] = useState<ManualSummary[]>([])
  const [isAdmin, setIsAdmin] = useState(false)

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

  // マニュアルリストと管理者権限を設定
  useEffect(() => {
    if (selectedBusiness) {
      setManuals(selectedBusiness.manuals || [])

      // 管理者権限を確認
      const checkPermission = async () => {
        try {
          const res = await fetch(`/api/businesses/${selectedBusiness.id}/members/me`)
          if (res.ok) {
            const data = await res.json()
            setIsAdmin(data.isSuperAdmin || data.role === 'ADMIN')
          }
        } catch {
          setIsAdmin(false)
        }
      }
      checkPermission()
    }
  }, [selectedBusiness])

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      if (!selectedBusiness) return

      const { active, over } = event

      if (over && active.id !== over.id) {
        const oldIndex = manuals.findIndex((m) => m.id === active.id)
        const newIndex = manuals.findIndex((m) => m.id === over.id)

        const newManuals = arrayMove(manuals, oldIndex, newIndex)
        setManuals(newManuals)

        // サーバーに保存
        try {
          const res = await fetch(`/api/businesses/${selectedBusiness.id}/manuals/reorder`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              manualIds: newManuals.map((m) => m.id),
            }),
          })

          if (res.ok) {
            toast.success('並び替えを保存しました')
            // ストアも更新
            setSelectedBusiness({
              ...selectedBusiness,
              manuals: newManuals,
            })
          } else {
            throw new Error('Failed to save')
          }
        } catch {
          toast.error('並び替えの保存に失敗しました')
          // 失敗時は元に戻す
          setManuals(selectedBusiness.manuals || [])
        }
      }
    },
    [manuals, selectedBusiness, setSelectedBusiness]
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (businesses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 md:p-8">
        <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">事業が登録されていません</h2>
        <p className="text-muted-foreground text-center mb-4">
          アクセスできる事業がありません。
          <br />
          管理者にお問い合わせください。
        </p>
        {session?.user?.isSuperAdmin && (
          <Link href="/admin/businesses">
            <Button>事業を登録する</Button>
          </Link>
        )}
      </div>
    )
  }

  if (!selectedBusiness) {
    return (
      <div className="p-4 md:p-8">
        <h1 className="text-xl md:text-2xl font-bold mb-6">事業を選択してください</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {businesses.map((business) => (
            <Card
              key={business.id}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => useBusinessStore.getState().setSelectedBusiness(business)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  <div>
                    <div className="text-sm font-normal text-muted-foreground">
                      {business.displayNameLine1}
                    </div>
                    <div>{business.displayNameLine2}</div>
                  </div>
                </CardTitle>
                {business.description && (
                  <CardDescription>{business.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{business.manuals?.length || 0} マニュアル</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8" data-testid="dashboard-page">
      {/* ウェルカムメッセージ */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold" data-testid="dashboard-title">
          {selectedBusiness.displayNameLine1} {selectedBusiness.displayNameLine2}
        </h1>
        <p className="text-muted-foreground mt-1" data-testid="welcome-message">
          ようこそ、{session?.user?.name}さん
        </p>
      </div>

      {/* 統計カード */}
      <div className="flex gap-3 mb-6">
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">マニュアル</span>
          <span className="text-sm font-semibold">{manuals.length}</span>
        </div>
      </div>

      {/* マニュアル一覧 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">マニュアル一覧</h2>
          <div className="flex items-center gap-3">
            {isAdmin && manuals.length > 1 && (
              <p className="text-sm text-muted-foreground hidden sm:block">
                ドラッグ&ドロップで並び替え
              </p>
            )}
            {isAdmin && (
              <Link href={`/manual/new?businessId=${selectedBusiness.id}`}>
                <Button size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">新規マニュアル</span>
                  <span className="sm:hidden">新規</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
        {manuals.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={manuals.map((m) => m.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3" data-testid="manual-list">
                {manuals.map((manual) => (
                  <DraggableManualCard
                    key={manual.id}
                    manual={manual}
                    isAdmin={isAdmin}
                    onClick={() => router.push(`/manual/${manual.id}`)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <Card className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              マニュアルがまだ登録されていません
            </p>
            {isAdmin && (
              <Link href={`/manual/new?businessId=${selectedBusiness.id}`}>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  マニュアルを作成
                </Button>
              </Link>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
