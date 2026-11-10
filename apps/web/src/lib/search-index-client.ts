import type { SupportedLocale } from '@repo/shared-schemas'
import type { KnowledgeSearchItem } from './mdx-content'

export interface KnowledgeSearchPayload {
  items: readonly KnowledgeSearchItem[]
  topTags: ReadonlyArray<{ tag: string; count: number }>
}

const EMPTY_PAYLOAD: KnowledgeSearchPayload = {
  items: [],
  topTags: [],
}

const resolvedCache = new Map<SupportedLocale, KnowledgeSearchPayload>()
const inflightCache = new Map<SupportedLocale, Promise<KnowledgeSearchPayload>>()

export function getCachedKnowledgeSearchIndex(locale: SupportedLocale): KnowledgeSearchPayload | null {
  return resolvedCache.get(locale) ?? null
}

export function loadKnowledgeSearchIndex(locale: SupportedLocale): Promise<KnowledgeSearchPayload> {
  const existingResolved = resolvedCache.get(locale)
  if (existingResolved) {
    return Promise.resolve(existingResolved)
  }

  const existingInflight = inflightCache.get(locale)
  if (existingInflight) {
    return existingInflight
  }

  const requestPromise = fetch(`/search-index/${locale}`, {
    method: 'GET',
    credentials: 'same-origin',
  })
    .then(async (res): Promise<KnowledgeSearchPayload> => {
      if (!res.ok) {
        return EMPTY_PAYLOAD
      }
      const data = (await res.json()) as Partial<KnowledgeSearchPayload>
      const payload: KnowledgeSearchPayload = {
        items: Array.isArray(data.items) ? data.items : [],
        topTags: Array.isArray(data.topTags) ? data.topTags : [],
      }
      resolvedCache.set(locale, payload)
      return payload
    })
    .catch((): KnowledgeSearchPayload => EMPTY_PAYLOAD)
    .finally(() => {
      inflightCache.delete(locale)
    })

  inflightCache.set(locale, requestPromise)
  return requestPromise
}

export function prefetchKnowledgeSearchIndex(locale: SupportedLocale): void {
  if (typeof window === 'undefined') return
  void loadKnowledgeSearchIndex(locale)
}
