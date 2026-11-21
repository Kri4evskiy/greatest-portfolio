import type { MetadataRoute } from 'next'
import { resolveSiteUrl } from '@/shared/lib/seo'

export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = resolveSiteUrl()

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/search-index/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
