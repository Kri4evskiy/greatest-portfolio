'use client'

import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { IsRestoringProvider, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  type Persister,
  persistQueryClientRestore,
  persistQueryClientSubscribe,
} from '@tanstack/react-query-persist-client'
import { del, get, set } from 'idb-keyval'
import { type ReactNode, useEffect, useState } from 'react'
import { captureClientException } from '@/shared/lib/analytics'
import { ApiClientError, isCancelledRequestError } from '@/shared/lib/api-client'

const CACHE_KEY = 'greatest-portfolio-query-cache'
const CACHE_BUSTER = 'v1'
const TWENTY_FOUR_HOURS_MS = 1000 * 60 * 60 * 24

let browserQueryClient: QueryClient | undefined
let browserPersister: Persister | undefined
let browserRestorePromise: Promise<void> | null = null
let hasRestoredBrowserCache = false

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Ignore standard AbortError / TanStack Query unmount cancellations (e.g. React 19 StrictMode)
        if (isCancelledRequestError(error)) {
          return
        }
        if (query.state.status === 'pending' && query.state.fetchStatus === 'idle') {
          return
        }
        // Ignore expected 4xx RBAC / validation responses; forward real network or 5xx failures
        if (error instanceof ApiClientError && error.status >= 400 && error.status < 500) {
          return
        }
        captureClientException(error, {
          source: 'QueryCache.onError',
          queryKey: JSON.stringify(query.queryKey),
          ...(error instanceof ApiClientError ? { status: error.status, requestId: error.requestId } : {}),
        })
      },
    }),
    defaultOptions: {
      queries: {
        gcTime: TWENTY_FOUR_HOURS_MS,
        staleTime: 1000 * 60 * 5,
        retry: (failureCount, error) => {
          if (error instanceof ApiClientError && error.status >= 400 && error.status < 500) {
            return false
          }
          return failureCount < 1
        },
        refetchOnWindowFocus: false,
      },
    },
  })
}

function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    // Isolate SSR/SSG renders with a fresh per-request client
    return makeQueryClient()
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient()
  }
  return browserQueryClient
}

function getBrowserPersister(): Persister {
  if (!browserPersister) {
    browserPersister = createAsyncStoragePersister({
      key: CACHE_KEY,
      storage: {
        getItem: async (key: string) => {
          if (typeof window === 'undefined' || typeof window.indexedDB === 'undefined') return null
          const val = await get<string>(key)
          return val ?? null
        },
        setItem: async (key: string, value: string) => {
          if (typeof window === 'undefined' || typeof window.indexedDB === 'undefined') return
          await set(key, value)
        },
        removeItem: async (key: string) => {
          if (typeof window === 'undefined' || typeof window.indexedDB === 'undefined') return
          await del(key)
        },
      },
      throttleTime: 1000,
    })
  }
  return browserPersister
}

function ensureBrowserCacheRestored(client: QueryClient): Promise<void> {
  if (hasRestoredBrowserCache) {
    return Promise.resolve()
  }
  if (!browserRestorePromise) {
    browserRestorePromise = persistQueryClientRestore({
      queryClient: client,
      persister: getBrowserPersister(),
      maxAge: TWENTY_FOUR_HOURS_MS,
      buster: CACHE_BUSTER,
    })
      .catch(() => undefined)
      .finally(() => {
        hasRestoredBrowserCache = true
      })
  }
  return browserRestorePromise
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient()
  // Match SSR initial state (`true`) on first cold mount, then stay `false` across [locale] remounts
  const [isRestoring, setIsRestoring] = useState(() =>
    typeof window === 'undefined' ? true : !hasRestoredBrowserCache,
  )

  useEffect(() => {
    if (!isRestoring) return
    let cancelled = false
    void ensureBrowserCacheRestored(queryClient).finally(() => {
      if (!cancelled) {
        setIsRestoring(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [queryClient, isRestoring])

  useEffect(() => {
    if (isRestoring) return
    return persistQueryClientSubscribe({
      queryClient,
      persister: getBrowserPersister(),
      buster: CACHE_BUSTER,
    })
  }, [queryClient, isRestoring])

  return (
    <QueryClientProvider client={queryClient}>
      <IsRestoringProvider value={isRestoring}>{children}</IsRestoringProvider>
    </QueryClientProvider>
  )
}
