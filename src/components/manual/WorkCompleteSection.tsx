'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WorkCompleteDialog } from './WorkCompleteDialog'

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

interface PhotoBlock {
  id: string
  sortOrder: number
  content: {
    title?: string
  }
}

interface CapturedPhoto {
  blockId: string
}

interface WorkCompleteSectionProps {
  workSessionId: string
  manualTitle: string
  photoBlocks: PhotoBlock[]
  capturedPhotos: CapturedPhoto[]
  onComplete: () => void
}

export function WorkCompleteSection({
  workSessionId,
  manualTitle,
  photoBlocks,
  capturedPhotos,
  onComplete,
}: WorkCompleteSectionProps) {
  const [isLoadingNotes, setIsLoadingNotes] = useState(false)
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [freshNotes, setFreshNotes] = useState<WorkSessionNote[]>([])

  const handleShowCompleteDialog = async () => {
    setIsLoadingNotes(true)
    try {
      const response = await fetch(`/api/work-sessions/${workSessionId}/notes`)
      if (response.ok) {
        const notes = await response.json()
        setFreshNotes(notes)
      }
    } catch {
      setFreshNotes([])
    } finally {
      setIsLoadingNotes(false)
      setShowCompleteDialog(true)
    }
  }

  return (
    <>
      <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg border border-green-200 dark:border-green-800">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
            全てのステップを確認しましたか？
          </h3>
          <p className="text-sm text-green-600 dark:text-green-400 mb-4">
            作業が完了したら、下のボタンを押して報告してください
          </p>
          <Button
            size="lg"
            onClick={handleShowCompleteDialog}
            disabled={isLoadingNotes}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isLoadingNotes ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                読込中...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 mr-2" />
                作業完了
              </>
            )}
          </Button>
        </div>
      </div>

      <WorkCompleteDialog
        isOpen={showCompleteDialog}
        onClose={() => setShowCompleteDialog(false)}
        workSessionId={workSessionId}
        manualTitle={manualTitle}
        notes={freshNotes}
        photoBlocks={photoBlocks}
        capturedPhotos={capturedPhotos}
        onComplete={onComplete}
      />
    </>
  )
}
