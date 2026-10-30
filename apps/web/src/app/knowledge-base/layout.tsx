import { KnowledgeSidebar } from '@/components/knowledge/knowledge-sidebar';
import { getAllKnowledgeArticles } from '@/lib/mdx-content';
import type { ReactNode } from 'react';

export default function KnowledgeBaseLayout({ children }: { children: ReactNode }) {
  const articles = getAllKnowledgeArticles().map((a) => ({
    slug: a.slug,
    category: a.category,
    title: a.title,
    summary: a.summary,
    readingTime: a.readingTime,
    publishedAt: a.publishedAt,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-8 md:flex-row md:items-start">
        <KnowledgeSidebar articles={articles} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
