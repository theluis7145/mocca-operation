'use client'

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
  showPageNumbers?: boolean
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  showPageNumbers = true,
}: PaginationProps) {
  if (totalPages <= 1) return null

  // 表示するページ番号を計算
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const showEllipsis = totalPages > 7

    if (!showEllipsis) {
      // 7ページ以下の場合はすべて表示
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // 常に最初のページを表示
      pages.push(1)

      if (currentPage > 3) {
        pages.push('ellipsis')
      }

      // 現在のページの前後を表示
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis')
      }

      // 常に最後のページを表示
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <nav className={cn('flex items-center justify-center gap-1', className)}>
      {/* 前へ */}
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">前のページ</span>
      </Button>

      {/* ページ番号 */}
      {showPageNumbers && (
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) =>
            page === 'ellipsis' ? (
              <span
                key={`ellipsis-${index}`}
                className="flex h-8 w-8 items-center justify-center"
              >
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </span>
            ) : (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            )
          )}
        </div>
      )}

      {/* 次へ */}
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">次のページ</span>
      </Button>
    </nav>
  )
}

// ページネーション情報を計算するヘルパー
export function getPaginationInfo(
  totalItems: number,
  itemsPerPage: number,
  currentPage: number
) {
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)

  return {
    totalPages,
    startIndex,
    endIndex,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  }
}
