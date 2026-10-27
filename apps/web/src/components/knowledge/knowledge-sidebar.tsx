'use client';

import type { MdxArticleFrontmatter } from '@/lib/mdx-articles';
import { useUIStore } from '@/store/use-ui-store';
import { KNOWLEDGE_CATEGORY_LABELS, type KnowledgeCategory } from '@repo/shared-schemas';
import { Badge, Button } from '@repo/ui';
import {
  BookOpen,
  ChevronRight,
  FolderTree,
  LayoutGrid,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type * as React from 'react';

const CATEGORY_ORDER: readonly KnowledgeCategory[] = [
  'architecture-devops',
  'react',
  'nestjs-prisma',
  'typescript',
];

export function KnowledgeSidebar({
  articles,
}: {
  articles: readonly MdxArticleFrontmatter[];
}): React.JSX.Element {
  const pathname = usePathname();
  const isSidebarOpen = useUIStore((s) => s.isSidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <aside className="w-full shrink-0 md:w-72">
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <Link
            href="/knowledge-base"
            className="flex items-center gap-2 text-sm font-semibold text-foreground hover:opacity-80"
          >
            <FolderTree className="h-4 w-4 text-emerald-600" />
            <span>Knowledge Tree</span>
          </Link>

          <div className="flex items-center gap-1">
            <Badge variant="outline" className="font-mono text-[10px]">
              {articles.length} MDX
            </Badge>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={toggleSidebar}
              className="h-7 w-7 md:hidden"
              title="Свернуть/развернуть дерево статей"
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="h-3.5 w-3.5" />
              ) : (
                <PanelLeftOpen className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        {isSidebarOpen ? (
          <nav className="mt-3 space-y-4">
            <Link
              href="/knowledge-base"
              className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                pathname === '/knowledge-base'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Все статьи и каталог 15 ADR</span>
            </Link>

            {CATEGORY_ORDER.map((category) => {
              const group = articles.filter((a) => a.category === category);
              if (group.length === 0) return null;

              return (
                <div key={category} className="space-y-1">
                  <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {KNOWLEDGE_CATEGORY_LABELS[category]}
                  </p>
                  <ul className="space-y-0.5">
                    {group.map((article) => {
                      const href = `/knowledge-base/${article.category}/${article.slug}`;
                      const active = pathname === href;
                      return (
                        <li key={article.slug}>
                          <Link
                            href={href}
                            className={`flex items-start gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors ${
                              active
                                ? 'bg-accent font-semibold text-foreground'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                          >
                            <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                            <span className="line-clamp-2 leading-snug">{article.title}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}

            <div className="rounded-lg border border-border/70 bg-muted/40 p-2.5 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
                <span>SSG + MDX Engine</span>
              </div>
              <p className="mt-1 leading-relaxed">
                Новые статьи автоматически добавляются при создании{' '}
                <code className="font-mono">.mdx</code> файла в папке{' '}
                <code className="font-mono">apps/web/content/</code>.
              </p>
            </div>
          </nav>
        ) : null}
      </div>
    </aside>
  );
}
