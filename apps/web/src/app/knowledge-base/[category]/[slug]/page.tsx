import { ArticleClientWidgets } from '@/components/knowledge/article-client-widgets';
import { getAllMdxArticles, getMdxArticleBySlug } from '@/lib/mdx-articles';
import { KNOWLEDGE_CATEGORY_LABELS, type KnowledgeCategory } from '@repo/shared-schemas';
import { Badge, Button } from '@repo/ui';
import { ArrowLeft, Clock, FileCode2 } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type * as React from 'react';

export function generateStaticParams(): Array<{ category: string; slug: string }> {
  const articles = getAllMdxArticles();
  return articles.map((article) => ({
    category: article.category,
    slug: article.slug,
  }));
}

function renderMarkdownBlocks(markdown: string): React.JSX.Element[] {
  const blocks = markdown.split(/\n\n+/);
  return blocks.map((block, index) => {
    const trimmed = block.trim();
    const key = `md-block-${index}`;

    if (trimmed.startsWith('## ')) {
      return (
        <h2 key={key} className="mt-8 mb-3 text-xl font-bold tracking-tight text-foreground">
          {trimmed.slice(3)}
        </h2>
      );
    }

    if (trimmed.startsWith('1. ')) {
      const items = trimmed.split('\n').map((line) => line.replace(/^\d+\.\s+/, '').trim());
      return (
        <ol key={key} className="my-4 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          {items.map((item) => (
            <li key={item} className="leading-relaxed">
              {item}
            </li>
          ))}
        </ol>
      );
    }

    return (
      <p key={key} className="my-3 text-sm text-muted-foreground leading-relaxed">
        {trimmed}
      </p>
    );
  });
}

export default async function KnowledgeArticlePage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<React.JSX.Element> {
  const { category, slug } = await params;
  const article = getMdxArticleBySlug(category, slug);

  if (!article) {
    notFound();
  }

  return (
    <article className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/knowledge-base">
            <ArrowLeft className="h-4 w-4" />К списку статей
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {KNOWLEDGE_CATEGORY_LABELS[article.category as KnowledgeCategory] ?? article.category}
          </Badge>
          <Badge variant="outline" className="font-mono">
            <Clock className="h-3 w-3" />
            {article.readTime}
          </Badge>
          <Badge variant="core" className="font-mono">
            <FileCode2 className="h-3 w-3" />
            SSG MDX
          </Badge>
        </div>
      </div>

      <header className="mt-5 space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {article.title}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">{article.summary}</p>
      </header>

      <div className="mt-6">
        <ArticleClientWidgets
          slug={article.slug}
          category={article.category}
          embedGraph={article.embedGraph}
        />
      </div>

      <div className="mt-6 border-t border-border/70 pt-4">
        {renderMarkdownBlocks(article.body)}
      </div>
    </article>
  );
}
