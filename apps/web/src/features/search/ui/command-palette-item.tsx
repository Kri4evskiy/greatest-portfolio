'use client'

import { getKnowledgeFormatLabel, type SupportedLocale } from '@repo/shared-schemas'
import { Badge } from '@repo/ui'
import { Activity, ArrowRight, BookOpen, Compass, Cpu, FileDown, FileText, Home, Lock, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { buildKnowledgeBasePath, isPublicKnowledgeBasePath } from '@/shared/i18n/app-routes'
import type { ArticlePaletteEntry, PaletteSection, QuickActionPaletteEntry } from '../lib/filter-command-entries'

export function PaletteSectionHeader({ section }: { section: PaletteSection }) {
  const t = useTranslations('KnowledgeBase')

  if (section === 'protected-articles') {
    return (
      <div className="mt-2 border-t border-border/70 px-2.5 pt-2.5 pb-1">
        <div className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Lock className="h-3 w-3 shrink-0 text-warning" />
          <span>{t('lockedSectionDivider')}</span>
        </div>
      </div>
    )
  }

  const headingLabel =
    section === 'quick-actions'
      ? t('cmdQuickActionsHeading')
      : section === 'public-articles'
        ? t('cmdPublicArticlesHeading')
        : t('cmdArticlesHeading')

  return (
    <div className="px-2.5 pt-2 pb-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {headingLabel}
    </div>
  )
}

export function QuickActionPaletteRow({
  entry,
  index,
  isSelected,
  onHover,
  onSelect,
}: {
  entry: QuickActionPaletteEntry
  index: number
  isSelected: boolean
  onHover: () => void
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      data-palette-index={index}
      onMouseEnter={onHover}
      onClick={onSelect}
      className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors sm:text-sm ${
        isSelected ? 'bg-primary/10 font-medium text-primary' : 'text-foreground hover:bg-muted/60'
      }`}
    >
      <span className="flex min-w-0 items-center gap-2.5 truncate">
        {entry.actionType === 'cv-home' ? (
          <Home className="h-4 w-4 shrink-0 text-primary" />
        ) : entry.actionType === 'cv-pdf' ? (
          <FileDown className="h-4 w-4 shrink-0 text-primary" />
        ) : entry.actionType === 'system-status' ? (
          <Activity className="h-4 w-4 shrink-0 text-primary" />
        ) : entry.actionType === 'tech-radar' ? (
          <Cpu className="h-4 w-4 shrink-0 text-primary" />
        ) : entry.actionType === 'roadmap' ? (
          <Compass className="h-4 w-4 shrink-0 text-primary" />
        ) : (
          <BookOpen className="h-4 w-4 shrink-0 text-primary" />
        )}
        <span className="truncate">{entry.label}</span>
      </span>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
    </button>
  )
}

export function ArticlePaletteRow({
  entry,
  index,
  locale,
  isSelected,
  isUnlocked,
  onHover,
  onSelect,
}: {
  entry: ArticlePaletteEntry
  index: number
  locale: SupportedLocale
  isSelected: boolean
  isUnlocked: boolean
  onHover: () => void
  onSelect: () => void
}) {
  const t = useTranslations('KnowledgeBase')
  const isLockedArticle = !isUnlocked && !isPublicKnowledgeBasePath(buildKnowledgeBasePath(entry.item.routePath))

  return (
    <button
      type="button"
      data-palette-index={index}
      onMouseEnter={onHover}
      onClick={onSelect}
      className={`flex w-full flex-col gap-1 rounded-lg px-3 py-2.5 text-left transition-colors ${
        isSelected
          ? isLockedArticle
            ? 'bg-warning/10'
            : 'bg-primary/10'
          : isLockedArticle
            ? 'opacity-85 hover:bg-warning/5 hover:opacity-100'
            : 'hover:bg-muted/60'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
          {isLockedArticle ? (
            <Lock className="h-3 w-3 shrink-0 text-warning" />
          ) : entry.item.category === 'this-project' ? (
            <Sparkles className="h-3 w-3 shrink-0 text-primary" />
          ) : (
            <FileText className="h-3 w-3 shrink-0 text-primary" />
          )}
          <span className="truncate">
            {entry.item.topicLabel}
            {entry.item.subtopicLabel ? ` / ${entry.item.subtopicLabel}` : ''}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Badge variant="outline" className="px-1.5 py-0 font-mono text-[10px]">
            {getKnowledgeFormatLabel(entry.item.format, locale)}
          </Badge>
          {isLockedArticle ? (
            <span className="inline-flex items-center gap-1 rounded-sm bg-warning/15 px-1.5 py-0.5 font-mono text-[10px] text-warning">
              <Lock className="h-2.5 w-2.5" />
              {t('cmdLockedBadge')}
            </span>
          ) : null}
        </div>
      </div>

      <div
        className={`text-xs font-semibold leading-snug sm:text-sm ${
          isSelected
            ? isLockedArticle
              ? 'text-warning'
              : 'text-primary'
            : isLockedArticle
              ? 'text-foreground/85'
              : 'text-foreground'
        }`}
      >
        {entry.item.title}
      </div>

      {entry.matchedHeading ? (
        <div className="inline-flex items-center gap-1 font-mono text-[11px] text-primary">
          <span>↳ {t('cmdHeadingsMatch')}</span>
          <span className="truncate underline underline-offset-2">{entry.matchedHeading.text}</span>
        </div>
      ) : (
        <p className="line-clamp-1 text-xs text-muted-foreground">{entry.item.summary}</p>
      )}

      {entry.item.tags.length > 0 ? (
        <div className="mt-0.5 flex flex-wrap gap-1">
          {entry.item.tags.slice(0, 4).map((tag) => (
            <span
              key={`${entry.id}-${tag}`}
              className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
            >
              #{tag}
            </span>
          ))}
        </div>
      ) : null}
    </button>
  )
}
