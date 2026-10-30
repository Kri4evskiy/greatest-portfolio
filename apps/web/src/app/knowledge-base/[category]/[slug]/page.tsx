import { KNOWLEDGE_CATEGORY_LABELS } from '@repo/shared-schemas'
import { Badge } from '@repo/ui'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArticleMetricsBar } from '@/components/knowledge/article-metrics-bar'
import { MdxArticleRenderer } from '@/components/knowledge/mdx-article-renderer'
import { getAllKnowledgeArticles, getArticleByCategoryAndSlug } from '@/lib/mdx-content'

interface ArticlePageProps {
  params: Promise<{
    category: string
    slug: string
  }>
}

export function generateStaticParams() {
  const articles = getAllKnowledgeArticles()
  return articles.map((article) => ({
    category: article.category,
    slug: article.slug,
  }))
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { category, slug } = await params
  const article = getArticleByCategoryAndSlug(category, slug)
  if (!article) {
    return {
      title: 'Статья не найдена | Knowledge Base',
    }
  }
  return {
    title: `${article.title} | Engineering Knowledge Base`,
    description: article.summary,
  }
}

export default async function KnowledgeArticlePage({ params }: ArticlePageProps) {
  const { category, slug } = await params
  const article = getArticleByCategoryAndSlug(category, slug)

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
          <span>Назад ко всем статьям Базы Знаний</span>
        </Link>
      </div>

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
