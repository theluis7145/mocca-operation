import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'

// 各テスト後にReact Testing Libraryのクリーンアップを実行
afterEach(() => {
  cleanup()
})

// fetch APIのモック
global.fetch = jest.fn()

// matchMedia のモック（Radix UIなどで使用）
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// ResizeObserver のモック
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// IntersectionObserver のモック
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// スクロール関連のモック
Element.prototype.scrollIntoView = jest.fn()
