import { DEFAULT_LOCALE, getKnowledgeCategoryLabel, SUPPORTED_LOCALES, SupportedLocaleEnum } from '@repo/shared-schemas'
import { Badge, Callout, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui'
import { ArrowLeft, ArrowRight, Calendar, ChevronRight, Clock, FolderOpen, Globe, Sparkles, Zap } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ArticleMetricsBar } from '@/components/knowledge/article-metrics-bar'
import { DesktopArticleToc, MobileArticleToc } from '@/components/knowledge/article-toc'
import { MdxArticleRenderer, renderInlineMarkdown } from '@/components/knowledge/mdx-article-renderer'
import { Link } from '@/i18n/navigation'
import {
  buildKnowledgeBreadcrumbs,
  getAllStaticKnowledgeSlugArrays,
  getArticleByPathSegments,
  getFolderByPathSegments,
  type KnowledgeBreadcrumbItem,
  type KnowledgeTreeArticleNode,
  type KnowledgeTreeFolderNode,
} from '@/lib/mdx-content'

interface CatchAllKnowledgePageProps {
  params: Promise<{
    locale: string
    slug: string[]
  }>
}

export function generateStaticParams() {
  const slugArrays = getAllStaticKnowledgeSlugArrays()
  return SUPPORTED_LOCALES.flatMap((locale) =>
    slugArrays.map((slug) => ({
      locale,
      slug,
    })),
  )
}

export async function generateMetadata({ params }: CatchAllKnowledgePageProps): Promise<Metadata> {
  const { locale, slug } = await params
  const parsed = SupportedLocaleEnum.safeParse(locale)
  const resolvedLocale = parsed.success ? parsed.data : DEFAULT_LOCALE

  const article = getArticleByPathSegments(slug, resolvedLocale)
  if (article) {
    return {
      title: `${article.title} | Engineering Knowledge Base`,
      description: article.summary,
    }
  }

  const folder = getFolderByPathSegments(slug, resolvedLocale)
  if (folder) {
    return {
      title: `${folder.label} | Engineering Knowledge Base`,
      description: `${folder.label} (${folder.articleCount} engineering notes)`,
    }
  }

  return {
    title: 'Not Found | Knowledge Base',
  }
}

function BreadcrumbsNav({ rootLabel, items }: { rootLabel: string; items: readonly KnowledgeBreadcrumbItem[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4 flex flex-wrap items-center gap-1 font-mono text-xs text-muted-foreground"
    >
      <Link href="/knowledge-base" className="transition-colors hover:text-foreground">
        {rootLabel}
      </Link>
      {items.map((crumb, idx) => {
        const isLast = idx === items.length - 1
        return (
          <span key={crumb.href} className="inline-flex min-w-0 items-center gap-1">
            <ChevronRight className="h-3 w-3 shrink-0 opacity-60" />
            {isLast ? (
              <span className="truncate font-semibold text-foreground">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="truncate transition-colors hover:text-foreground">
                {crumb.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}

export default async function KnowledgeCatchAllPage({ params }: CatchAllKnowledgePageProps) {
  const { locale, slug } = await params
  const parsed = SupportedLocaleEnum.safeParse(locale)
  const resolvedLocale = parsed.success ? parsed.data : DEFAULT_LOCALE

  const t = await getTranslations({ locale: resolvedLocale, namespace: 'KnowledgeBase' })

  // 1. Check if the path resolves to a specific leaf article
  const article = getArticleByPathSegments(slug, resolvedLocale)
  if (article) {
    const breadcrumbs = buildKnowledgeBreadcrumbs(slug, resolvedLocale, article.title)
    const parentHref = slug.length > 1 ? `/knowledge-base/${slug.slice(0, -1).join('/')}` : '/knowledge-base'

    return (
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <article className="min-w-0 flex-1 rounded-xl border border-border bg-card p-5 shadow-sm sm:p-8">
          <BreadcrumbsNav rootLabel={t('breadcrumbsRoot')} items={breadcrumbs} />

          {article.isFallback ? (
            <Callout variant="info" icon={<Globe className="h-4 w-4" />} className="mb-4 text-xs">
              {t('fallbackNotice', { fallbackLocale: article.locale.toUpperCase() })}
            </Callout>
          ) : null}

          <header className="space-y-3 border-b border-border/70 pb-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="font-mono text-xs">
                {getKnowledgeCategoryLabel(article.category, resolvedLocale)}
              </Badge>
              <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {article.readingTime}
              </span>
              <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {article.publishedAt}
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{article.title}</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">{article.summary}</p>
          </header>

          {/* Quick Recall (TL;DR) Cheat-Sheet Box */}
          {article.tldr.length > 0 ? (
            <div className="my-5 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <div className="mb-2 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-primary">
                <Zap className="h-4 w-4 text-amber-500" />
                <span>{t('tldrTitle')}</span>
              </div>
              <ul className="list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-foreground/90 sm:text-sm">
                {article.tldr.map((point) => (
                  <li key={point}>{renderInlineMarkdown(point, point.slice(0, 24))}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Mobile & Tablet Inline Collapsible Table of Contents (< xl) */}
          <MobileArticleToc items={article.toc} />

          <ArticleMetricsBar slug={article.slug} category={article.category} />

          <MdxArticleRenderer blocks={article.blocks} />

          <div className="mt-8 border-t border-border/70 pt-5">
            <Link
              href={parentHref}
              className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{t('backToAll')}</span>
            </Link>
          </div>
        </article>

        {/* Desktop Sticky Right-Rail Table of Contents (xl+) */}
        <DesktopArticleToc items={article.toc} />
      </div>
    )
  }

  // 2. Otherwise check if the path resolves to a Section / Nested Subtopic folder
  const folder = getFolderByPathSegments(slug, resolvedLocale)
  if (!folder) {
    notFound()
  }

  const breadcrumbs = buildKnowledgeBreadcrumbs(slug, resolvedLocale, folder.label)
  const subFolders = folder.children.filter((c): c is KnowledgeTreeFolderNode => c.type === 'folder')
  const directArticles = folder.children.filter((c): c is KnowledgeTreeArticleNode => c.type === 'article')

  const displayedArticles: KnowledgeTreeArticleNode[] =
    directArticles.length > 0
      ? directArticles
      : (() => {
          const collected: KnowledgeTreeArticleNode[] = []
          const walk = (node: KnowledgeTreeFolderNode) => {
            for (const child of node.children) {
              if (child.type === 'article') {
                collected.push(child)
              } else {
                walk(child)
              }
            }
          }
          walk(folder)
          return collected
        })()

  return (
    <div className="space-y-6 rounded-xl border border-border bg-card p-5 shadow-sm sm:p-8">
      <BreadcrumbsNav rootLabel={t('breadcrumbsRoot')} items={breadcrumbs} />

      <header className="space-y-2 border-b border-border/70 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <FolderOpen className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{folder.label}</h1>
          </div>
          <Badge variant="secondary" className="font-mono text-xs">
            {t('itemsCountBadge', { count: folder.articleCount })}
          </Badge>
        </div>
      </header>

      {subFolders.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('subtopicsHeading')}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {subFolders.map((sub) => (
              <Link key={sub.pathKey} href={`/knowledge-base/${sub.pathKey}`} className="group block">
                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-4 transition-all group-hover:border-primary/50 group-hover:bg-accent/40">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <FolderOpen className="h-4 w-4 shrink-0 text-amber-500" />
                    <span className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
                      {sub.label}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {sub.articleCount}
                    </Badge>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {displayedArticles.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('articlesInSectionHeading')}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {displayedArticles.map(({ article: item }) => (
              <Link key={item.routePath} href={`/knowledge-base/${item.routePath}`} className="group block">
                <Card className="h-full transition-all group-hover:border-primary/50 group-hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {item.readingTime}
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground">{item.publishedAt}</span>
                    </div>
                    <CardTitle className="mt-1.5 text-base leading-snug transition-colors group-hover:text-primary">
                      {item.title}
                    </CardTitle>
                    <CardDescription className="text-xs leading-relaxed">{item.summary}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between border-t border-border/60 pt-3 font-mono text-xs text-primary">
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5" />
                        {t('openArticleCta')}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
