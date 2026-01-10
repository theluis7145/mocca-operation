import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Business, Manual } from '@prisma/client'

type ManualSummary = Pick<Manual, 'id' | 'title' | 'status' | 'description' | 'updatedAt' | 'adminOnly'>

// themeColorsはDBではstringだが、APIでパースされてstring[]として返される
export type BusinessWithManuals = Omit<Business, 'themeColors'> & {
  themeColors: string[]
  manuals?: ManualSummary[]
}

interface BusinessState {
  // 選択中の事業
  selectedBusiness: BusinessWithManuals | null
  // アクセス可能な事業一覧
  businesses: BusinessWithManuals[]
  // ローディング状態
  isLoading: boolean
  // エラー
  error: string | null
  // 永続化されたビジネスID（リロード後に使用）
  _persistedBusinessId?: string

  // Actions
  setSelectedBusiness: (business: BusinessWithManuals | null) => void
  setBusinesses: (businesses: BusinessWithManuals[]) => void
  setIsLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void

  // 事業IDで選択
  selectBusinessById: (businessId: string) => void
}

export const useBusinessStore = create<BusinessState>()(
  persist(
    (set, get) => ({
      selectedBusiness: null,
      businesses: [],
      isLoading: false,
      error: null,

      setSelectedBusiness: (business) => set({ selectedBusiness: business }),
      setBusinesses: (businesses) => {
        const state = get()
        const { selectedBusiness, _persistedBusinessId } = state

        set({ businesses })

        // 永続化されたIDがある場合、そのIDの事業を選択
        if (_persistedBusinessId && businesses.length > 0) {
          const persistedBusiness = businesses.find((b) => b.id === _persistedBusinessId)
          if (persistedBusiness) {
            set({ selectedBusiness: persistedBusiness, _persistedBusinessId: undefined })
            return
          }
        }

        // 選択中の事業がない場合、最初の事業を選択
        if (!selectedBusiness && businesses.length > 0) {
          set({ selectedBusiness: businesses[0] })
          return
        }

        // 選択中の事業がある場合、最新のデータで更新
        if (selectedBusiness) {
          const updatedBusiness = businesses.find((b) => b.id === selectedBusiness.id)
          if (updatedBusiness) {
            // 最新のデータで selectedBusiness を更新
            set({ selectedBusiness: updatedBusiness })
          } else {
            // 選択中の事業がリストにない場合、最初の事業を選択
            set({ selectedBusiness: businesses[0] || null })
          }
        }
      },
      setIsLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      selectBusinessById: (businessId) => {
        const { businesses } = get()
        const business = businesses.find((b) => b.id === businessId)
        if (business) {
          set({ selectedBusiness: business })
        }
      },
    }),
    {
      name: 'mocca-business-store',
      partialize: (state) => ({
        selectedBusiness: state.selectedBusiness
          ? { id: state.selectedBusiness.id }
          : null,
      }),
      merge: (persisted, current) => {
        const persistedState = persisted as { selectedBusiness?: { id: string } | null }
        return {
          ...current,
          // IDのみ保持し、実際のデータはAPI取得後にマージ
          _persistedBusinessId: persistedState?.selectedBusiness?.id,
        } as BusinessState
      },
    }
  )
)
