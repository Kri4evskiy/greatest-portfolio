'use client'

import {
  formatKnowledgeSegmentLabel,
  getKnowledgeCategoryLabel,
  getKnowledgeFormatLabel,
  type KnowledgeNoteFormat,
  type SupportedLocale,
} from '@repo/shared-schemas'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  ToggleGroup,
  ToggleGroupItem,
} from '@repo/ui'
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  FolderOpen,
  Hash,
  Layers,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import type {
  KnowledgeTreeArticleNode,
  KnowledgeTreeFolderNode,
  MdxArticleFrontmatter,
} from '@/entities/knowledge-content'
import { Link } from '@/shared/i18n/navigation'
import { useUIActions } from '@/shared/store/use-ui-store'

const NOTE_FORMATS: readonly KnowledgeNoteFormat[] = ['cheat-sheet', 'deep-dive', 'adr']
const MAX_VISIBLE_TAGS = 10
const INITIAL_VISIBLE_TOPICS = 6
const TOPICS_LOAD_STEP = 6
const MAX_VISIBLE_SUBTOPICS = 6
const MAX_PREVIEW_NOTES_PER_SUBTOPIC = 3

interface TagFilterPillProps {
  tag: string
  count: number
  active: boolean
  onToggle: (tag: string) => void
}

/** Shared #tag pill button rendered in both the collapsed Top-10 bar and searchable drawer. */
function TagFilterPill({ tag, count, active, onToggle }: TagFilterPillProps) {
  return (
    <Button
      type="button"
      variant={active ? 'default' : 'outline'}
      size="sm"
      aria-pressed={active}
      onClick={() => onToggle(tag)}
      className={`h-auto gap-1 rounded-md px-2 py-0.5 font-mono text-[11px] font-normal ${
        active
          ? ''
          : 'border-border/80 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
      }`}
    >
      <span>#{tag}</span>
      <span className="opacity-70">({count})</span>
    </Button>
  )
}

interface KnowledgeDirectoryExplorerProps {
  tree: readonly KnowledgeTreeFolderNode[]
  articles: readonly MdxArticleFrontmatter[]
  tags: ReadonlyArray<{ tag: string; count: number }>
  locale: SupportedLocale
}

export function KnowledgeDirectoryExplorer({ tree, articles, tags, locale }: KnowledgeDirectoryExplorerProps) {
  const t = useTranslations('KnowledgeBase')
  const searchParams = useSearchParams()
  const { openCommandPalette } = useUIActions()

  const urlTag = searchParams.get('tag')?.trim().toLowerCase() ?? null
  const [selectedFormat, setSelectedFormat] = useState<KnowledgeNoteFormat | 'ALL'>('ALL')
  const [selectedTag, setSelectedTag] = useState<string | null>(urlTag)
  const [showAllTags, setShowAllTags] = useState(false)
  const [tagSearchQuery, setTagSearchQuery] = useState('')
  const [visibleTopicsCount, setVisibleTopicsCount] = useState(INITIAL_VISIBLE_TOPICS)
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({})

  const toggleShowAllTags = () => {
    setShowAllTags((prev) => {
      if (prev) setTagSearchQuery('')
      return !prev
    })
  }

  const toggleTopicExpanded = (pathKey: string) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [pathKey]: !(prev[pathKey] ?? false),
    }))
  }

  useEffect(() => {
    setSelectedTag(urlTag)
  }, [urlTag])

  const hiddenTagsCount = Math.max(0, tags.length - MAX_VISIBLE_TAGS)

  const collapsedTags = useMemo(() => {
    const topTags = tags.slice(0, MAX_VISIBLE_TAGS)
    if (!selectedTag || topTags.some((item) => item.tag === selectedTag)) {
      return topTags
    }
    const activeRareTag = tags.find((item) => item.tag === selectedTag)
    return activeRareTag ? [...topTags, activeRareTag] : topTags
  }, [tags, selectedTag])

  const filteredAllTags = useMemo(() => {
    const normalizedQuery = tagSearchQuery.trim().replace(/^#+/, '').toLowerCase()
    if (!normalizedQuery) return tags
    return tags.filter((item) => item.tag.toLowerCase().includes(normalizedQuery))
  }, [tags, tagSearchQuery])

  const isFiltering = selectedFormat !== 'ALL' || selectedTag !== null

  const visibleTopics = useMemo(() => tree.slice(0, visibleTopicsCount), [tree, visibleTopicsCount])
  const remainingTopicsCount = Math.max(0, tree.length - visibleTopics.length)
  const nextTopicsBatchCount = Math.min(TOPICS_LOAD_STEP, remainingTopicsCount)
  const canCollapseTopics = visibleTopics.length > INITIAL_VISIBLE_TOPICS

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
      <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Format Filter Pills */}
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={selectedFormat}
            aria-label={t('filterFormatAll')}
            onValueChange={(nextValue) => {
              if (!nextValue || nextValue === 'ALL') {
                setSelectedFormat('ALL')
                return
              }
              const matched = NOTE_FORMATS.find((fmt) => fmt === nextValue)
              if (matched) {
                setSelectedFormat(matched)
              }
            }}
            className="flex flex-wrap items-center gap-1.5"
          >
            <ToggleGroupItem
              value="ALL"
              className="h-auto rounded-lg bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {t('filterFormatAll')}
            </ToggleGroupItem>
            {NOTE_FORMATS.map((fmt) => (
              <ToggleGroupItem
                key={fmt}
                value={fmt}
                className="h-auto rounded-lg bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {getKnowledgeFormatLabel(fmt, locale)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          {/* Quick Command Palette Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => openCommandPalette('')}
            className="h-auto justify-between gap-3 rounded-lg bg-muted/30 px-3 py-1.5 text-xs font-normal text-muted-foreground hover:border-primary/40 hover:bg-muted hover:text-foreground"
          >
            <span className="flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5 text-primary" />
              <span>{t('sidebarSearchTrigger')}</span>
            </span>
            <kbd className="rounded-sm border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
          </Button>
        </div>

        {/* #Tag Pills */}
        {tags.length > 0 ? (
          <div className="space-y-2.5 border-t border-border/60 pt-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                <Hash className="h-3 w-3" />
                <span>{t('filterTagsLabel')}</span>
              </span>

              {!showAllTags
                ? collapsedTags.map(({ tag, count }) => (
                    <TagFilterPill
                      key={tag}
                      tag={tag}
                      count={count}
                      active={selectedTag === tag}
                      onToggle={(value) => setSelectedTag((prev) => (prev === value ? null : value))}
                    />
                  ))
                : null}

              {hiddenTagsCount > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-expanded={showAllTags}
                  onClick={toggleShowAllTags}
                  className="h-auto gap-1 rounded-md border-dashed border-primary/40 bg-primary/5 px-2 py-0.5 font-mono text-[11px] font-medium text-primary hover:border-primary hover:bg-primary/10 hover:text-primary"
                >
                  {showAllTags ? (
                    <>
                      <span>{t('hideAllTags')}</span>
                      <ChevronUp className="h-3 w-3 text-primary" />
                    </>
                  ) : (
                    <>
                      <span>{t('showAllTags', { count: hiddenTagsCount })}</span>
                      <ChevronDown className="h-3 w-3 text-primary" />
                    </>
                  )}
                </Button>
              ) : null}

              {isFiltering ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFormat('ALL')
                    setSelectedTag(null)
                  }}
                  className="ml-auto h-auto gap-1 rounded-md px-2 py-0.5 font-mono text-[11px] font-normal text-primary hover:bg-transparent hover:text-primary hover:underline"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>{t('clearFilters')}</span>
                </Button>
              ) : null}
            </div>

            {showAllTags && hiddenTagsCount > 0 ? (
              <div className="space-y-2.5 rounded-lg border border-border/70 bg-muted/20 p-3">
                <div className="relative flex items-center">
                  <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="text"
                    value={tagSearchQuery}
                    onChange={(e) => setTagSearchQuery(e.target.value)}
                    placeholder={t('searchTagsPlaceholder')}
                    aria-label={t('searchTagsPlaceholder')}
                    className="h-8 pl-8 pr-8 font-mono text-base sm:text-xs"
                  />
                  {tagSearchQuery.length > 0 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t('clearFilters')}
                      onClick={() => setTagSearchQuery('')}
                      className="absolute right-1 h-6 w-6 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                </div>

                <div className="max-h-48 overflow-y-auto overscroll-contain pr-1">
                  {filteredAllTags.length === 0 ? (
                    <p className="py-2 text-center font-mono text-xs text-muted-foreground">{t('noMatchingTags')}</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {filteredAllTags.map(({ tag, count }) => (
                        <TagFilterPill
                          key={tag}
                          tag={tag}
                          count={count}
                          active={selectedTag === tag}
                          onToggle={(value) => setSelectedTag((prev) => (prev === value ? null : value))}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
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
                      <CardHeader className="p-4 pb-3 @sm:p-5 @sm:pb-3">
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
                        <CardTitle className="mt-2 text-base leading-snug transition-colors group-hover:text-primary @sm:text-lg">
                          {article.title}
                        </CardTitle>
                        <CardDescription className="text-xs leading-relaxed">{article.summary}</CardDescription>
                      </CardHeader>

                      <CardContent className="p-4 pt-0 @sm:px-5 @sm:pb-5 @sm:pt-0">
                        {article.tags.length > 0 ? (
                          <div className="mb-3 flex flex-wrap gap-1">
                            {article.tags.map((tag) => (
                              <span
                                key={`${article.routePath}-${tag}`}
                                className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
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
          {visibleTopics.map((topic) => {
            const subtopics = topic.children.filter(
              (child): child is KnowledgeTreeFolderNode => child.type === 'folder',
            )
            const isThisProject = topic.segment === 'this-project'
            const isTopicExpanded = expandedTopics[topic.pathKey] ?? false
            const hiddenSubtopicsCount = Math.max(0, subtopics.length - MAX_VISIBLE_SUBTOPICS)
            const visibleSubtopics = isTopicExpanded ? subtopics : subtopics.slice(0, MAX_VISIBLE_SUBTOPICS)

            return (
              <section
                key={topic.pathKey}
                className={`rounded-xl border p-5 shadow-xs transition-colors ${
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
                  <>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {visibleSubtopics.map((sub) => {
                        const directNotes = sub.children.filter(
                          (child): child is KnowledgeTreeArticleNode => child.type === 'article',
                        )
                        const previewNotes = directNotes.slice(0, MAX_PREVIEW_NOTES_PER_SUBTOPIC)
                        const remainingNotesCount = Math.max(0, sub.articleCount - previewNotes.length)

                        return (
                          <Link key={sub.pathKey} href={`/knowledge-base/${sub.pathKey}`} className="group block">
                            <div className="flex h-full flex-col justify-between rounded-lg border border-border/80 bg-background/80 p-3.5 transition-all group-hover:border-primary/50 group-hover:bg-accent/40 group-hover:shadow-xs">
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
                              {previewNotes.length > 0 || remainingNotesCount > 0 ? (
                                <ul className="mt-2.5 space-y-1 border-t border-border/50 pt-2 text-xs text-muted-foreground">
                                  {previewNotes.map((leaf) => (
                                    <li key={leaf.pathKey} className="flex items-center gap-1.5 truncate">
                                      <span className="h-1 w-1 shrink-0 rounded-full bg-primary/60" />
                                      <span className="truncate">{leaf.article.sidebarLabel}</span>
                                    </li>
                                  ))}
                                  {remainingNotesCount > 0 ? (
                                    <li className="pl-2.5 font-mono text-[11px] text-primary/80">
                                      {t('moreNotesInSubtopic', { count: remainingNotesCount })}
                                    </li>
                                  ) : null}
                                </ul>
                              ) : null}
                            </div>
                          </Link>
                        )
                      })}
                    </div>

                    {hiddenSubtopicsCount > 0 ? (
                      <div className="mt-3 flex justify-center border-t border-border/50 pt-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          aria-expanded={isTopicExpanded}
                          onClick={() => toggleTopicExpanded(topic.pathKey)}
                          className="h-auto gap-1.5 rounded-lg bg-background/80 px-3 py-1.5 font-mono text-xs font-medium text-muted-foreground hover:border-primary/40 hover:bg-muted/50 hover:text-foreground"
                        >
                          {isTopicExpanded ? (
                            <>
                              <ChevronUp className="h-3.5 w-3.5 text-primary" />
                              <span>{t('showLessSubtopics')}</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3.5 w-3.5 text-primary" />
                              <span>{t('showMoreSubtopics', { count: hiddenSubtopicsCount })}</span>
                            </>
                          )}
                        </Button>
                      </div>
                    ) : null}
                  </>
                ) : null}
              </section>
            )
          })}

          {tree.length > INITIAL_VISIBLE_TOPICS ? (
            <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/20 px-4 py-3 sm:flex-row">
              <span className="font-mono text-xs text-muted-foreground">
                {t('shownTopicsProgress', { shown: visibleTopics.length, total: tree.length })}
              </span>

              <div className="flex flex-wrap items-center gap-2">
                {remainingTopicsCount > 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setVisibleTopicsCount((prev) => Math.min(tree.length, prev + TOPICS_LOAD_STEP))}
                    className="h-auto gap-1.5 rounded-lg border-primary/40 bg-primary/10 px-3.5 py-1.5 font-mono text-xs font-medium text-primary hover:border-primary hover:bg-primary/15 hover:text-primary"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                    <span>{t('showMoreTopics', { count: nextTopicsBatchCount })}</span>
                  </Button>
                ) : null}

                {canCollapseTopics ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setVisibleTopicsCount(INITIAL_VISIBLE_TOPICS)}
                    className="h-auto gap-1.5 rounded-lg bg-background px-3 py-1.5 font-mono text-xs font-medium text-muted-foreground hover:border-primary/40 hover:bg-muted/50 hover:text-foreground"
                  >
                    <ChevronUp className="h-3.5 w-3.5 text-primary" />
                    <span>{t('showLessTopics')}</span>
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
