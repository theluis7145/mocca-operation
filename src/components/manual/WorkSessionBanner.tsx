'use client'

import { useState } from 'react'
import { Play, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface WorkSession {
  id: string
  status: 'IN_PROGRESS' | 'COMPLETED'
  startedAt: string
  completedAt: string | null
}

interface WorkSessionBannerProps {
  manualId: string
  manualTitle: string
  workSession: WorkSession | null
  onSessionChange: () => void
}

export function WorkSessionBanner({
  manualId,
  workSession,
  onSessionChange,
}: WorkSessionBannerProps) {
  const [isStarting, setIsStarting] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  const handleStartSession = async () => {
    setIsStarting(true)
    try {
      const response = await fetch(`/api/manuals/${manualId}/work-sessions`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '作業開始に失敗しました')
      }

      toast.success('作業を開始しました', {
        description: '各ステップで申し送りメモを記入できます',
      })
      onSessionChange()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '作業開始に失敗しました')
    } finally {
      setIsStarting(false)
    }
  }

  const handleCancelSession = async () => {
    if (!workSession) return

    setIsCancelling(true)
    try {
      const response = await fetch(`/api/work-sessions/${workSession.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '作業キャンセルに失敗しました')
      }

      toast.success('作業をキャンセルしました')
      setShowCancelDialog(false)
      onSessionChange()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '作業キャンセルに失敗しました')
    } finally {
      setIsCancelling(false)
    }
  }

  // 作業中でない場合
  if (!workSession) {
    return (
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 shadow-md">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Play className="h-5 w-5" />
            <span className="font-medium">作業を開始して申し送りメモを記録できます</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleStartSession}
            disabled={isStarting}
          >
            {isStarting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                開始中...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                作業開始
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // 作業中の場合
  return (
    <>
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 shadow-md">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Play className="h-5 w-5" />
            <span className="font-medium">作業中</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
            onClick={() => setShowCancelDialog(true)}
          >
            <XCircle className="h-4 w-4 mr-2" />
            キャンセル
          </Button>
        </div>
      </div>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>作業をキャンセルしますか？</AlertDialogTitle>
            <AlertDialogDescription>
              作業をキャンセルすると、入力した申し送りメモはすべて削除されます。
              この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>戻る</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSession}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  キャンセル中...
                </>
              ) : (
                'キャンセルする'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
