import { DEFAULT_LOCALE, SupportedLocaleEnum } from '@repo/shared-schemas'
import type { ReactNode } from 'react'
import { KnowledgeSidebar } from '@/components/knowledge/knowledge-sidebar'
import { getAllKnowledgeArticles } from '@/lib/mdx-content'

export default async function KnowledgeBaseLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const parsed = SupportedLocaleEnum.safeParse(locale)
  const resolvedLocale = parsed.success ? parsed.data : DEFAULT_LOCALE

  const articles = getAllKnowledgeArticles(resolvedLocale).map((a) => ({
    slug: a.slug,
    category: a.category,
    locale: a.locale,
    isFallback: a.isFallback,
    title: a.title,
    summary: a.summary,
    readingTime: a.readingTime,
    publishedAt: a.publishedAt,
  }))

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-8 md:flex-row md:items-start">
        <KnowledgeSidebar articles={articles} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}
