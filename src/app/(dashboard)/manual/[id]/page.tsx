'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Clock, User, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BlockItem } from '@/components/manual/BlockItem'
import { PdfExportButton } from '@/components/manual/PdfExportButton'
import { WorkSessionBanner } from '@/components/manual/WorkSessionBanner'
import { WorkCompleteSection } from '@/components/manual/WorkCompleteSection'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useNavigationStore } from '@/stores/useNavigationStore'
import { useBusinessStore } from '@/stores/useBusinessStore'
import type { ManualWithBlocks } from '@/types'

interface NotePhoto {
  id: string
  imageData: string
  createdAt: string
}

interface WorkSessionNote {
  id: string
  blockId: string
  content: string
  photos?: NotePhoto[]
  block: {
    id: string
    sortOrder: number
  }
}

interface PhotoRecord {
  id: string
  blockId: string
  createdAt: string
}

interface WorkSession {
  id: string
  status: 'IN_PROGRESS' | 'COMPLETED'
  startedAt: string
  completedAt: string | null
  notes: WorkSessionNote[]
  photoRecords: PhotoRecord[]
}

export default function ManualViewPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setCurrentManual, clearNavigation } = useNavigationStore()
  const { selectBusinessById } = useBusinessStore()
  const [manual, setManual] = useState<ManualWithBlocks | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [permission, setPermission] = useState<string>('none')
  const [workSession, setWorkSession] = useState<WorkSession | null>(null)
  const lastScrolledBlockIdRef = useRef<string | null>(null)

  const fetchWorkSession = useCallback(async () => {
    if (!params.id) return
    try {
      const response = await fetch(`/api/manuals/${params.id}/work-sessions/current`)
      if (response.ok) {
        const data = await response.json()
        setWorkSession(data)
      }
    } catch {
      // 作業セッション取得失敗は無視
    }
  }, [params.id])

  useEffect(() => {
    async function fetchManual() {
      try {
        const response = await fetch(`/api/manuals/${params.id}`)
        if (!response.ok) {
          if (response.status === 404) {
            setError('マニュアルが見つかりません')
          } else if (response.status === 403) {
            setError('このマニュアルへのアクセス権がありません')
          } else {
            setError('マニュアルの取得に失敗しました')
          }
          return
        }
        const data = await response.json()
        setManual(data)
        setPermission(data._permission || 'none')

        // マニュアルが属する事業を選択
        if (data.business?.id) {
          selectBusinessById(data.business.id)
        }

        // ナビゲーション情報を設定
        setCurrentManual({ id: data.id, title: data.title })

        // 作業セッションを取得
        fetchWorkSession()
      } catch {
        setError('マニュアルの取得に失敗しました')
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchManual()
    }

    // クリーンアップ時にナビゲーションをクリア
    return () => {
      clearNavigation()
    }
  }, [params.id, setCurrentManual, clearNavigation, selectBusinessById, fetchWorkSession])

  // blockIdがある場合、該当ブロックにスクロール
  useEffect(() => {
    const blockId = searchParams.get('blockId')
    if (!blockId || !manual) return

    // 同じブロックに既にスクロール済みの場合はスキップ
    if (lastScrolledBlockIdRef.current === blockId) return

    // 少し遅延を入れてDOMが確実に描画されてからスクロール
    const timer = setTimeout(() => {
      const blockElement = document.getElementById(`block-${blockId}`)
      if (blockElement) {
        blockElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        // ハイライト効果を追加
        blockElement.classList.add('ring-2', 'ring-primary', 'ring-offset-2')
        setTimeout(() => {
          blockElement.classList.remove('ring-2', 'ring-primary', 'ring-offset-2')
        }, 2000)
        lastScrolledBlockIdRef.current = blockId

        // スクロール後にURLからblockIdを削除（履歴を置き換え）
        router.replace(`/manual/${params.id}`, { scroll: false })
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [searchParams, manual, router, params.id])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (error || !manual) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <p className="text-destructive mb-4">{error}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          戻る
        </Button>
      </div>
    )
  }

  const canEdit = permission === 'admin' || permission === 'superadmin'

  // ブロックごとの作業セッションメモを取得するヘルパー
  const getWorkSessionNoteForBlock = (blockId: string) => {
    if (!workSession) return undefined
    return workSession.notes.find(note => note.blockId === blockId)
  }

  return (
    <div className="h-full flex flex-col">
      {/* ヘッダー */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-4 md:px-6 lg:px-8 py-4 md:py-5">
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">戻る</span>
            </Button>
            <div className="flex items-center gap-2">
              <PdfExportButton
                title={manual.title}
                description={manual.description}
                businessName={`${manual.business.displayNameLine1} ${manual.business.displayNameLine2}`}
                blocks={manual.blocks.map(b => ({
                  type: b.type,
                  content: b.content as { text?: string; title?: string; items?: Array<string | { text: string }>; alt?: string; url?: string },
                  sortOrder: b.sortOrder,
                }))}
                version={manual.version}
                updatedAt={manual.updatedAt.toString()}
              />
              {canEdit && (
                <Link href={`/manual/${manual.id}/edit`}>
                  <Button size="sm" className="gap-2">
                    <Edit className="h-4 w-4" />
                    <span className="hidden sm:inline">編集</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold">{manual.title}</h1>
            {manual.status === 'DRAFT' && (
              <Badge variant="secondary">
                非公開
              </Badge>
            )}
            {canEdit && manual.adminOnly && (
              <Badge variant="outline" className="gap-1">
                <Shield className="h-3 w-3" />
                管理者限定
              </Badge>
            )}
          </div>
          {manual.description && (
            <p className="text-muted-foreground max-w-2xl">{manual.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {manual.updater.name}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {new Date(manual.updatedAt).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <span className="text-muted-foreground/60">
              {manual.blocks.length} ステップ
            </span>
          </div>
        </div>
      </div>

      {/* コンテンツ */}
      <ScrollArea className="flex-1">
        {/* 作業セッションバナー */}
        <WorkSessionBanner
          manualId={params.id as string}
          manualTitle={manual.title}
          workSession={workSession}
          onSessionChange={fetchWorkSession}
        />
        <div className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto">
          {manual.blocks.length > 0 ? (
            <div className="space-y-4 md:space-y-6">
              {manual.blocks.map((block, index) => (
                <BlockItem
                  key={block.id}
                  block={block}
                  index={index}
                  workSessionId={workSession?.id}
                  workSessionNote={getWorkSessionNoteForBlock(block.id)}
                  isWorkSessionActive={workSession?.status === 'IN_PROGRESS'}
                />
              ))}
              {/* 作業中の場合は作業完了ボタン、そうでなければ完了メッセージ */}
              {workSession?.status === 'IN_PROGRESS' ? (
                <WorkCompleteSection
                  workSessionId={workSession.id}
                  manualTitle={manual.title}
                  photoBlocks={manual.blocks
                    .filter((block) => block.type === 'PHOTO_RECORD')
                    .map((block) => ({
                      id: block.id,
                      sortOrder: block.sortOrder,
                      content: block.content as { title?: string },
                    }))}
                  capturedPhotos={workSession.photoRecords.map((photo) => ({
                    blockId: photo.blockId,
                  }))}
                  onComplete={fetchWorkSession}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground border-t mt-8">
                  <p className="text-sm">本マニュアルのステップは以上です</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 rounded-full bg-muted mb-4">
                <ArrowLeft className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-1">ステップがありません</h3>
              <p className="text-sm text-muted-foreground mb-4">
                このマニュアルにはまだステップが登録されていません
              </p>
              {canEdit && (
                <Link href={`/manual/${manual.id}/edit`}>
                  <Button>
                    ステップを追加する
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
