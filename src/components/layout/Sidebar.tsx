'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileText, Home, Shield, PlayCircle } from 'lucide-react'
import { useBusinessStore } from '@/stores/useBusinessStore'
import { useUserStore } from '@/stores/useUserStore'
import { useNavigationStore } from '@/stores/useNavigationStore'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { Manual } from '@prisma/client'

// サイドバーで使用するマニュアルの軽量型
type ManualSummary = Pick<Manual, 'id' | 'title' | 'status' | 'adminOnly'>

interface ActiveWorkSession {
  id: string
  startedAt: string
  manual: {
    id: string
    title: string
    businessId: string
    business: {
      id: string
      name: string
      displayNameLine1: string
      displayNameLine2: string
    }
  }
}

interface SidebarProps {
  manuals?: ManualSummary[]
  activeWorkSessions?: ActiveWorkSession[]
}

export function Sidebar({ manuals = [], activeWorkSessions = [] }: SidebarProps) {
  const router = useRouter()
  const { selectedBusiness, selectBusinessById } = useBusinessStore()
  const { sidebarOpen } = useUserStore()
  const { currentManual } = useNavigationStore()

  if (!sidebarOpen) {
    return null
  }

  const handleWorkSessionClick = (session: ActiveWorkSession) => {
    // 事業を選択してからマニュアルに遷移
    selectBusinessById(session.manual.businessId)
    router.push(`/manual/${session.manual.id}`)
  }

  return (
    <aside className="w-64 border-r bg-sidebar flex flex-col h-[calc(100vh-3.5rem)] sticky top-14">
      {/* 作業中セッション */}
      {activeWorkSessions.length > 0 && (
        <div className="px-3 pt-4 pb-2 border-b">
          <div className="flex items-center gap-2 px-2 mb-2">
            <PlayCircle className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-green-700">作業中</span>
          </div>
          <div className="space-y-1">
            {activeWorkSessions.map((session) => (
              <button
                key={session.id}
                className="w-full flex flex-col items-start gap-0.5 px-2 py-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors text-left"
                onClick={() => handleWorkSessionClick(session)}
              >
                <span className="text-sm font-medium text-green-700 dark:text-green-400 truncate w-full">
                  {session.manual.title}
                </span>
                <span className="text-[10px] text-muted-foreground truncate w-full">
                  {session.manual.business.displayNameLine1} {session.manual.business.displayNameLine2}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* トップに戻る */}
      {selectedBusiness && (
        <div className="px-3 pt-4 pb-2 border-b">
          <button
            className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-colors text-primary font-medium text-sm"
            onClick={() => router.push(`/business/${selectedBusiness.id}`)}
          >
            <Home className="h-4 w-4" />
            <span>トップに戻る</span>
          </button>
        </div>
      )}

      <ScrollArea className="flex-1 px-3 py-4">
        {/* マニュアル一覧 */}
        <nav className="space-y-1">
          {manuals.map((manual) => {
            const isCurrentManual = currentManual?.id === manual.id
            const isDraft = manual.status === 'DRAFT'
            const isAdminOnly = manual.adminOnly

            return (
              <Link
                key={manual.id}
                href={`/manual/${manual.id}`}
                className={cn(
                  'flex items-center gap-2 px-2 py-2 rounded-lg',
                  'text-sm text-sidebar-foreground',
                  'hover:bg-sidebar-accent transition-colors',
                  isCurrentManual && 'bg-primary/15 text-primary font-medium',
                  isDraft && 'opacity-70'
                )}
              >
                <FileText className={cn(
                  'h-4 w-4 flex-shrink-0',
                  isCurrentManual && 'text-primary',
                  isDraft && 'text-muted-foreground'
                )} />
                <span className="truncate flex-1">{manual.title}</span>
                {isAdminOnly && (
                  <Shield className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                )}
                {isDraft && (
                  <span className="text-[10px] px-1 py-0.5 rounded bg-muted text-muted-foreground">
                    非公開
                  </span>
                )}
              </Link>
            )
          })}

          {manuals.length === 0 && (
            <p className="px-2 py-4 text-sm text-muted-foreground text-center">
              マニュアルがありません
            </p>
          )}
        </nav>
      </ScrollArea>

    </aside>
  )
}
