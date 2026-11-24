import { KnowledgeCategoryEnum, KnowledgeNoteFormatEnum, type SupportedLocale } from '@repo/shared-schemas'
import { z } from 'zod'
import type { KnowledgeSearchItem } from '@/entities/knowledge-content'

const KnowledgeSearchItemSchema = z.object({
  slug: z.string(),
  routePath: z.string(),
  category: KnowledgeCategoryEnum,
  topicLabel: z.string(),
  subtopicLabel: z.string(),
  title: z.string(),
  sidebarLabel: z.string(),
  summary: z.string(),
  format: KnowledgeNoteFormatEnum,
  readingTime: z.string(),
  tags: z.array(z.string()),
  headings: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
    }),
  ),
})

const KnowledgeSearchPayloadSchema = z.object({
  items: z.array(KnowledgeSearchItemSchema),
  topTags: z.array(
    z.object({
      tag: z.string(),
      count: z.number().int().nonnegative(),
    }),
  ),
})

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
      const rawJson: unknown = await res.json()
      const parsed = KnowledgeSearchPayloadSchema.safeParse(rawJson)
      if (!parsed.success) {
        return EMPTY_PAYLOAD
      }
      const payload: KnowledgeSearchPayload = parsed.data
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
