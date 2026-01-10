'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Archive, ArchiveRestore, Trash2, FileText } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useBusinessStore } from '@/stores/useBusinessStore'

interface ArchivedManual {
  id: string
  title: string
  description: string | null
  status: string
  adminOnly: boolean
  archivedAt: string
  updatedAt: string
}

export default function ArchivedManualsPage() {
  const params = useParams()
  const router = useRouter()
  const { selectedBusiness, selectBusinessById } = useBusinessStore()
  const [manuals, setManuals] = useState<ArchivedManual[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      selectBusinessById(params.id as string)
    }
  }, [params.id, selectBusinessById])

  useEffect(() => {
    async function fetchArchivedManuals() {
      try {
        const response = await fetch(`/api/businesses/${params.id}/manuals/archived`)
        if (!response.ok) {
          if (response.status === 403) {
            toast.error('アーカイブを閲覧する権限がありません')
            router.push(`/business/${params.id}`)
            return
          }
          throw new Error('Failed to fetch')
        }
        const data = await response.json()
        setManuals(data)
      } catch {
        toast.error('アーカイブの取得に失敗しました')
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchArchivedManuals()
    }
  }, [params.id, router])

  const handleRestore = async (manualId: string) => {
    if (!confirm('このマニュアルを復元しますか？')) return

    try {
      const response = await fetch(`/api/manuals/${manualId}/archive`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to restore')
      }

      setManuals(manuals.filter(m => m.id !== manualId))
      toast.success('マニュアルを復元しました')
    } catch {
      toast.error('復元に失敗しました')
    }
  }

  const handlePermanentDelete = async (manualId: string) => {
    if (!confirm('このマニュアルを完全に削除しますか？\n\n⚠️ この操作は取り消せません。マニュアルに関連するすべてのデータが削除されます。')) return

    try {
      const response = await fetch(`/api/manuals/${manualId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete')
      }

      setManuals(manuals.filter(m => m.id !== manualId))
      toast.success('マニュアルを完全に削除しました')
    } catch {
      toast.error('削除に失敗しました')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* ヘッダー */}
      <div className="mb-6 md:mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/business/${params.id}`)}
          className="gap-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          戻る
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <Archive className="h-7 w-7" />
          アーカイブ
        </h1>
        <p className="text-muted-foreground mt-1">
          {selectedBusiness?.displayNameLine1} {selectedBusiness?.displayNameLine2}
        </p>
      </div>

      {/* アーカイブ済みマニュアル一覧 */}
      {manuals.length > 0 ? (
        <div className="space-y-4">
          {manuals.map((manual) => (
            <Card key={manual.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-lg bg-muted flex-shrink-0">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base font-semibold line-clamp-2">
                        {manual.title}
                      </CardTitle>
                      {manual.description && (
                        <CardDescription className="mt-1 text-sm line-clamp-2">
                          {manual.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {manual.status === 'DRAFT' && (
                      <Badge variant="secondary" className="text-xs">非公開</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    アーカイブ日: {new Date(manual.archivedAt).toLocaleDateString('ja-JP')}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(manual.id)}
                      className="gap-2"
                    >
                      <ArchiveRestore className="h-4 w-4" />
                      復元
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePermanentDelete(manual.id)}
                      className="gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      完全に削除
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            アーカイブされたマニュアルはありません
          </p>
        </Card>
      )}
    </div>
  )
}
