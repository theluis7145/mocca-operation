'use client'

import { ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface WorkInstructionIconProps {
  count?: number
  hasThemeColor?: boolean
  onClick: () => void
}

export function WorkInstructionIcon({
  count = 0,
  hasThemeColor,
  onClick,
}: WorkInstructionIconProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        'relative',
        hasThemeColor && 'text-white hover:bg-white/20'
      )}
      onClick={onClick}
    >
      <ClipboardList className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
      <span className="sr-only">作業指示メモ</span>
    </Button>
  )
}
