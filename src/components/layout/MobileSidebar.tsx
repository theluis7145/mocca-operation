'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileText, Home, Shield, PlayCircle } from 'lucide-react'
import { useBusinessStore } from '@/stores/useBusinessStore'
import { useUserStore } from '@/stores/useUserStore'
import { useNavigationStore } from '@/stores/useNavigationStore'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
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

interface MobileSidebarProps {
  manuals?: ManualSummary[]
  activeWorkSessions?: ActiveWorkSession[]
}

export function MobileSidebar({ manuals = [], activeWorkSessions = [] }: MobileSidebarProps) {
  const router = useRouter()
  const { selectedBusiness, selectBusinessById } = useBusinessStore()
  const { mobileSidebarOpen, setMobileSidebarOpen } = useUserStore()
  const { currentManual } = useNavigationStore()

  const handleLinkClick = () => {
    setMobileSidebarOpen(false)
  }

  const handleWorkSessionClick = (session: ActiveWorkSession) => {
    setMobileSidebarOpen(false)
    selectBusinessById(session.manual.businessId)
    router.push(`/manual/${session.manual.id}`)
  }

  return (
    <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
      <SheetContent side="left" className="w-[85vw] max-w-80 p-0">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="text-left leading-tight">
            <div className="text-sm font-medium">{selectedBusiness?.displayNameLine1 || 'メニュー'}</div>
            {selectedBusiness?.displayNameLine2 && (
              <div className="text-base font-bold">{selectedBusiness.displayNameLine2}</div>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* 作業中セッション */}
        {activeWorkSessions.length > 0 && (
          <div className="px-4 py-3 border-b bg-green-50/50 dark:bg-green-950/20">
            <div className="flex items-center gap-2 px-3 mb-2">
              <PlayCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">作業中</span>
            </div>
            <div className="space-y-1">
              {activeWorkSessions.map((session) => (
                <button
                  key={session.id}
                  className="w-full flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-950/50 transition-colors text-left"
                  onClick={() => handleWorkSessionClick(session)}
                >
                  <span className="text-base font-medium text-green-700 dark:text-green-400 break-words w-full">
                    {session.manual.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {session.manual.business.displayNameLine1} {session.manual.business.displayNameLine2}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* トップに戻る */}
        {selectedBusiness && (
          <div className="px-4 py-3 border-b">
            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-primary font-medium"
              onClick={() => {
                setMobileSidebarOpen(false)
                router.push(`/business/${selectedBusiness.id}`)
              }}
            >
              <Home className="h-5 w-5" />
              <span>トップに戻る</span>
            </button>
          </div>
        )}

        <ScrollArea className="flex-1 h-[calc(100vh-10rem)]">
          <nav className="space-y-1 p-4">
            {manuals.map((manual) => {
              const isCurrentManual = currentManual?.id === manual.id
              const isDraft = manual.status === 'DRAFT'
              const isAdminOnly = manual.adminOnly

              return (
                <Link
                  key={manual.id}
                  href={`/manual/${manual.id}`}
                  onClick={handleLinkClick}
                  className={cn(
                    'flex items-start gap-2 px-3 py-2.5 rounded-lg',
                    'text-base',
                    'hover:bg-accent transition-colors',
                    'active:bg-accent/80',
                    isCurrentManual && 'bg-primary/15 text-primary font-medium',
                    isDraft && 'opacity-70'
                  )}
                >
                  <FileText className={cn(
                    'h-5 w-5 flex-shrink-0 mt-0.5',
                    isCurrentManual && 'text-primary',
                    isDraft && 'text-muted-foreground'
                  )} />
                  <span className="flex-1 break-words">{manual.title}</span>
                  <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                    {isAdminOnly && (
                      <Shield className="h-4 w-4 text-muted-foreground" />
                    )}
                    {isDraft && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground whitespace-nowrap">
                        非公開
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}

            {manuals.length === 0 && (
              <p className="px-3 py-8 text-base text-muted-foreground text-center">
                マニュアルがありません
              </p>
            )}
          </nav>
        </ScrollArea>

      </SheetContent>
    </Sheet>
  )
}
