import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FontSize } from '@prisma/client'

interface UserSettingsState {
  // 文字サイズ設定
  fontSize: FontSize
  // サイドバーの開閉状態（デスクトップ用）
  sidebarOpen: boolean
  // モバイルサイドバーの開閉状態
  mobileSidebarOpen: boolean

  // Actions
  setFontSize: (fontSize: FontSize) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setMobileSidebarOpen: (open: boolean) => void
}

export const useUserStore = create<UserSettingsState>()(
  persist(
    (set) => ({
      fontSize: 'MEDIUM',
      sidebarOpen: true,
      mobileSidebarOpen: false,

      setFontSize: (fontSize) => set({ fontSize }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
    }),
    {
      name: 'mocca-user-settings',
    }
  )
)

// 文字サイズのラベルとCSSクラス名のマッピング
export const fontSizeConfig: Record<FontSize, { label: string; className: string }> = {
  SMALL: { label: '小', className: 'font-small' },
  MEDIUM: { label: '中', className: 'font-medium' },
  LARGE: { label: '大', className: 'font-large' },
}
