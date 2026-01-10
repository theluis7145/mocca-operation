'use client'

import { create } from 'zustand'

interface NavigationState {
  currentManual: { id: string; title: string } | null
  setCurrentManual: (manual: { id: string; title: string } | null) => void
  clearNavigation: () => void
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentManual: null,
  setCurrentManual: (manual) => set({ currentManual: manual }),
  clearNavigation: () => set({ currentManual: null }),
}))
