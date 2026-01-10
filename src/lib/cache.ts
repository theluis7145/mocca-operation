// シンプルなメモリ内キャッシュ
// サーバーサイドでAPIレスポンスをキャッシュするために使用

interface CacheItem<T> {
  data: T
  expiresAt: number
}

class MemoryCache {
  private cache = new Map<string, CacheItem<unknown>>()

  // デフォルトTTL: 5分
  private defaultTTL = 5 * 60 * 1000

  get<T>(key: string): T | null {
    const item = this.cache.get(key) as CacheItem<T> | undefined
    if (!item) return null

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  set<T>(key: string, data: T, ttlMs?: number): void {
    const expiresAt = Date.now() + (ttlMs ?? this.defaultTTL)
    this.cache.set(key, { data, expiresAt })
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  // 特定のプレフィックスで始まるキーをすべて削除
  invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key)
      }
    }
  }

  clear(): void {
    this.cache.clear()
  }

  // 期限切れのアイテムをクリーンアップ
  cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key)
      }
    }
  }
}

// シングルトンインスタンス
export const cache = new MemoryCache()

// キャッシュキー生成ヘルパー
export function createCacheKey(...parts: (string | number | undefined | null)[]): string {
  return parts.filter((p) => p != null).join(':')
}

// キャッシュ付きフェッチャー
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs?: number
): Promise<T> {
  const cached = cache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  const data = await fetcher()
  cache.set(key, data, ttlMs)
  return data
}
