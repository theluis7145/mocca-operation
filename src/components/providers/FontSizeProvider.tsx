'use client'

import { useEffect } from 'react'
import { useUserStore, fontSizeConfig } from '@/stores/useUserStore'

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const { fontSize } = useUserStore()

  useEffect(() => {
    const htmlElement = document.documentElement

    // 全てのフォントサイズクラスを削除
    Object.values(fontSizeConfig).forEach(({ className }) => {
      htmlElement.classList.remove(className)
    })

    // 現在のフォントサイズクラスを追加
    const currentConfig = fontSizeConfig[fontSize]
    if (currentConfig) {
      htmlElement.classList.add(currentConfig.className)
    }
  }, [fontSize])

  return <>{children}</>
}
