'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Search, FileText, AlertTriangle, CheckCircle, X, Loader2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useBusinessStore } from '@/stores/useBusinessStore'
import { useSearchStore } from '@/stores/useSearchStore'
import { cn } from '@/lib/utils'

interface SearchResult {
  manuals: {
    id: string
    title: string
    description: string | null
    status: string
    business: {
      id: string
      displayNameLine1: string
      displayNameLine2: string
    }
    blockCount: number
  }[]
  blocks: {
    id: string
    type: string
    excerpt: string
    manual: {
      id: string
      title: string
      business: {
        id: string
        displayNameLine1: string
        displayNameLine2: string
      }
    }
  }[]
}

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  hasThemeColor?: boolean
}

export function SearchDialog({ open, onOpenChange }: Omit<SearchDialogProps, 'hasThemeColor'>) {
  const router = useRouter()
  const { data: session } = useSession()
  const { selectedBusiness } = useBusinessStore()
  const { recentSearches, addSearch, removeSearch, clearSearches } = useSearchStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchInCurrentBusiness, setSearchInCurrentBusiness] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')

  const isAdmin = session?.user?.isSuperAdmin

  const search = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults(null)
      return
    }

    setIsLoading(true)
    try {
      const params = new URLSearchParams({ q: searchQuery })
      if (searchInCurrentBusiness && selectedBusiness) {
        params.append('businessId', selectedBusiness.id)
      }
      if (statusFilter && isAdmin) {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/search?${params}`)
      if (response.ok) {
        const data = await response.json()
        setResults(data)
        addSearch(searchQuery) // 検索履歴に追加
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [searchInCurrentBusiness, selectedBusiness, statusFilter, isAdmin, addSearch])

  // 検索キーワードをハイライト
  const highlightText = useCallback((text: string, keyword: string) => {
    if (!keyword || keyword.length < 2) return text
    const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }, [])

  // デバウンス検索
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        search(query)
      } else {
        setResults(null)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, search, statusFilter])

  // ダイアログを閉じる時にリセット
  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults(null)
    }
  }, [open])

  const handleNavigate = (path: string) => {
    onOpenChange(false)
    router.push(path)
  }

  const getBlockIcon = (type: string) => {
    switch (type) {
      case 'TEXT':
        return <FileText className="h-4 w-4" />
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'CHECKPOINT':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const totalResults = results ? results.manuals.length + results.blocks.length : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            マニュアル検索
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 検索入力 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="キーワードを入力（2文字以上）"
              className="pl-10 pr-10"
              autoFocus
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* フィルター */}
          <div className="flex flex-wrap gap-2">
            {/* 検索範囲の切り替え */}
            {selectedBusiness && (
              <>
                <Button
                  variant={searchInCurrentBusiness ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSearchInCurrentBusiness(true)}
                >
                  {selectedBusiness.displayNameLine2}内
                </Button>
                <Button
                  variant={!searchInCurrentBusiness ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSearchInCurrentBusiness(false)}
                >
                  すべての事業
                </Button>
              </>
            )}
            {/* ステータスフィルター（管理者のみ） */}
            {isAdmin && (
              <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-[160px] h-8">
                  <SelectValue placeholder="ステータス" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLISHED">公開のみ</SelectItem>
                  <SelectItem value="all">非公開を含む全て</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* 最近の検索 */}
          {!query && recentSearches.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  最近の検索
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-muted-foreground"
                  onClick={clearSearches}
                >
                  クリア
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.slice(0, 5).map((item) => (
                  <div key={item.query} className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setQuery(item.query)}
                    >
                      {item.query}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeSearch(item.query)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 検索結果 */}
          <ScrollArea className="flex-1 max-h-[50vh]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : query.length < 2 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>検索キーワードを入力してください</p>
              </div>
            ) : results && totalResults === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>「{query}」に一致する結果がありません</p>
              </div>
            ) : results ? (
              <div className="space-y-4">
                {/* マニュアル結果 */}
                {results.manuals.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      マニュアル ({results.manuals.length}件)
                    </h3>
                    <div className="space-y-2">
                      {results.manuals.map((manual) => (
                        <button
                          key={manual.id}
                          onClick={() => handleNavigate(`/manual/${manual.id}`)}
                          className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <FileText className="h-4 w-4 flex-shrink-0" />
                                <span className="font-medium truncate">{highlightText(manual.title, query)}</span>
                                {manual.status === 'DRAFT' && (
                                  <Badge variant="secondary" className="text-xs">非公開</Badge>
                                )}
                              </div>
                              {manual.description && (
                                <p className="text-sm text-muted-foreground truncate">
                                  {highlightText(manual.description, query)}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <span>{manual.business.displayNameLine2}</span>
                                <span className="ml-auto">{manual.blockCount}ステップ</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ブロック結果 */}
                {results.blocks.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      ステップ内容 ({results.blocks.length}件)
                    </h3>
                    <div className="space-y-2">
                      {results.blocks.map((block) => (
                        <button
                          key={block.id}
                          onClick={() => handleNavigate(`/manual/${block.manual.id}?blockId=${block.id}`)}
                          className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
                        >
                          <div className="flex items-start gap-2">
                            {getBlockIcon(block.type)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm">{highlightText(block.excerpt, query)}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <span>{block.manual.business.displayNameLine2}</span>
                                <span>/</span>
                                <span>{block.manual.title}</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface SearchButtonProps {
  hasThemeColor?: boolean
}

export function SearchButton({ hasThemeColor }: SearchButtonProps) {
  const [open, setOpen] = useState(false)

  // キーボードショートカット (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className={cn(hasThemeColor && 'text-white hover:bg-white/20')}
      >
        <Search className="h-5 w-5" />
        <span className="sr-only">検索</span>
      </Button>
      <SearchDialog open={open} onOpenChange={setOpen} hasThemeColor={hasThemeColor} />
    </>
  )
}
