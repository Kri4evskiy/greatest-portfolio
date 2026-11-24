import { DEFAULT_LOCALE, SupportedLocaleEnum } from '@repo/shared-schemas'
import { Badge } from '@repo/ui'
import { Database } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import { KnowledgeAccessCallout } from '@/entities/knowledge-article/ui/knowledge-access-callout'
import { KnowledgeDirectoryExplorer } from '@/entities/knowledge-article/ui/knowledge-directory-explorer'
import { KnowledgeDirectorySkeleton } from '@/entities/knowledge-article/ui/knowledge-skeletons'
import {
  getAllKnowledgeFrontmatters,
  getAllKnowledgeTags,
  getKnowledgeTree,
  type MdxArticleFrontmatter,
} from '@/entities/knowledge-content'
import { APP_ROUTES } from '@/shared/i18n/app-routes'
import { buildOpenGraphMetadata, buildPageAlternates } from '@/shared/lib/seo'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const parsed = SupportedLocaleEnum.safeParse(locale)
  const resolvedLocale = parsed.success ? parsed.data : DEFAULT_LOCALE
  const t = await getTranslations({ locale: resolvedLocale, namespace: 'KnowledgeBase' })
  const title = `${t('title')} | Workfolio`
  const description = t('description')

  return {
    title,
    description,
    alternates: buildPageAlternates(APP_ROUTES.knowledgeBase, resolvedLocale),
    openGraph: buildOpenGraphMetadata({
      title,
      description,
      pathname: APP_ROUTES.knowledgeBase,
      locale: resolvedLocale,
      type: 'website',
    }),
  }
}

export default async function KnowledgeBaseIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const parsed = SupportedLocaleEnum.safeParse(locale)
  const resolvedLocale = parsed.success ? parsed.data : DEFAULT_LOCALE

  const t = await getTranslations({ locale: resolvedLocale, namespace: 'KnowledgeBase' })
  const tree = getKnowledgeTree(resolvedLocale)
  const tags = getAllKnowledgeTags(resolvedLocale)
  const lightweightArticles: MdxArticleFrontmatter[] = [...getAllKnowledgeFrontmatters(resolvedLocale)]

  return (
    <div className="space-y-8">
      <div className="space-y-3 border-b border-border/70 pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="success" className="font-mono text-xs">
            {t('protectedBadge')}
          </Badge>
          <Badge variant="outline" className="font-mono text-xs">
            Topic → Subtopic → Articles • ⌘K Search • #Tags
          </Badge>
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('title')}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{t('description')}</p>
      </div>

      <KnowledgeAccessCallout />

      <Suspense fallback={<KnowledgeDirectorySkeleton />}>
        <KnowledgeDirectoryExplorer tree={tree} articles={lightweightArticles} tags={tags} locale={resolvedLocale} />
      </Suspense>

      <div className="rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2 font-mono font-semibold text-foreground">
          <Database className="h-4 w-4 text-primary" />
          <span>{t('howToAddTitle')}</span>
        </div>
        <p className="mt-1">{t('howToAddBody')}</p>
      </div>
    </div>
  )
}
