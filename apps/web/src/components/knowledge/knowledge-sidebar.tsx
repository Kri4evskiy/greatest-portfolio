'use client'

import { KNOWLEDGE_CATEGORY_LABELS, type KnowledgeCategory } from '@repo/shared-schemas'
import { Badge } from '@repo/ui'
import { BookOpen, ChevronDown, ChevronRight, FolderGit2, PanelLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Link, usePathname } from '@/i18n/navigation'
import type { MdxArticleFrontmatter } from '@/lib/mdx-content'

export function KnowledgeSidebar({ articles }: { articles: readonly MdxArticleFrontmatter[] }) {
  const t = useTranslations('KnowledgeBase')
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const categories = Object.keys(KNOWLEDGE_CATEGORY_LABELS) as KnowledgeCategory[]

  const renderTreeContent = (closeOnSelect: boolean) => (
    <div className="space-y-5 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div>
        <Link
          href="/knowledge-base"
          onClick={() => {
            if (closeOnSelect) setIsMobileOpen(false)
          }}
          className={`flex items-center justify-between rounded-md px-2.5 py-2 text-xs font-semibold transition-colors ${
            pathname === '/knowledge-base' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
          }`}
        >
          <span className="flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5 shrink-0" />
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
                <FolderGit2 className="h-3 w-3 shrink-0 text-primary" />
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
                      onClick={() => {
                        if (closeOnSelect) setIsMobileOpen(false)
                      }}
                      className={`group flex items-start gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                        isActive
                          ? 'bg-accent font-semibold text-foreground'
                          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                      }`}
                    >
                      <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5" />
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
  )

  return (
    <aside className="w-full shrink-0 md:sticky md:top-20 md:w-72">
      {/* Mobile collapsible navigation trigger — closed by default so article content starts immediately */}
      <div className="md:hidden">
        <button
          type="button"
          aria-expanded={isMobileOpen}
          onClick={() => setIsMobileOpen((prev) => !prev)}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-3.5 py-2.5 text-left text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-accent/50"
        >
          <span className="flex items-center gap-2 font-mono uppercase tracking-wider text-muted-foreground">
            <PanelLeft className="h-3.5 w-3.5 text-primary" />
            <span>{t('sidebarNavTitle')}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Badge variant="secondary" className="font-mono text-[10px]">
              {articles.length} MDX
            </Badge>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${isMobileOpen ? 'rotate-180' : ''}`}
            />
          </span>
        </button>

        {isMobileOpen ? <div className="mt-2">{renderTreeContent(true)}</div> : null}
      </div>

      {/* Desktop sticky sidebar rail (>= md) */}
      <div className="hidden md:block">{renderTreeContent(false)}</div>
    </aside>
  )
}
