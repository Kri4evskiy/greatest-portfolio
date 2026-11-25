import MiniSearch from 'minisearch'
import type { KnowledgeSearchItem } from '@/entities/knowledge-content'
import { buildKnowledgeBasePath, isPublicKnowledgeBasePath } from '@/shared/i18n/app-routes'

export type PaletteSection = 'quick-actions' | 'articles' | 'public-articles' | 'protected-articles'

export type QuickActionType = 'cv-home' | 'cv-pdf' | 'system-status' | 'tech-radar' | 'roadmap' | 'kb-overview'

export interface QuickActionPaletteEntry {
  kind: 'quick-action'
  section: 'quick-actions'
  id: string
  label: string
  actionType: QuickActionType
}

export interface ArticlePaletteEntry {
  kind: 'article'
  section: Exclude<PaletteSection, 'quick-actions'>
  id: string
  item: KnowledgeSearchItem
  matchedHeading?: { id: string; text: string } | undefined
}

export type PaletteEntry = QuickActionPaletteEntry | ArticlePaletteEntry

interface IndexedKnowledgeDocument {
  id: string
  title: string
  sidebarLabel: string
  topicLabel: string
  subtopicLabel: string
  summary: string
  tagsText: string
  headingsText: string
}

export interface KnowledgeSearchEngine {
  items: readonly KnowledgeSearchItem[]
  itemById: ReadonlyMap<string, KnowledgeSearchItem>
  miniSearch: MiniSearch<IndexedKnowledgeDocument>
}

export function createKnowledgeSearchEngine(items: readonly KnowledgeSearchItem[]): KnowledgeSearchEngine {
  const miniSearch = new MiniSearch<IndexedKnowledgeDocument>({
    idField: 'id',
    fields: ['title', 'sidebarLabel', 'subtopicLabel', 'topicLabel', 'tagsText', 'headingsText', 'summary'],
    searchOptions: {
      prefix: true,
      fuzzy: (term) => (term.length >= 4 ? 0.2 : false),
      boost: {
        title: 4,
        sidebarLabel: 3.5,
        subtopicLabel: 3,
        tagsText: 2.5,
        topicLabel: 2,
        headingsText: 2,
        summary: 1.2,
      },
    },
  })

  const itemById = new Map<string, KnowledgeSearchItem>()
  const docs: IndexedKnowledgeDocument[] = []

  for (const item of items) {
    itemById.set(item.routePath, item)
    docs.push({
      id: item.routePath,
      title: item.title,
      sidebarLabel: item.sidebarLabel,
      topicLabel: item.topicLabel,
      subtopicLabel: item.subtopicLabel,
      summary: item.summary,
      tagsText: item.tags.join(' '),
      headingsText: item.headings.map((heading) => heading.text).join(' '),
    })
  }

  miniSearch.addAll(docs)

  return {
    items,
    itemById,
    miniSearch,
  }
}

function findMatchedHeading(
  item: KnowledgeSearchItem,
  rawQuery: string,
  matchedTerms: readonly string[],
): { id: string; text: string } | undefined {
  const normalizedQuery = rawQuery.toLowerCase()
  const exactHeading = item.headings.find((heading) => heading.text.toLowerCase().includes(normalizedQuery))
  if (exactHeading) return exactHeading

  if (matchedTerms.length === 0) return undefined
  return item.headings.find((heading) => {
    const lower = heading.text.toLowerCase()
    return matchedTerms.some((term) => term.length >= 2 && lower.includes(term.toLowerCase()))
  })
}

export function filterCommandPaletteEntries({
  engine,
  quickActions,
  query,
  isUnlocked,
}: {
  engine: KnowledgeSearchEngine
  quickActions: readonly QuickActionPaletteEntry[]
  query: string
  isUnlocked: boolean
}): PaletteEntry[] {
  const trimmed = query.trim().toLowerCase()

  if (!trimmed) {
    if (isUnlocked) {
      return [
        ...quickActions,
        ...engine.items.map(
          (item): ArticlePaletteEntry => ({
            kind: 'article',
            section: 'articles',
            id: item.routePath,
            item,
          }),
        ),
      ]
    }

    const publicEntries: ArticlePaletteEntry[] = []
    const protectedEntries: ArticlePaletteEntry[] = []
    for (const item of engine.items) {
      const isPublic = isPublicKnowledgeBasePath(buildKnowledgeBasePath(item.routePath))
      if (isPublic) {
        publicEntries.push({ kind: 'article', section: 'public-articles', id: item.routePath, item })
      } else {
        protectedEntries.push({ kind: 'article', section: 'protected-articles', id: item.routePath, item })
      }
    }
    return [...quickActions, ...publicEntries, ...protectedEntries]
  }

  // Dedicated #tag mode (exact + substring tag matching)
  if (trimmed.startsWith('#')) {
    const needle = trimmed.slice(1)
    if (!needle) {
      return engine.items.map(
        (item): ArticlePaletteEntry => ({
          kind: 'article',
          section: 'articles',
          id: item.routePath,
          item,
        }),
      )
    }

    const matchedByTag: Array<{ entry: ArticlePaletteEntry; score: number }> = []
    for (const item of engine.items) {
      let score = 0
      for (const tag of item.tags) {
        if (tag === needle) score += 20
        else if (tag.includes(needle)) score += 10
      }
      if (score > 0) {
        matchedByTag.push({
          score,
          entry: { kind: 'article', section: 'articles', id: item.routePath, item },
        })
      }
    }
    matchedByTag.sort((a, b) => b.score - a.score)
    return matchedByTag.map((match) => match.entry)
  }

  // Full-text + prefix + typo-tolerant fuzzy search via MiniSearch (AND first, OR fallback)
  let results = engine.miniSearch.search(trimmed, { combineWith: 'AND' })
  if (results.length === 0) {
    results = engine.miniSearch.search(trimmed, { combineWith: 'OR' })
  }

  const matchedArticles: ArticlePaletteEntry[] = []
  for (const result of results) {
    const item = engine.itemById.get(String(result.id))
    if (!item) continue
    matchedArticles.push({
      kind: 'article',
      section: 'articles',
      id: item.routePath,
      item,
      matchedHeading: findMatchedHeading(item, trimmed, result.terms),
    })
  }

  const matchedActions = quickActions.filter((qa) => qa.label.toLowerCase().includes(trimmed))
  return [...matchedActions, ...matchedArticles]
}
