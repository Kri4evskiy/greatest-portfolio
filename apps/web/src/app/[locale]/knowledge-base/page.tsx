import { DEFAULT_LOCALE, SupportedLocaleEnum } from '@repo/shared-schemas'
import { Badge, Callout } from '@repo/ui'
import { Database, ShieldCheck } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import { KnowledgeDirectoryExplorer } from '@/components/knowledge/knowledge-directory-explorer'
import {
  getAllKnowledgeArticles,
  getAllKnowledgeTags,
  getKnowledgeTree,
  type MdxArticleFrontmatter,
} from '@/lib/mdx-content'

export default async function KnowledgeBaseIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const parsed = SupportedLocaleEnum.safeParse(locale)
  const resolvedLocale = parsed.success ? parsed.data : DEFAULT_LOCALE

  const t = await getTranslations({ locale: resolvedLocale, namespace: 'KnowledgeBase' })
  const tree = getKnowledgeTree(resolvedLocale)
  const tags = getAllKnowledgeTags(resolvedLocale)

  // Strip heavy MDX AST blocks before crossing the RSC -> Client boundary
  const lightweightArticles: MdxArticleFrontmatter[] = getAllKnowledgeArticles(resolvedLocale).map(
    ({ blocks: _blocks, toc: _toc, ...frontmatter }) => frontmatter,
  )

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

      <Callout variant="success" title={t('calloutTitle')} icon={<ShieldCheck className="h-4 w-4" />}>
        {t('calloutBody')}
      </Callout>

      <Suspense fallback={null}>
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
