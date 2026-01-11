import { renderHook, waitFor, act } from '@testing-library/react'
import { useCachedFetch, useMutation } from '@/hooks/use-cached-fetch'
import { clearCache } from '@/lib/api-cache'

// モックfetch
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

// React 18のact環境を明示的に設定
beforeAll(() => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true
})

// 非同期フックテスト時のact警告を抑制
// これはReact Testing Libraryの既知の制限事項
// 参考: https://github.com/testing-library/react-testing-library/issues/1051
const originalError = console.error
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const message = typeof args[0] === 'string' ? args[0] : ''
    if (message.includes('not wrapped in act')) {
      return // 非同期フックのact警告を抑制
    }
    originalError.call(console, ...args)
  }
})
afterAll(() => {
  console.error = originalError
})

describe('useCachedFetch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    clearCache() // キャッシュをクリア
  })

  afterEach(() => {
    // 非同期処理のクリーンアップ
    clearCache()
  })

  describe('基本的なフェッチ動作', () => {
    it('データを正常にフェッチできる', async () => {
      const mockData = { id: 1, name: 'Test' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response)

      const { result } = renderHook(() => useCachedFetch<typeof mockData>('/api/test'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
        expect(result.current.isValidating).toBe(false)
        expect(result.current.data).toEqual(mockData)
      })

      expect(result.current.error).toBeUndefined()
    })

    it('エラー時にerrorが設定される', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response)

      const { result } = renderHook(() => useCachedFetch('/api/test'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
        expect(result.current.isValidating).toBe(false)
        expect(result.current.error).toBeDefined()
      })

      expect(result.current.error?.message).toContain('500')
    })

    it('endpointがnullの場合はフェッチしない', () => {
      const { result } = renderHook(() =>
        useCachedFetch(null)
      )

      expect(result.current.isLoading).toBe(false)
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('キャッシュ動作', () => {
    it('同じエンドポイントへの連続呼び出しでキャッシュが使用される', async () => {
      const mockData = { id: 1, name: 'Cached' }
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response)

      // 最初のフック
      const { result: result1, unmount: unmount1 } = renderHook(() =>
        useCachedFetch<typeof mockData>('/api/cached-test')
      )

      await waitFor(() => {
        expect(result1.current.data).toEqual(mockData)
        expect(result1.current.isValidating).toBe(false)
      })

      // 2回目のフック（キャッシュから取得されるべき）
      const { result: result2, unmount: unmount2 } = renderHook(() =>
        useCachedFetch<typeof mockData>('/api/cached-test')
      )

      await waitFor(() => {
        expect(result2.current.data).toEqual(mockData)
        expect(result2.current.isValidating).toBe(false)
      })

      // fetchは1回のみ呼ばれる（キャッシュ使用）
      expect(mockFetch).toHaveBeenCalledTimes(1)

      // クリーンアップ
      unmount1()
      unmount2()
    })
  })

  describe('manual オプション', () => {
    it('manual: trueの場合は自動フェッチしない', () => {
      const { result } = renderHook(() =>
        useCachedFetch('/api/manual-test', { manual: true })
      )

      expect(result.current.isLoading).toBe(false)
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('refresh 関数', () => {
    it('refreshでデータを再取得できる', async () => {
      const mockData1 = { id: 1, name: 'Initial' }
      const mockData2 = { id: 1, name: 'Refreshed' }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockData1,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockData2,
        } as Response)

      const { result } = renderHook(() =>
        useCachedFetch<typeof mockData1>('/api/refresh-test')
      )

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData1)
        expect(result.current.isValidating).toBe(false)
      })

      // refresh呼び出し
      await act(async () => {
        await result.current.refresh()
      })

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData2)
        expect(result.current.isValidating).toBe(false)
      })
    })
  })

  describe('mutate 関数', () => {
    it('mutateでローカルデータを更新できる', async () => {
      const mockData = { id: 1, name: 'Original' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response)

      const { result } = renderHook(() =>
        useCachedFetch<typeof mockData>('/api/mutate-test')
      )

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData)
        expect(result.current.isValidating).toBe(false)
      })

      // ローカルデータを更新
      const newData = { id: 1, name: 'Updated' }
      act(() => {
        result.current.mutate(newData)
      })

      expect(result.current.data).toEqual(newData)
    })
  })
})

describe('useMutation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('POSTリクエストを送信できる', async () => {
    const mockResponse = { id: 1, success: true }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response)

    const { result } = renderHook(() =>
      useMutation<typeof mockResponse, { name: string }>('/api/create')
    )

    expect(result.current.isLoading).toBe(false)

    let response: typeof mockResponse | undefined
    await act(async () => {
      response = await result.current.mutate({ name: 'Test' })
    })

    expect(response).toEqual(mockResponse)
    expect(mockFetch).toHaveBeenCalledWith('/api/create', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' }),
    }))
  })

  it('エラー時にonErrorコールバックが呼ばれる', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Bad Request' }),
    } as Response)

    const onError = jest.fn()
    const { result } = renderHook(() =>
      useMutation('/api/create', { onError })
    )

    await act(async () => {
      await result.current.mutate({})
    })

    expect(onError).toHaveBeenCalled()
    expect(result.current.error?.message).toContain('Bad Request')
  })

  it('成功時にonSuccessコールバックが呼ばれる', async () => {
    const mockResponse = { id: 1 }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response)

    const onSuccess = jest.fn()
    const { result } = renderHook(() =>
      useMutation<typeof mockResponse, object>('/api/create', { onSuccess })
    )

    await act(async () => {
      await result.current.mutate({})
    })

    expect(onSuccess).toHaveBeenCalledWith(mockResponse)
  })

  it('異なるHTTPメソッドを使用できる', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response)

    const { result } = renderHook(() =>
      useMutation('/api/update', { method: 'PUT' })
    )

    await act(async () => {
      await result.current.mutate({})
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/update', expect.objectContaining({
      method: 'PUT',
    }))
  })
})
