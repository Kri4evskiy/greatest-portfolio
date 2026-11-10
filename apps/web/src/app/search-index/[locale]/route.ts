import { DEFAULT_LOCALE, SUPPORTED_LOCALES, SupportedLocaleEnum } from '@repo/shared-schemas'
import { NextResponse } from 'next/server'
import { getAllKnowledgeTags, getKnowledgeSearchIndex } from '@/lib/mdx-content'

export const dynamic = 'force-static'

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }))
}

export async function GET(_request: Request, context: { params: Promise<{ locale: string }> }) {
  const { locale } = await context.params
  const parsed = SupportedLocaleEnum.safeParse(locale)
  const resolvedLocale = parsed.success ? parsed.data : DEFAULT_LOCALE

  return NextResponse.json(
    {
      items: getKnowledgeSearchIndex(resolvedLocale),
      topTags: getAllKnowledgeTags(resolvedLocale),
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    },
  )
}
