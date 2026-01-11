'use client'

import { useState, useEffect, useCallback, useRef, useReducer } from 'react'
import { cachedFetch, invalidateCache, createCacheKey } from '@/lib/api-cache'

interface UseCachedFetchOptions {
  /** キャッシュ有効期限（ミリ秒） */
  ttl?: number
  /** 自動フェッチを無効化 */
  manual?: boolean
  /** 初期データ */
  initialData?: unknown
  /** 認証情報を含める */
  credentials?: RequestCredentials
}

interface UseCachedFetchResult<T> {
  data: T | undefined
  error: Error | undefined
  isLoading: boolean
  isValidating: boolean
  mutate: (data?: T) => void
  refresh: () => Promise<void>
}

// 状態管理用の型定義
interface FetchState<T> {
  data: T | undefined
  error: Error | undefined
  isLoading: boolean
  isValidating: boolean
}

type FetchAction<T> =
  | { type: 'FETCH_START'; hasData: boolean }
  | { type: 'FETCH_SUCCESS'; data: T }
  | { type: 'FETCH_ERROR'; error: Error }
  | { type: 'FETCH_END' }
  | { type: 'MUTATE'; data: T }

function fetchReducer<T>(state: FetchState<T>, action: FetchAction<T>): FetchState<T> {
  switch (action.type) {
    case 'FETCH_START':
      return {
        ...state,
        isLoading: !action.hasData,
        isValidating: true,
        error: undefined,
      }
    case 'FETCH_SUCCESS':
      return {
        ...state,
        data: action.data,
        isLoading: false,
        isValidating: false,
      }
    case 'FETCH_ERROR':
      return {
        ...state,
        error: action.error,
        isLoading: false,
        isValidating: false,
      }
    case 'FETCH_END':
      return {
        ...state,
        isLoading: false,
        isValidating: false,
      }
    case 'MUTATE':
      return {
        ...state,
        data: action.data,
      }
    default:
      return state
  }
}

/**
 * キャッシュ付きデータフェッチフック
 * SWRライクなインターフェースで、キャッシュと重複リクエスト防止を提供
 */
export function useCachedFetch<T>(
  endpoint: string | null,
  options: UseCachedFetchOptions = {}
): UseCachedFetchResult<T> {
  const {
    ttl,
    manual = false,
    initialData,
    credentials = 'include',
  } = options

  const [state, dispatch] = useReducer(fetchReducer<T>, {
    data: initialData as T | undefined,
    error: undefined,
    isLoading: !manual && !!endpoint,
    isValidating: false,
  })

  // マウント状態を追跡
  const isMounted = useRef(true)

  const fetcher = useCallback(async (): Promise<T> => {
    if (!endpoint) throw new Error('No endpoint provided')

    const response = await fetch(endpoint, { credentials })
    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status}`)
    }
    return response.json()
  }, [endpoint, credentials])

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!endpoint) return

    const cacheKey = createCacheKey(endpoint)

    dispatch({ type: 'FETCH_START', hasData: !!state.data })

    try {
      const result = await cachedFetch<T>(cacheKey, fetcher, {
        ttl,
        forceRefresh,
      })

      if (isMounted.current) {
        dispatch({ type: 'FETCH_SUCCESS', data: result })
      }
    } catch (err) {
      if (isMounted.current) {
        dispatch({ type: 'FETCH_ERROR', error: err instanceof Error ? err : new Error('Unknown error') })
      }
    }
  }, [endpoint, fetcher, ttl, state.data])

  // 自動フェッチ
  useEffect(() => {
    isMounted.current = true

    if (!manual && endpoint) {
      fetchData()
    }

    return () => {
      isMounted.current = false
    }
  }, [endpoint, manual, fetchData])

  // データを手動で更新
  const mutate = useCallback((newData?: T) => {
    if (newData !== undefined) {
      dispatch({ type: 'MUTATE', data: newData })
    }
    if (endpoint) {
      invalidateCache(createCacheKey(endpoint))
    }
  }, [endpoint])

  // 強制リフレッシュ
  const refresh = useCallback(async () => {
    await fetchData(true)
  }, [fetchData])

  return {
    data: state.data,
    error: state.error,
    isLoading: state.isLoading,
    isValidating: state.isValidating,
    mutate,
    refresh,
  }
}

/**
 * POSTリクエスト用のミューテーションフック
 */
export function useMutation<TData, TVariables>(
  endpoint: string,
  options: {
    method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    onSuccess?: (data: TData) => void
    onError?: (error: Error) => void
    invalidateKeys?: string[]
  } = {}
) {
  const {
    method = 'POST',
    onSuccess,
    onError,
    invalidateKeys = [],
  } = options

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | undefined>()

  const mutate = useCallback(async (variables: TVariables): Promise<TData | undefined> => {
    setIsLoading(true)
    setError(undefined)

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(variables),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Request failed: ${response.status}`)
      }

      const data = await response.json() as TData

      // 関連キャッシュを無効化
      invalidateKeys.forEach((key) => invalidateCache(key))

      onSuccess?.(data)
      return data
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      onError?.(error)
      return undefined
    } finally {
      setIsLoading(false)
    }
  }, [endpoint, method, onSuccess, onError, invalidateKeys])

  return {
    mutate,
    isLoading,
    error,
  }
}
