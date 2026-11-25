'use client'

import type { KnowledgeNoteFormat, SupportedLocale } from '@repo/shared-schemas'
import { Button } from '@repo/ui'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import type { KnowledgeTreeFolderNode, MdxArticleFrontmatter } from '@/entities/knowledge-content'
import { useCachedAuth } from '@/shared/hooks/use-cached-auth'
import { buildKnowledgeBasePath, isPublicKnowledgeBasePath } from '@/shared/i18n/app-routes'
import { useUIActions } from '@/shared/store/use-ui-store'
import { DirectoryFilterBar } from './directory-filter-bar'
import { FilteredArticleCard } from './filtered-article-card'
import { TopicDirectorySection } from './topic-directory-section'

const INITIAL_VISIBLE_TOPICS = 6
const TOPICS_LOAD_STEP = 6

interface KnowledgeDirectoryExplorerProps {
  tree: readonly KnowledgeTreeFolderNode[]
  articles: readonly MdxArticleFrontmatter[]
  tags: ReadonlyArray<{ tag: string; count: number }>
  locale: SupportedLocale
}

export function KnowledgeDirectoryExplorer({ tree, articles, tags, locale }: KnowledgeDirectoryExplorerProps) {
  const t = useTranslations('KnowledgeBase')
  const searchParams = useSearchParams()
  const { openCommandPalette, openGuestPassModal } = useUIActions()
  const { isUnlocked } = useCachedAuth()

  const urlTag = searchParams.get('tag')?.trim().toLowerCase() ?? null
  const [selectedFormat, setSelectedFormat] = useState<KnowledgeNoteFormat | 'ALL'>('ALL')
  const [selectedTag, setSelectedTag] = useState<string | null>(urlTag)
  const [visibleTopicsCount, setVisibleTopicsCount] = useState(INITIAL_VISIBLE_TOPICS)
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setSelectedTag(urlTag)
  }, [urlTag])

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

  const toggleTopicExpanded = (topicPathKey: string) => {
    setExpandedTopics((prev) => ({ ...prev, [topicPathKey]: !prev[topicPathKey] }))
  }

  return (
    <div className="space-y-6">
      <DirectoryFilterBar
        locale={locale}
        tags={tags}
        selectedFormat={selectedFormat}
        selectedTag={selectedTag}
        isFiltering={isFiltering}
        onSelectFormat={setSelectedFormat}
        onToggleTag={(value) => setSelectedTag((prev) => (prev === value ? null : value))}
        onClearFilters={() => {
          setSelectedFormat('ALL')
          setSelectedTag(null)
        }}
        onOpenSearch={() => openCommandPalette('')}
      />

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
              {filteredArticles.map((article) => (
                <FilteredArticleCard
                  key={article.routePath}
                  article={article}
                  locale={locale}
                  isUnlocked={isUnlocked}
                  onRequestUnlock={openGuestPassModal}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        <div className="space-y-4">
          {visibleTopics.map((topic, index) => {
            const isPublicTopic = isPublicKnowledgeBasePath(buildKnowledgeBasePath(topic.pathKey))
            const prevTopic = index > 0 ? visibleTopics[index - 1] : undefined
            const prevWasPublic = prevTopic
              ? isPublicKnowledgeBasePath(buildKnowledgeBasePath(prevTopic.pathKey))
              : false
            const showProtectedDivider = prevWasPublic && !isPublicTopic

            return (
              <TopicDirectorySection
                key={topic.pathKey}
                topic={topic}
                isUnlocked={isUnlocked}
                isExpanded={expandedTopics[topic.pathKey] ?? false}
                showProtectedDivider={showProtectedDivider}
                onToggleExpand={() => toggleTopicExpanded(topic.pathKey)}
                onRequestUnlock={openGuestPassModal}
              />
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
