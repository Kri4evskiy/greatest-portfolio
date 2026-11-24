import { KnowledgeCategoryEnum, LOCALE_METADATA, SUPPORTED_LOCALES } from '@repo/shared-schemas'
import type { MetadataRoute } from 'next'
import { resolvePublicSiteUrl } from '@/shared/config/env'
import { APP_ROUTES, PUBLIC_KB_ROOT_SEGMENTS } from '@/shared/i18n/app-routes'

export const dynamic = 'force-static'

const PUBLIC_KB_SEGMENT_SET = new Set<string>(PUBLIC_KB_ROOT_SEGMENTS)

function buildProtectedKbDisallowRules(): string[] {
  const protectedCategories = KnowledgeCategoryEnum.options.filter((category) => !PUBLIC_KB_SEGMENT_SET.has(category))
  const rules: string[] = []

  for (const locale of SUPPORTED_LOCALES) {
    const prefix = LOCALE_METADATA[locale].urlPrefix
    for (const category of protectedCategories) {
      rules.push(`${prefix}${APP_ROUTES.knowledgeBase}/${category}/`)
    }
  }

  return rules
}

export default function robots(): MetadataRoute.Robots {
  const siteUrl = resolvePublicSiteUrl()

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/search-index/', ...buildProtectedKbDisallowRules()],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
