'use client'

import { Badge, Button, Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui'
import { ArrowRight, ChevronDown, ChevronUp, Layers, Lock, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { KnowledgeTreeFolderNode } from '@/entities/knowledge-content'
import { APP_ROUTES, buildKnowledgeBasePath, isPublicKnowledgeBasePath } from '@/shared/i18n/app-routes'
import { Link } from '@/shared/i18n/navigation'
import { SubtopicPreviewCard } from './subtopic-preview-card'

const MAX_VISIBLE_SUBTOPICS = 6

interface TopicDirectorySectionProps {
  topic: KnowledgeTreeFolderNode
  isUnlocked: boolean
  isExpanded: boolean
  showProtectedDivider: boolean
  onToggleExpand: () => void
  onRequestUnlock: (targetHref: string) => void
}

export function TopicDirectorySection({
  topic,
  isUnlocked,
  isExpanded,
  showProtectedDivider,
  onToggleExpand,
  onRequestUnlock,
}: TopicDirectorySectionProps) {
  const t = useTranslations('KnowledgeBase')
  const subtopics = topic.children.filter((child): child is KnowledgeTreeFolderNode => child.type === 'folder')
  const topicHref = buildKnowledgeBasePath(topic.pathKey)
  const isPublicTopic = isPublicKnowledgeBasePath(topicHref)
  const isLockedTopic = !isUnlocked && !isPublicTopic
  const isThisProject = topic.segment === 'this-project'
  const hiddenSubtopicsCount = Math.max(0, subtopics.length - MAX_VISIBLE_SUBTOPICS)
  const visibleSubtopics = isExpanded ? subtopics : subtopics.slice(0, MAX_VISIBLE_SUBTOPICS)

  const topicHeadingLink = (
    <Link
      href={topicHref}
      onClick={(event) => {
        if (isLockedTopic) {
          event.preventDefault()
          onRequestUnlock(topicHref)
        }
      }}
      className={`group inline-flex items-center gap-2.5 text-lg font-bold tracking-tight transition-colors ${
        isLockedTopic ? 'text-muted-foreground hover:text-foreground' : 'text-foreground hover:text-primary'
      }`}
    >
      {isLockedTopic ? (
        <Lock className="h-4.5 w-4.5 text-warning" />
      ) : isThisProject ? (
        <Sparkles className="h-5 w-5 text-primary" />
      ) : (
        <Layers className="h-5 w-5 text-primary" />
      )}
      <span>{topic.label}</span>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
    </Link>
  )

  return (
    <div className="space-y-4">
      {showProtectedDivider ? (
        <div className="flex items-center gap-3 pt-2">
          <div className="h-px flex-1 bg-border/80" />
          {!isUnlocked ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onRequestUnlock(APP_ROUTES.knowledgeBase)}
              className="h-auto gap-1.5 rounded-full border-dashed border-warning/50 bg-warning/10 px-3 py-1 font-mono text-[11px] font-medium text-warning hover:border-warning hover:bg-warning/15 hover:text-warning"
            >
              <Lock className="h-3 w-3" />
              <span>{t('lockedSectionDivider')}</span>
            </Button>
          ) : (
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              {t('sidebarNavTitle')}
            </span>
          )}
          <div className="h-px flex-1 bg-border/80" />
        </div>
      ) : null}

      <section
        className={`rounded-xl border p-5 shadow-xs transition-colors ${
          isThisProject
            ? 'border-primary/40 bg-primary/5'
            : isLockedTopic
              ? 'border-dashed border-border/80 bg-muted/20'
              : 'border-border bg-card'
        }`}
      >
        {/* Level 1: Topic Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3.5">
          {isLockedTopic ? (
            <Tooltip>
              <TooltipTrigger asChild>{topicHeadingLink}</TooltipTrigger>
              <TooltipContent side="top">{t('lockedSectionTooltip')}</TooltipContent>
            </Tooltip>
          ) : (
            topicHeadingLink
          )}

          <div className="flex flex-wrap items-center gap-2">
            {isLockedTopic ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onRequestUnlock(topicHref)}
                className="h-7 gap-1.5 border-warning/40 bg-warning/10 px-2.5 font-mono text-[11px] text-warning hover:border-warning hover:bg-warning/15 hover:text-warning"
              >
                <Lock className="h-3 w-3" />
                <span>{t('unlockInPlaceCta')}</span>
              </Button>
            ) : null}
            <Badge variant="secondary" className="font-mono text-[11px]">
              {t('subtopicsCountBadge', { subtopics: subtopics.length, articles: topic.articleCount })}
            </Badge>
          </div>
        </div>

        {/* Level 2: Clickable Subtopic Cards inside the Topic */}
        {subtopics.length > 0 ? (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visibleSubtopics.map((sub) => (
                <SubtopicPreviewCard
                  key={sub.pathKey}
                  subtopic={sub}
                  isLocked={isLockedTopic}
                  onRequestUnlock={onRequestUnlock}
                />
              ))}
            </div>

            {hiddenSubtopicsCount > 0 ? (
              <div className="mt-3 flex justify-center border-t border-border/50 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-expanded={isExpanded}
                  onClick={onToggleExpand}
                  className="h-auto gap-1.5 rounded-lg bg-background/80 px-3 py-1.5 font-mono text-xs font-medium text-muted-foreground hover:border-primary/40 hover:bg-muted/50 hover:text-foreground"
                >
                  {isExpanded ? (
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
    </div>
  )
}
