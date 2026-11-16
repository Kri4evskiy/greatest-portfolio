import { formatKnowledgeSegmentLabel } from '@repo/shared-schemas'
import { cache } from 'react'
import { getAllKnowledgeArticles, getAllKnowledgeFrontmatters, normalizeLocale } from './mdx-fs-loader'
import type { KnowledgeSearchItem } from './mdx-types'

export const getKnowledgeSearchIndex = cache((localeInput?: string): KnowledgeSearchItem[] => {
  const locale = normalizeLocale(localeInput)
  const docs = getAllKnowledgeArticles(locale)

  return docs.map((doc) => {
    const subSegments = doc.pathSegments.slice(1, -1)
    const subtopicLabel = subSegments.map((seg) => formatKnowledgeSegmentLabel(seg, locale)).join(' / ')

    return {
      routePath: doc.routePath,
      title: doc.title,
      sidebarLabel: doc.sidebarLabel,
      summary: doc.summary,
      category: doc.category,
      topicLabel: formatKnowledgeSegmentLabel(doc.category, locale),
      subtopicLabel,
      format: doc.format,
      tags: doc.tags,
      readingTime: doc.readingTime,
      headings: doc.toc.filter((h) => h.level === 2 || h.level === 3).map((h) => ({ id: h.id, text: h.text })),
    }
  })
})

export const getAllKnowledgeTags = cache((localeInput?: string): Array<{ tag: string; count: number }> => {
  const frontmatters = getAllKnowledgeFrontmatters(localeInput)
  const counts = new Map<string, number>()

  for (const doc of frontmatters) {
    for (const tag of doc.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }

  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
})
