import { KnowledgeSidebar } from '@/components/knowledge/knowledge-sidebar';
import { type MdxArticleFrontmatter, getAllMdxArticles } from '@/lib/mdx-articles';
import type * as React from 'react';

export default function KnowledgeBaseLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const allDocs = getAllMdxArticles();

  // Pass only compact frontmatter across RSC -> Client boundary (Vercel server-serialization rule)
  const sidebarItems: MdxArticleFrontmatter[] = allDocs.map((doc) => ({
    slug: doc.slug,
    category: doc.category,
    title: doc.title,
    summary: doc.summary,
    readTime: doc.readTime,
    embedGraph: doc.embedGraph,
  }));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-start">
      <KnowledgeSidebar articles={sidebarItems} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
