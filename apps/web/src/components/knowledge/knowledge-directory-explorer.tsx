'use client'

import {
  formatKnowledgeSegmentLabel,
  getKnowledgeCategoryLabel,
  getKnowledgeFormatLabel,
  type KnowledgeNoteFormat,
  type SupportedLocale,
} from '@repo/shared-schemas'
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui'
import { ArrowRight, Clock, FolderOpen, Hash, Layers, RotateCcw, Search, Sparkles } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { Link } from '@/i18n/navigation'
import type { KnowledgeTreeFolderNode, MdxArticleFrontmatter } from '@/lib/mdx-content'
import { useUIStore } from '@/store/use-ui-store'

const NOTE_FORMATS: readonly KnowledgeNoteFormat[] = ['cheat-sheet', 'deep-dive', 'adr']

interface KnowledgeDirectoryExplorerProps {
  tree: readonly KnowledgeTreeFolderNode[]
  articles: readonly MdxArticleFrontmatter[]
  tags: ReadonlyArray<{ tag: string; count: number }>
  locale: SupportedLocale
}

export function KnowledgeDirectoryExplorer({ tree, articles, tags, locale }: KnowledgeDirectoryExplorerProps) {
  const t = useTranslations('KnowledgeBase')
  const searchParams = useSearchParams()
  const openCommandPalette = useUIStore((s) => s.openCommandPalette)

  const urlTag = searchParams.get('tag')?.trim().toLowerCase() ?? null
  const [selectedFormat, setSelectedFormat] = useState<KnowledgeNoteFormat | 'ALL'>('ALL')
  const [selectedTag, setSelectedTag] = useState<string | null>(urlTag)

  useEffect(() => {
    setSelectedTag(urlTag)
  }, [urlTag])

  const isFiltering = selectedFormat !== 'ALL' || selectedTag !== null

  const filteredArticles = useMemo(() => {
    if (!isFiltering) return articles
    return articles.filter((article) => {
      if (selectedFormat !== 'ALL' && article.format !== selectedFormat) return false
      if (selectedTag && !article.tags.includes(selectedTag)) return false
      return true
    })
  }, [articles, isFiltering, selectedFormat, selectedTag])

  return (
    <div className="space-y-6">
      {/* Interactive Search Trigger + Format Tabs + #Tag Filter Bar */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Format Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedFormat('ALL')}
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                selectedFormat === 'ALL'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('filterFormatAll')}
            </button>
            {NOTE_FORMATS.map((fmt) => {
              const active = selectedFormat === fmt
              return (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setSelectedFormat(active ? 'ALL' : fmt)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {getKnowledgeFormatLabel(fmt, locale)}
                </button>
              )
            })}
          </div>

          {/* Quick Command Palette Button */}
          <button
            type="button"
            onClick={() => openCommandPalette('')}
            className="inline-flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted hover:text-foreground"
          >
            <span className="flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5 text-primary" />
              <span>{t('sidebarSearchTrigger')}</span>
            </span>
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
          </button>
        </div>

        {/* #Tag Pills */}
        {tags.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-3">
            <span className="mr-1 inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
              <Hash className="h-3 w-3" />
              <span>{t('filterTagsLabel')}</span>
            </span>
            {tags.map(({ tag, count }) => {
              const active = selectedTag === tag
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(active ? null : tag)}
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[11px] transition-colors ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border/80 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  }`}
                >
                  <span>#{tag}</span>
                  <span className="opacity-70">({count})</span>
                </button>
              )
            })}

            {isFiltering ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedFormat('ALL')
                  setSelectedTag(null)
                }}
                className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[11px] text-primary hover:underline"
              >
                <RotateCcw className="h-3 w-3" />
                <span>{t('clearFilters')}</span>
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Filtered Articles View vs Default 3-Tier Topic -> Subtopic -> Articles Directory */}
      {isFiltering ? (
        <section className="space-y-3">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('filteredResultsHeading', { count: filteredArticles.length })}
          </h2>

          {filteredArticles.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              {t('noFilteredResults')}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredArticles.map((article) => {
                const subPath = article.pathSegments
                  .slice(1, -1)
                  .map((seg) => formatKnowledgeSegmentLabel(seg, locale))
                  .join(' / ')

                return (
                  <Link key={article.routePath} href={`/knowledge-base/${article.routePath}`} className="group block">
                    <Card className="flex h-full flex-col justify-between transition-all group-hover:border-primary/50 group-hover:shadow-md">
                      <CardHeader className="pb-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge variant="secondary" className="font-mono text-[10px]">
                              {getKnowledgeCategoryLabel(article.category, locale)}
                            </Badge>
                            {subPath ? (
                              <Badge variant="outline" className="font-mono text-[10px]">
                                {subPath}
                              </Badge>
                            ) : null}
                            <Badge variant="outline" className="font-mono text-[10px] text-primary">
                              {getKnowledgeFormatLabel(article.format, locale)}
                            </Badge>
                          </div>
                          <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {article.readingTime}
                          </span>
                        </div>
                        <CardTitle className="mt-2 text-base leading-snug transition-colors group-hover:text-primary">
                          {article.title}
                        </CardTitle>
                        <CardDescription className="text-xs leading-relaxed">{article.summary}</CardDescription>
                      </CardHeader>

                      <CardContent className="pt-0">
                        {article.tags.length > 0 ? (
                          <div className="mb-3 flex flex-wrap gap-1">
                            {article.tags.map((tag) => (
                              <span
                                key={`${article.routePath}-${tag}`}
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
                            {t('openArticleCta')}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      ) : (
        <div className="space-y-4">
          {tree.map((topic) => {
            const subtopics = topic.children.filter(
              (child): child is KnowledgeTreeFolderNode => child.type === 'folder',
            )
            const isThisProject = topic.segment === 'this-project'

            return (
              <section
                key={topic.pathKey}
                className={`rounded-xl border p-5 shadow-sm transition-colors ${
                  isThisProject ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'
                }`}
              >
                {/* Level 1: Topic Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3.5">
                  <Link
                    href={`/knowledge-base/${topic.pathKey}`}
                    className="group inline-flex items-center gap-2.5 text-lg font-bold tracking-tight text-foreground transition-colors hover:text-primary"
                  >
                    {isThisProject ? (
                      <Sparkles className="h-5 w-5 text-primary" />
                    ) : (
                      <Layers className="h-5 w-5 text-primary" />
                    )}
                    <span>{topic.label}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </Link>

                  <Badge variant="secondary" className="font-mono text-[11px]">
                    {t('subtopicsCountBadge', { subtopics: subtopics.length, articles: topic.articleCount })}
                  </Badge>
                </div>

                {/* Level 2: Clickable Subtopic Tabs/Cards inside the Topic */}
                {subtopics.length > 0 ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {subtopics.map((sub) => (
                      <Link key={sub.pathKey} href={`/knowledge-base/${sub.pathKey}`} className="group block">
                        <div className="flex h-full flex-col justify-between rounded-lg border border-border/80 bg-background/80 p-3.5 transition-all group-hover:border-primary/50 group-hover:bg-accent/40 group-hover:shadow-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground group-hover:text-primary">
                              <FolderOpen className="h-4 w-4 shrink-0 text-primary/80" />
                              <span className="truncate">{sub.label}</span>
                            </span>
                            <Badge variant="outline" className="shrink-0 font-mono text-[10px]">
                              {sub.articleCount}
                            </Badge>
                          </div>

                          {/* Level 3 Preview: Titles of articles inside this subtopic */}
                          <ul className="mt-2.5 space-y-1 border-t border-border/50 pt-2 text-xs text-muted-foreground">
                            {sub.children.slice(0, 3).map((leaf) =>
                              leaf.type === 'article' ? (
                                <li key={leaf.pathKey} className="flex items-center gap-1.5 truncate">
                                  <span className="h-1 w-1 shrink-0 rounded-full bg-primary/60" />
                                  <span className="truncate">{leaf.article.sidebarLabel}</span>
                                </li>
                              ) : null,
                            )}
                          </ul>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : null}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
