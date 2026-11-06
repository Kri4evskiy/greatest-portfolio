import {
  DEFAULT_LOCALE,
  getKnowledgeCategoryLabel,
  getKnowledgeFormatLabel,
  SUPPORTED_LOCALES,
  type SupportedLocale,
  SupportedLocaleEnum,
} from '@repo/shared-schemas'
import { Badge, Callout, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui'
import { ArrowRight, Calendar, ChevronRight, Clock, FolderOpen, Globe, Sparkles, Zap } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ArticleFooterNav } from '@/components/knowledge/article-footer-nav'
import { ArticleMetricsBar } from '@/components/knowledge/article-metrics-bar'
import { DesktopArticleToc, MobileArticleToc } from '@/components/knowledge/article-toc'
import { MdxArticleRenderer, renderInlineMarkdown } from '@/components/knowledge/mdx-article-renderer'
import { TopicSubtopicTabs } from '@/components/knowledge/topic-subtopic-tabs'
import { Link } from '@/i18n/navigation'
import {
  buildKnowledgeBreadcrumbs,
  getAdjacentAndRelatedArticles,
  getAllStaticKnowledgeSlugArrays,
  getArticleByPathSegments,
  getFolderByPathSegments,
  type KnowledgeBreadcrumbItem,
  type KnowledgeTreeArticleNode,
  type KnowledgeTreeFolderNode,
  type MdxArticleFrontmatter,
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
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1
        return (
          <span key={item.href} className="inline-flex items-center gap-1">
            <ChevronRight className="h-3 w-3 opacity-60" />
            {isLast ? (
              <span className="font-semibold text-foreground">{item.label}</span>
            ) : (
              <Link href={item.href} className="transition-colors hover:text-foreground">
                {item.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}

function collectFolderArticles(node: KnowledgeTreeFolderNode): MdxArticleFrontmatter[] {
  const out: MdxArticleFrontmatter[] = []
  for (const child of node.children) {
    if (child.type === 'article') {
      out.push(child.article)
    } else {
      out.push(...collectFolderArticles(child))
    }
  }
  return out
}

function ArticlePreviewCard({
  item,
  locale,
  openLabel,
}: {
  item: MdxArticleFrontmatter
  locale: SupportedLocale
  openLabel: string
}) {
  return (
    <Link href={`/knowledge-base/${item.routePath}`} className="group block h-full">
      <Card className="flex h-full flex-col justify-between transition-all group-hover:border-primary/50 group-hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="outline" className="font-mono text-[10px] text-primary">
              {getKnowledgeFormatLabel(item.format, locale)}
            </Badge>
            <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              {item.readingTime}
            </span>
          </div>
          <CardTitle className="mt-1.5 text-base leading-snug transition-colors group-hover:text-primary">
            {item.title}
          </CardTitle>
          <CardDescription className="text-xs leading-relaxed">{item.summary}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {item.tags.length > 0 ? (
            <div className="mb-3 flex flex-wrap gap-1">
              {item.tags.slice(0, 4).map((tag) => (
                <span
                  key={`${item.routePath}-${tag}`}
                  className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}

          <div className="flex items-center justify-between border-t border-border/60 pt-3 font-mono text-xs text-primary">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              {openLabel}
            </span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default async function KnowledgeCatchAllPage({ params }: CatchAllKnowledgePageProps) {
  const { locale, slug } = await params
  const parsed = SupportedLocaleEnum.safeParse(locale)
  const resolvedLocale = parsed.success ? parsed.data : DEFAULT_LOCALE
  const t = await getTranslations({ locale: resolvedLocale, namespace: 'KnowledgeBase' })

  // 1. Level 3+: Clean, Distraction-Free Leaf Article View (Breadcrumbs + Format + #Tags + Prev/Next)
  const article = getArticleByPathSegments(slug, resolvedLocale)
  if (article) {
    const breadcrumbs = buildKnowledgeBreadcrumbs(slug, resolvedLocale, article.sidebarLabel)
    const parentSegments = slug.slice(0, -1)
    const parentHref = parentSegments.length > 0 ? `/knowledge-base/${parentSegments.join('/')}` : '/knowledge-base'
    const { prev, next, related } = getAdjacentAndRelatedArticles(article.routePath, resolvedLocale)

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
              <Badge variant="outline" className="font-mono text-xs text-primary">
                {getKnowledgeFormatLabel(article.format, resolvedLocale)}
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

            {article.tags.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {article.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/knowledge-base?tag=${encodeURIComponent(tag)}`}
                    className="rounded-md border border-border/80 bg-muted/40 px-2 py-0.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            ) : null}
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

          <ArticleFooterNav
            prev={prev}
            next={next}
            related={related}
            locale={resolvedLocale}
            prevLabel={t('prevArticleLabel')}
            nextLabel={t('nextArticleLabel')}
            relatedHeading={t('relatedNotesHeading')}
            backHref={parentHref}
            backLabel={t('backToAll')}
          />
        </article>

        {/* Desktop Sticky Right-Rail Table of Contents (xl+) */}
        <DesktopArticleToc items={article.toc} />
      </div>
    )
  }

  // 2. Level 1 (Topic Hub, e.g. /knowledge-base/react) or Level 2+ (Subtopic View, e.g. /knowledge-base/react/compiler)
  const folder = getFolderByPathSegments(slug, resolvedLocale)
  if (!folder) {
    notFound()
  }

  const rootSegment = slug[0]
  const rootTopic = rootSegment ? getFolderByPathSegments([rootSegment], resolvedLocale) : null
  const isRootTopic = slug.length === 1
  const activeSubtopicSegment = slug.length >= 2 ? (slug[1] ?? null) : null
  const breadcrumbs = buildKnowledgeBreadcrumbs(slug, resolvedLocale, folder.label)
  const subFolders = folder.children.filter((c): c is KnowledgeTreeFolderNode => c.type === 'folder')
  const directArticles = folder.children.filter((c): c is KnowledgeTreeArticleNode => c.type === 'article')

  return (
    <div className="space-y-5">
      {/* Topic + Subtopic Tabs Header on Hub Pages */}
      {rootTopic ? (
        <TopicSubtopicTabs
          rootTopic={rootTopic}
          activeSubtopicSegment={activeSubtopicSegment}
          topicBadgeLabel={t('topicBadge')}
          allSubtopicsLabel={t('allSubtopicsTab')}
        />
      ) : null}

      <div className="space-y-6 rounded-xl border border-border bg-card p-5 shadow-sm sm:p-7">
        <BreadcrumbsNav rootLabel={t('breadcrumbsRoot')} items={breadcrumbs} />

        {/* When viewing a specific Subtopic (Level 2+), show clear Subtopic header */}
        {!isRootTopic ? (
          <header className="space-y-2 border-b border-border/70 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider">
                  {t('subtopicBadge')}
                </Badge>
                <FolderOpen className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{folder.label}</h1>
              </div>
              <Badge variant="secondary" className="font-mono text-xs">
                {t('itemsCountBadge', { count: folder.articleCount })}
              </Badge>
            </div>
          </header>
        ) : null}

        {/* Level 1 Topic View: Group articles cleanly under each Subtopic */}
        {isRootTopic && subFolders.length > 0 ? (
          <div className="space-y-7">
            {subFolders.map((sub) => {
              const subArticles = collectFolderArticles(sub)
              return (
                <section key={sub.pathKey} className="space-y-3">
                  <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
                    <Link
                      href={`/knowledge-base/${sub.pathKey}`}
                      className="group inline-flex items-center gap-2 text-base font-semibold text-foreground transition-colors hover:text-primary"
                    >
                      <FolderOpen className="h-4 w-4 text-primary" />
                      <span>{sub.label}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </Link>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {t('itemsCountBadge', { count: sub.articleCount })}
                    </Badge>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {subArticles.map((item) => (
                      <ArticlePreviewCard
                        key={item.routePath}
                        item={item}
                        locale={resolvedLocale}
                        openLabel={t('openArticleCta')}
                      />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        ) : null}

        {/* Nested Subfolders inside a deeper level */}
        {!isRootTopic && subFolders.length > 0 ? (
          <section className="space-y-3">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('subtopicsHeading')}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {subFolders.map((sub) => (
                <Link key={sub.pathKey} href={`/knowledge-base/${sub.pathKey}`} className="group block">
                  <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-4 transition-all group-hover:border-primary/50 group-hover:bg-accent/40">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
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

        {/* Direct articles inside the selected Subtopic */}
        {directArticles.length > 0 ? (
          <section className="space-y-3">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('articlesInSectionHeading')}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {directArticles.map(({ article: item }) => (
                <ArticlePreviewCard
                  key={item.routePath}
                  item={item}
                  locale={resolvedLocale}
                  openLabel={t('openArticleCta')}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}
