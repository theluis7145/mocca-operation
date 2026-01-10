import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SearchHistoryItem {
  query: string
  timestamp: number
}

interface SearchState {
  recentSearches: SearchHistoryItem[]
  addSearch: (query: string) => void
  removeSearch: (query: string) => void
  clearSearches: () => void
}

const MAX_RECENT_SEARCHES = 10

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      recentSearches: [],

      addSearch: (query: string) => {
        const { recentSearches } = get()
        const trimmedQuery = query.trim()
        if (!trimmedQuery || trimmedQuery.length < 2) return

        // 既存の同じ検索を削除
        const filtered = recentSearches.filter(
          (item) => item.query.toLowerCase() !== trimmedQuery.toLowerCase()
        )

        // 新しい検索を先頭に追加
        const newSearches = [
          { query: trimmedQuery, timestamp: Date.now() },
          ...filtered,
        ].slice(0, MAX_RECENT_SEARCHES)

        set({ recentSearches: newSearches })
      },

      removeSearch: (query: string) => {
        const { recentSearches } = get()
        set({
          recentSearches: recentSearches.filter(
            (item) => item.query.toLowerCase() !== query.toLowerCase()
          ),
        })
      },

      clearSearches: () => {
        set({ recentSearches: [] })
      },
    }),
    {
      name: 'mocca-search-store',
    }
  )
)
