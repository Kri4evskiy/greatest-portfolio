import { DEFAULT_LOCALE, KNOWLEDGE_CATEGORY_LABELS, SUPPORTED_LOCALES, SupportedLocaleEnum } from '@repo/shared-schemas'
import { Badge, Callout } from '@repo/ui'
import { ArrowLeft, Calendar, Clock, Globe } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ArticleMetricsBar } from '@/components/knowledge/article-metrics-bar'
import { MdxArticleRenderer } from '@/components/knowledge/mdx-article-renderer'
import { Link } from '@/i18n/navigation'
import { getAllKnowledgeArticles, getArticleByCategoryAndSlug } from '@/lib/mdx-content'

interface ArticlePageProps {
  params: Promise<{
    locale: string
    category: string
    slug: string
  }>
}

export function generateStaticParams() {
  const articles = getAllKnowledgeArticles(DEFAULT_LOCALE)
  return SUPPORTED_LOCALES.flatMap((locale) =>
    articles.map((article) => ({
      locale,
      category: article.category,
      slug: article.slug,
    })),
  )
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { locale, category, slug } = await params
  const parsed = SupportedLocaleEnum.safeParse(locale)
  const resolvedLocale = parsed.success ? parsed.data : DEFAULT_LOCALE

  const article = getArticleByCategoryAndSlug(category, slug, resolvedLocale)
  if (!article) {
    return {
      title: 'Article Not Found | Knowledge Base',
    }
  }
  return {
    title: `${article.title} | Engineering Knowledge Base`,
    description: article.summary,
  }
}

export default async function KnowledgeArticlePage({ params }: ArticlePageProps) {
  const { locale, category, slug } = await params
  const parsed = SupportedLocaleEnum.safeParse(locale)
  const resolvedLocale = parsed.success ? parsed.data : DEFAULT_LOCALE
  setRequestLocale(resolvedLocale)

  const t = await getTranslations({ locale: resolvedLocale, namespace: 'KnowledgeBase' })
  const article = getArticleByCategoryAndSlug(category, slug, resolvedLocale)

  if (!article) {
    notFound()
  }

  return (
    <article className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="mb-4">
        <Link
          href="/knowledge-base"
          className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{t('backToAll')}</span>
        </Link>
      </div>

      {article.isFallback ? (
        <Callout variant="info" icon={<Globe className="h-4 w-4" />} className="mb-4 text-xs">
          {t('fallbackNotice', { fallbackLocale: article.locale.toUpperCase() })}
        </Callout>
      ) : null}

      <header className="space-y-3 border-b border-border/70 pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="font-mono text-xs">
            {KNOWLEDGE_CATEGORY_LABELS[article.category]}
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
        <p className="text-sm text-muted-foreground leading-relaxed">{article.summary}</p>
      </header>

      <ArticleMetricsBar slug={article.slug} category={article.category} />

      <MdxArticleRenderer blocks={article.blocks} />
    </article>
  )
}
