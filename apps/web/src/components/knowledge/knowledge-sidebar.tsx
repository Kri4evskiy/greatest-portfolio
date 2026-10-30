'use client'

import { KNOWLEDGE_CATEGORY_LABELS, type KnowledgeCategory } from '@repo/shared-schemas'
import { Badge, Button } from '@repo/ui'
import { BookOpen, ChevronRight, FolderGit2, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import type { MdxArticleFrontmatter } from '@/lib/mdx-content'
import { useUIStore } from '@/store/use-ui-store'

export function KnowledgeSidebar({ articles }: { articles: readonly MdxArticleFrontmatter[] }) {
  const t = useTranslations('KnowledgeBase')
  const pathname = usePathname()
  const isSidebarOpen = useUIStore((s) => s.isKbSidebarOpen)
  const toggleSidebar = useUIStore((s) => s.toggleKbSidebar)

  const categories = Object.keys(KNOWLEDGE_CATEGORY_LABELS) as KnowledgeCategory[]

  return (
    <aside className="w-full shrink-0 md:w-72">
      <div className="mb-3 flex items-center justify-between md:hidden">
        <span className="font-mono text-xs font-semibold uppercase text-muted-foreground">{t('sidebarNavTitle')}</span>
        <Button type="button" variant="outline" size="sm" onClick={toggleSidebar} className="h-7">
          {isSidebarOpen ? <PanelLeftClose className="h-3.5 w-3.5" /> : <PanelLeftOpen className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {isSidebarOpen ? (
        <div className="space-y-5 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div>
            <Link
              href="/knowledge-base"
              className={`flex items-center justify-between rounded-md px-2.5 py-2 text-xs font-semibold transition-colors ${
                pathname === '/knowledge-base' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
              }`}
            >
              <span className="flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5" />
                <span>{t('sidebarOverview')}</span>
              </span>
              <Badge variant="outline" className="font-mono text-[10px]">
                {articles.length} MDX
              </Badge>
            </Link>
          </div>

          <div className="space-y-4">
            {categories.map((category) => {
              const categoryArticles = articles.filter((a) => a.category === category)
              return (
                <div key={category} className="space-y-1.5">
                  <div className="flex items-center gap-1.5 px-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <FolderGit2 className="h-3 w-3 text-primary" />
                    <span>{KNOWLEDGE_CATEGORY_LABELS[category]}</span>
                  </div>

                  <div className="space-y-1">
                    {categoryArticles.map((article) => {
                      const href = `/knowledge-base/${article.category}/${article.slug}`
                      const isActive = pathname === href
                      return (
                        <Link
                          key={article.slug}
                          href={href}
                          className={`group flex items-start gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                            isActive
                              ? 'bg-accent font-semibold text-foreground'
                              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                          }`}
                        >
                          <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                          <span className="line-clamp-2 leading-snug">{article.title}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </aside>
  )
}
