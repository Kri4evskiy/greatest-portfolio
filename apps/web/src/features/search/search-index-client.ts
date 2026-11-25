import { type KnowledgeSearchPayload, KnowledgeSearchPayloadSchema, type SupportedLocale } from '@repo/shared-schemas'

export type { KnowledgeSearchPayload }

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
        if (process.env.NODE_ENV !== 'production') {
          console.error(`[search-index-client] Failed to load /search-index/${locale}: HTTP ${res.status}`)
        }
        return EMPTY_PAYLOAD
      }

      const rawJson: unknown = await res.json()
      const parsed = KnowledgeSearchPayloadSchema.safeParse(rawJson)
      if (!parsed.success) {
        if (process.env.NODE_ENV !== 'production') {
          console.error(
            `[search-index-client] Invalid /search-index/${locale} payload (schema mismatch):`,
            parsed.error.issues,
          )
        }
        return EMPTY_PAYLOAD
      }

      const payload: KnowledgeSearchPayload = parsed.data
      resolvedCache.set(locale, payload)
      return payload
    })
    .catch((error: unknown): KnowledgeSearchPayload => {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`[search-index-client] Network error loading /search-index/${locale}:`, error)
      }
      return EMPTY_PAYLOAD
    })
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
