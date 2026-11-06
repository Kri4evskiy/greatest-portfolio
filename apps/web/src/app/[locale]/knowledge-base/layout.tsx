import { DEFAULT_LOCALE, SupportedLocaleEnum } from '@repo/shared-schemas'
import type { ReactNode } from 'react'
import { KnowledgeSidebar } from '@/components/knowledge/knowledge-sidebar'
import { getKnowledgeTree } from '@/lib/mdx-content'

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

  const tree = getKnowledgeTree(resolvedLocale)
  const totalArticles = tree.reduce((acc, node) => acc + node.articleCount, 0)

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-7">
        <KnowledgeSidebar tree={tree} totalArticles={totalArticles} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}
