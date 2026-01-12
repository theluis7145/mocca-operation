'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Check } from 'lucide-react'
import { useBusinessStore, type BusinessWithManuals } from '@/stores/useBusinessStore'
import { cn } from '@/lib/utils'

interface BusinessSwitcherProps {
  hasThemeColor?: boolean
}

export function BusinessSwitcher({ hasThemeColor = false }: BusinessSwitcherProps) {
  const router = useRouter()
  const { selectedBusiness, businesses, setSelectedBusiness } = useBusinessStore()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // クリック外を検知して閉じる
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // ESCキーで閉じる
  useEffect(() => {
    function handleEscKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey)
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [isOpen])

  const handleSelectBusiness = (business: BusinessWithManuals) => {
    if (business.id === selectedBusiness?.id) {
      // 同じ事業をクリックした場合は閉じるだけ
      setIsOpen(false)
      return
    }
    setSelectedBusiness(business)
    setIsOpen(false)
    // 事業を切り替えた時、ダッシュボードに遷移してコンテンツを更新
    router.push('/')
  }

  if (!selectedBusiness) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-muted-foreground">
        <span className="text-sm">事業を選択してください</span>
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* トリガーボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-ring',
          hasThemeColor
            ? 'hover:bg-white/20 text-white'
            : 'hover:bg-accent',
          isOpen && (hasThemeColor ? 'bg-white/20' : 'bg-accent')
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="text-left leading-tight">
          <div className="text-sm font-medium">{selectedBusiness.displayNameLine1}</div>
          <div className="text-base font-bold">{selectedBusiness.displayNameLine2}</div>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform',
            hasThemeColor ? 'text-white/70' : 'text-muted-foreground',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ドロップダウン */}
      {isOpen && (
        <div
          className={cn(
            'absolute top-full left-0 mt-1 z-50',
            'min-w-[180px] max-w-[calc(100vw-32px)] bg-popover text-popover-foreground border rounded-lg shadow-lg',
            'animate-in fade-in-0 zoom-in-95'
          )}
          role="listbox"
          aria-label="事業を選択"
        >
          {businesses.map((business) => {
            const isSelected = business.id === selectedBusiness.id
            return (
              <button
                key={business.id}
                onClick={() => handleSelectBusiness(business)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-3 text-left text-foreground',
                  'hover:bg-accent transition-colors',
                  'first:rounded-t-lg last:rounded-b-lg',
                  isSelected && 'bg-accent'
                )}
                role="option"
                aria-selected={isSelected}
              >
                <div className="flex-1 leading-tight">
                  <div className="text-sm">{business.displayNameLine1}</div>
                  <div className="text-base font-medium">{business.displayNameLine2}</div>
                </div>
                {isSelected && <Check className="h-4 w-4 text-primary" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
