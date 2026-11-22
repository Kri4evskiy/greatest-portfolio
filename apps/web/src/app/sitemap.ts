import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@repo/shared-schemas'
import type { MetadataRoute } from 'next'
import { getAllKnowledgeFrontmatters, getAllStaticKnowledgeSlugArrays } from '@/entities/knowledge-content'
import { buildLanguageAlternatesMap, buildLocalizedUrl } from '@/shared/lib/seo'

export const dynamic = 'force-static'

const FALLBACK_LAST_MODIFIED = new Date('2026-03-01T00:00:00.000Z')

function parsePublishedDate(dateStr?: string): Date {
  if (!dateStr) {
    return FALLBACK_LAST_MODIFIED
  }
  const parsed = new Date(dateStr)
  return Number.isNaN(parsed.getTime()) ? FALLBACK_LAST_MODIFIED : parsed
}

export default function sitemap(): MetadataRoute.Sitemap {
  const frontmatters = getAllKnowledgeFrontmatters(DEFAULT_LOCALE)
  const articleDateByRoute = new Map<string, Date>()

  for (const item of frontmatters) {
    articleDateByRoute.set(item.routePath, parsePublishedDate(item.publishedAt))
  }

  const staticRoutes: Array<{
    pathname: string
    changeFrequency: 'weekly' | 'monthly'
    priority: number
    lastModified: Date
  }> = [
    {
      pathname: '/',
      changeFrequency: 'weekly',
      priority: 1.0,
      lastModified: FALLBACK_LAST_MODIFIED,
    },
    {
      pathname: '/cv',
      changeFrequency: 'monthly',
      priority: 0.9,
      lastModified: FALLBACK_LAST_MODIFIED,
    },
    {
      pathname: '/knowledge-base',
      changeFrequency: 'weekly',
      priority: 0.9,
      lastModified: FALLBACK_LAST_MODIFIED,
    },
    {
      pathname: '/system-status',
      changeFrequency: 'weekly',
      priority: 0.85,
      lastModified: FALLBACK_LAST_MODIFIED,
    },
  ]

  const kbSlugArrays = getAllStaticKnowledgeSlugArrays()
  for (const slugSegments of kbSlugArrays) {
    const routeKey = slugSegments.join('/')
    const articleLastMod = articleDateByRoute.get(routeKey)
    const isArticle = articleLastMod !== undefined

    staticRoutes.push({
      pathname: `/knowledge-base/${routeKey}`,
      changeFrequency: isArticle ? 'monthly' : 'weekly',
      priority: isArticle ? 0.8 : 0.7,
      lastModified: articleLastMod ?? FALLBACK_LAST_MODIFIED,
    })
  }

  const entries: MetadataRoute.Sitemap = []

  for (const route of staticRoutes) {
    const languages = buildLanguageAlternatesMap(route.pathname)

    for (const locale of SUPPORTED_LOCALES) {
      entries.push({
        url: buildLocalizedUrl(route.pathname, locale),
        lastModified: route.lastModified,
        changeFrequency: route.changeFrequency,
        priority: locale === DEFAULT_LOCALE ? route.priority : Number((route.priority * 0.95).toFixed(2)),
        alternates: {
          languages,
        },
      })
    }
  }

  return entries
}
