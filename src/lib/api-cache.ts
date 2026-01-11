/**
 * シンプルなAPIキャッシュユーティリティ
 * メモリ内キャッシュでAPIレスポンスをキャッシュし、重複リクエストを防止
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

interface PendingRequest<T> {
  promise: Promise<T>
}

// キャッシュストレージ
const cache = new Map<string, CacheEntry<unknown>>()
// 進行中のリクエスト（重複リクエスト防止用）
const pendingRequests = new Map<string, PendingRequest<unknown>>()

// デフォルトのキャッシュ有効期限（5分）
const DEFAULT_TTL = 5 * 60 * 1000

/**
 * キャッシュ付きfetch
 * 同じキーのリクエストが進行中の場合は、そのPromiseを再利用
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number // キャッシュ有効期限（ミリ秒）
    forceRefresh?: boolean // 強制リフレッシュ
  } = {}
): Promise<T> {
  const { ttl = DEFAULT_TTL, forceRefresh = false } = options

  // 強制リフレッシュでない場合、キャッシュをチェック
  if (!forceRefresh) {
    const cached = cache.get(key) as CacheEntry<T> | undefined
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data
    }
  }

  // 進行中のリクエストがあればそれを返す（重複リクエスト防止）
  const pending = pendingRequests.get(key) as PendingRequest<T> | undefined
  if (pending) {
    return pending.promise
  }

  // 新しいリクエストを開始
  const promise = fetcher()
    .then((data) => {
      // キャッシュに保存
      cache.set(key, {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
      })
      return data
    })
    .finally(() => {
      // 進行中リクエストから削除
      pendingRequests.delete(key)
    })

  // 進行中リクエストに追加
  pendingRequests.set(key, { promise })

  return promise
}

/**
 * 特定のキーのキャッシュを無効化
 */
export function invalidateCache(key: string): void {
  cache.delete(key)
}

/**
 * パターンに一致するキャッシュを無効化
 */
export function invalidateCacheByPattern(pattern: string | RegExp): void {
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key)
    }
  }
}

/**
 * すべてのキャッシュをクリア
 * テスト環境では進行中のリクエストもクリアする
 */
export function clearCache(): void {
  cache.clear()
  pendingRequests.clear()
}

/**
 * キャッシュの統計情報
 */
export function getCacheStats(): {
  size: number
  keys: string[]
} {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  }
}

/**
 * useFetch用のキャッシュキー生成ヘルパー
 */
export function createCacheKey(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>
): string {
  if (!params) return endpoint

  const filteredParams = Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&')

  return filteredParams ? `${endpoint}?${filteredParams}` : endpoint
}
