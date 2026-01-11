import {
  cachedFetch,
  invalidateCache,
  invalidateCacheByPattern,
  clearCache,
  getCacheStats,
  createCacheKey,
} from '@/lib/api-cache'

describe('api-cache', () => {
  beforeEach(() => {
    clearCache()
    jest.clearAllMocks()
  })

  describe('cachedFetch', () => {
    it('fetcher関数を呼び出してデータを返す', async () => {
      const mockData = { id: 1, name: 'Test' }
      const fetcher = jest.fn().mockResolvedValue(mockData)

      const result = await cachedFetch('test-key', fetcher)

      expect(result).toEqual(mockData)
      expect(fetcher).toHaveBeenCalledTimes(1)
    })

    it('キャッシュ済みデータを返す（fetcher再呼び出しなし）', async () => {
      const mockData = { id: 1, name: 'Cached' }
      const fetcher = jest.fn().mockResolvedValue(mockData)

      // 1回目
      await cachedFetch('cached-key', fetcher)
      // 2回目（キャッシュから）
      const result = await cachedFetch('cached-key', fetcher)

      expect(result).toEqual(mockData)
      expect(fetcher).toHaveBeenCalledTimes(1)
    })

    it('forceRefresh: trueでキャッシュをバイパスする', async () => {
      const mockData1 = { id: 1, name: 'First' }
      const mockData2 = { id: 1, name: 'Second' }
      const fetcher = jest.fn()
        .mockResolvedValueOnce(mockData1)
        .mockResolvedValueOnce(mockData2)

      // 1回目
      await cachedFetch('force-key', fetcher)
      // 2回目（強制リフレッシュ）
      const result = await cachedFetch('force-key', fetcher, { forceRefresh: true })

      expect(result).toEqual(mockData2)
      expect(fetcher).toHaveBeenCalledTimes(2)
    })

    it('同時リクエストは重複しない', async () => {
      const mockData = { id: 1, name: 'Deduplicated' }
      let resolvePromise: (value: typeof mockData) => void
      const fetcher = jest.fn().mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = resolve
        })
      )

      // 同時に3つのリクエストを開始
      const promise1 = cachedFetch('dedup-key', fetcher)
      const promise2 = cachedFetch('dedup-key', fetcher)
      const promise3 = cachedFetch('dedup-key', fetcher)

      // Promiseを解決
      resolvePromise!(mockData)

      const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3])

      expect(result1).toEqual(mockData)
      expect(result2).toEqual(mockData)
      expect(result3).toEqual(mockData)
      // fetcherは1回のみ呼ばれる
      expect(fetcher).toHaveBeenCalledTimes(1)
    })

    it('TTL超過後はキャッシュが無効になる', async () => {
      jest.useFakeTimers()

      const mockData1 = { id: 1, name: 'First' }
      const mockData2 = { id: 1, name: 'Second' }
      const fetcher = jest.fn()
        .mockResolvedValueOnce(mockData1)
        .mockResolvedValueOnce(mockData2)

      // TTL 100msでキャッシュ
      await cachedFetch('ttl-key', fetcher, { ttl: 100 })

      // 200ms経過
      jest.advanceTimersByTime(200)

      // 再フェッチ（キャッシュ切れ）
      const result = await cachedFetch('ttl-key', fetcher, { ttl: 100 })

      expect(result).toEqual(mockData2)
      expect(fetcher).toHaveBeenCalledTimes(2)

      jest.useRealTimers()
    })
  })

  describe('invalidateCache', () => {
    it('特定のキーのキャッシュを削除する', async () => {
      const mockData = { id: 1 }
      const fetcher = jest.fn().mockResolvedValue(mockData)

      await cachedFetch('invalidate-key', fetcher)
      invalidateCache('invalidate-key')
      await cachedFetch('invalidate-key', fetcher)

      expect(fetcher).toHaveBeenCalledTimes(2)
    })
  })

  describe('invalidateCacheByPattern', () => {
    it('パターンに一致するキャッシュを削除する', async () => {
      const fetcher = jest.fn().mockResolvedValue({})

      await cachedFetch('/api/users/1', fetcher)
      await cachedFetch('/api/users/2', fetcher)
      await cachedFetch('/api/posts/1', fetcher)

      // /api/users/* を無効化
      invalidateCacheByPattern(/^\/api\/users/)

      const stats = getCacheStats()
      expect(stats.keys).toContain('/api/posts/1')
      expect(stats.keys).not.toContain('/api/users/1')
      expect(stats.keys).not.toContain('/api/users/2')
    })
  })

  describe('clearCache', () => {
    it('すべてのキャッシュを削除する', async () => {
      const fetcher = jest.fn().mockResolvedValue({})

      await cachedFetch('key1', fetcher)
      await cachedFetch('key2', fetcher)

      clearCache()

      const stats = getCacheStats()
      expect(stats.size).toBe(0)
      expect(stats.keys).toHaveLength(0)
    })
  })

  describe('getCacheStats', () => {
    it('キャッシュの統計情報を返す', async () => {
      const fetcher = jest.fn().mockResolvedValue({})

      await cachedFetch('stat-key-1', fetcher)
      await cachedFetch('stat-key-2', fetcher)

      const stats = getCacheStats()

      expect(stats.size).toBe(2)
      expect(stats.keys).toContain('stat-key-1')
      expect(stats.keys).toContain('stat-key-2')
    })
  })

  describe('createCacheKey', () => {
    it('エンドポイントのみの場合はそのまま返す', () => {
      expect(createCacheKey('/api/users')).toBe('/api/users')
    })

    it('パラメータ付きのキーを生成する', () => {
      const key = createCacheKey('/api/users', { page: 1, limit: 10 })
      expect(key).toBe('/api/users?limit=10&page=1')
    })

    it('undefinedのパラメータは除外する', () => {
      const key = createCacheKey('/api/users', { page: 1, limit: undefined })
      expect(key).toBe('/api/users?page=1')
    })

    it('パラメータはアルファベット順にソートされる', () => {
      const key = createCacheKey('/api/users', { z: 1, a: 2, m: 3 })
      expect(key).toBe('/api/users?a=2&m=3&z=1')
    })
  })
})
