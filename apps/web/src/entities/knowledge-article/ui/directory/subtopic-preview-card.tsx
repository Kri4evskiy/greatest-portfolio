'use client'

import { Badge, Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui'
import { FolderOpen, Lock } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { KnowledgeTreeArticleNode, KnowledgeTreeFolderNode } from '@/entities/knowledge-content'
import { buildKnowledgeBasePath } from '@/shared/i18n/app-routes'
import { Link } from '@/shared/i18n/navigation'

const MAX_PREVIEW_NOTES_PER_SUBTOPIC = 3

interface SubtopicPreviewCardProps {
  subtopic: KnowledgeTreeFolderNode
  isLocked: boolean
  onRequestUnlock: (targetHref: string) => void
}

export function SubtopicPreviewCard({ subtopic, isLocked, onRequestUnlock }: SubtopicPreviewCardProps) {
  const t = useTranslations('KnowledgeBase')
  const directNotes = subtopic.children.filter((child): child is KnowledgeTreeArticleNode => child.type === 'article')
  const previewNotes = directNotes.slice(0, MAX_PREVIEW_NOTES_PER_SUBTOPIC)
  const remainingNotesCount = Math.max(0, subtopic.articleCount - previewNotes.length)
  const subHref = buildKnowledgeBasePath(subtopic.pathKey)

  const card = (
    <Link
      href={subHref}
      onClick={(event) => {
        if (isLocked) {
          event.preventDefault()
          onRequestUnlock(subHref)
        }
      }}
      className="group block"
    >
      <div
        className={`flex h-full flex-col justify-between rounded-lg border p-3.5 transition-all ${
          isLocked
            ? 'border-border/60 bg-background/60 opacity-80 group-hover:border-warning/50 group-hover:bg-warning/5 group-hover:opacity-100'
            : 'border-border/80 bg-background/80 group-hover:border-primary/50 group-hover:bg-accent/40 group-hover:shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className={`flex min-w-0 items-center gap-2 text-sm font-semibold ${
              isLocked
                ? 'text-muted-foreground group-hover:text-foreground'
                : 'text-foreground group-hover:text-primary'
            }`}
          >
            {isLocked ? (
              <Lock className="h-3.5 w-3.5 shrink-0 text-warning/80" />
            ) : (
              <FolderOpen className="h-4 w-4 shrink-0 text-primary/80" />
            )}
            <span className="truncate">{subtopic.label}</span>
          </span>
          <Badge variant="outline" className="shrink-0 font-mono text-[10px]">
            {subtopic.articleCount}
          </Badge>
        </div>

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

  if (isLocked) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{card}</TooltipTrigger>
        <TooltipContent side="top">{t('lockedSectionTooltip')}</TooltipContent>
      </Tooltip>
    )
  }

  return card
}
