'use client'

import { getKnowledgeFormatLabel, type SupportedLocale } from '@repo/shared-schemas'
import { Badge, Button, Dialog, DialogContent, DialogDescription, DialogTitle } from '@repo/ui'
import {
  Activity,
  ArrowRight,
  BookOpen,
  Compass,
  Cpu,
  FileDown,
  FileText,
  Hash,
  Home,
  Loader2,
  Lock,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { KnowledgeSearchItem } from '@/entities/knowledge-content'
import { useVisitorProfile } from '@/features/auth/queries/use-visitor-profile'
import { useSectionNavigation } from '@/shared/hooks/use-section-navigation'
import { APP_ROUTES, buildKnowledgeBasePath, isPublicKnowledgeBasePath } from '@/shared/i18n/app-routes'
import { useRouter } from '@/shared/i18n/navigation'
import { trackEvent } from '@/shared/lib/analytics'
import { useCommandPaletteInitialQuery, useIsCommandPaletteOpen, useUIActions } from '@/shared/store/use-ui-store'
import {
  getCachedKnowledgeSearchIndex,
  type KnowledgeSearchPayload,
  loadKnowledgeSearchIndex,
} from './search-index-client'

interface CommandPaletteModalProps {
  locale: SupportedLocale
}

type PaletteSection = 'quick-actions' | 'articles' | 'public-articles' | 'protected-articles'

type PaletteEntry =
  | {
      kind: 'quick-action'
      section: 'quick-actions'
      id: string
      label: string
      actionType: 'cv-home' | 'cv-pdf' | 'system-status' | 'tech-radar' | 'roadmap' | 'kb-overview'
    }
  | {
      kind: 'article'
      section: Exclude<PaletteSection, 'quick-actions'>
      id: string
      item: KnowledgeSearchItem
      matchedHeading?: { id: string; text: string } | undefined
    }

export function CommandPaletteModal({ locale }: CommandPaletteModalProps) {
  const t = useTranslations('KnowledgeBase')
  const router = useRouter()
  const { scrollToSection } = useSectionNavigation()
  const { data: profile } = useVisitorProfile()

  const isOpen = useIsCommandPaletteOpen()
  const initialQuery = useCommandPaletteInitialQuery()
  const { closeCommandPalette: closePalette, openGuestPassModal } = useUIActions()

  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [indexState, setIndexState] = useState<{
    locale: SupportedLocale
    payload: KnowledgeSearchPayload
  } | null>(() => {
    const cached = getCachedKnowledgeSearchIndex(locale)
    return cached ? { locale, payload: cached } : null
  })
  const inputRef = useRef<HTMLInputElement | null>(null)
  const listContainerRef = useRef<HTMLDivElement | null>(null)
  const shouldScrollActiveRef = useRef(false)

  // Match payload strictly against active locale to prevent stale-locale flashes & missing spinner
  const indexPayload = indexState?.locale === locale ? indexState.payload : null
  const items = indexPayload?.items ?? []
  const topTags = indexPayload?.topTags ?? []
  const isLoadingIndex = isOpen && indexPayload === null

  const isUnlocked = profile?.role === 'USER' || profile?.role === 'ADMIN'

  // Lazy-fetch static search index on first palette open (0 KB in initial page HTML)
  useEffect(() => {
    const cached = getCachedKnowledgeSearchIndex(locale)
    if (cached) {
      setIndexState({ locale, payload: cached })
      return
    }
    if (!isOpen) return

    let active = true
    void loadKnowledgeSearchIndex(locale).then((payload) => {
      if (active) {
        setIndexState({ locale, payload })
      }
    })
    return () => {
      active = false
    }
  }, [isOpen, locale])

  // Sync query when opened with a pre-filled tag or query
  useEffect(() => {
    if (!isOpen) return
    setQuery(initialQuery)
    setActiveIndex(0)
  }, [isOpen, initialQuery])

  const quickActions = useMemo<PaletteEntry[]>(
    () => [
      {
        kind: 'quick-action',
        section: 'quick-actions',
        id: 'qa-cv-pdf',
        label: t('cmdActionCvPdf'),
        actionType: 'cv-pdf',
      },
      {
        kind: 'quick-action',
        section: 'quick-actions',
        id: 'qa-system-status',
        label: t('cmdActionSystemStatus'),
        actionType: 'system-status',
      },
      {
        kind: 'quick-action',
        section: 'quick-actions',
        id: 'qa-kb',
        label: t('cmdActionKbOverview'),
        actionType: 'kb-overview',
      },
      {
        kind: 'quick-action',
        section: 'quick-actions',
        id: 'qa-radar',
        label: t('cmdActionTechRadar'),
        actionType: 'tech-radar',
      },
      {
        kind: 'quick-action',
        section: 'quick-actions',
        id: 'qa-roadmap',
        label: t('cmdActionRoadmap'),
        actionType: 'roadmap',
      },
      {
        kind: 'quick-action',
        section: 'quick-actions',
        id: 'qa-cv',
        label: t('cmdActionCvHome'),
        actionType: 'cv-home',
      },
    ],
    [t],
  )

  const filteredEntries = useMemo<PaletteEntry[]>(() => {
    const trimmed = query.trim().toLowerCase()
    if (!trimmed) {
      if (isUnlocked) {
        return [
          ...quickActions,
          ...items.map((item): PaletteEntry => ({ kind: 'article', section: 'articles', id: item.routePath, item })),
        ]
      }

      const publicEntries: PaletteEntry[] = []
      const protectedEntries: PaletteEntry[] = []
      for (const item of items) {
        const isPublic = isPublicKnowledgeBasePath(buildKnowledgeBasePath(item.routePath))
        if (isPublic) {
          publicEntries.push({ kind: 'article', section: 'public-articles', id: item.routePath, item })
        } else {
          protectedEntries.push({ kind: 'article', section: 'protected-articles', id: item.routePath, item })
        }
      }
      return [...quickActions, ...publicEntries, ...protectedEntries]
    }

    const isTagSearch = trimmed.startsWith('#')
    const needle = isTagSearch ? trimmed.slice(1) : trimmed

    const matchedArticles: Array<{ entry: PaletteEntry; score: number }> = []

    for (const item of items) {
      let score = 0
      let matchedHeading: { id: string; text: string } | undefined

      if (isTagSearch) {
        for (const tag of item.tags) {
          if (tag === needle) score += 20
          else if (tag.includes(needle)) score += 10
        }
      } else {
        if (item.title.toLowerCase().includes(needle)) score += 15
        if (item.sidebarLabel.toLowerCase().includes(needle)) score += 12
        if (item.topicLabel.toLowerCase().includes(needle)) score += 8
        if (item.subtopicLabel.toLowerCase().includes(needle)) score += 10
        if (item.summary.toLowerCase().includes(needle)) score += 5
        for (const tag of item.tags) {
          if (tag.includes(needle)) score += 9
        }
        for (const heading of item.headings) {
          if (heading.text.toLowerCase().includes(needle)) {
            score += 8
            if (!matchedHeading) {
              matchedHeading = heading
            }
          }
        }
      }

      if (score > 0) {
        matchedArticles.push({
          score,
          entry: {
            kind: 'article',
            section: 'articles',
            id: item.routePath,
            item,
            matchedHeading,
          },
        })
      }
    }

    matchedArticles.sort((a, b) => b.score - a.score)

    const matchedActions = isTagSearch
      ? []
      : quickActions.filter((qa) => qa.kind === 'quick-action' && qa.label.toLowerCase().includes(needle))

    return [...matchedActions, ...matchedArticles.map((m) => m.entry)]
  }, [isUnlocked, items, query, quickActions])

  const safeActiveIndex = filteredEntries.length === 0 ? 0 : Math.min(activeIndex, filteredEntries.length - 1)
  const activeEntry = filteredEntries[safeActiveIndex]
  const isActiveEntryLocked =
    activeEntry?.kind === 'article' &&
    !isUnlocked &&
    !isPublicKnowledgeBasePath(buildKnowledgeBasePath(activeEntry.item.routePath))

  // Keep keyboard navigation focus-in-view without disturbing mouse hover
  useEffect(() => {
    if (!isOpen || !shouldScrollActiveRef.current) return
    shouldScrollActiveRef.current = false
    const activeEl = listContainerRef.current?.querySelector<HTMLElement>(`[data-palette-index="${safeActiveIndex}"]`)
    activeEl?.scrollIntoView({ block: 'nearest' })
  }, [safeActiveIndex, isOpen])

  const updateQuery = useCallback((nextQuery: string) => {
    setQuery(nextQuery)
    setActiveIndex(0)
  }, [])

  const executeEntry = useCallback(
    (entry: PaletteEntry) => {
      closePalette()

      if (entry.kind === 'quick-action') {
        if (entry.actionType === 'cv-home') {
          router.push(APP_ROUTES.home)
          return
        }
        if (entry.actionType === 'cv-pdf') {
          router.push(APP_ROUTES.cv)
          return
        }
        if (entry.actionType === 'system-status') {
          router.push(APP_ROUTES.systemStatus)
          return
        }
        if (entry.actionType === 'tech-radar') {
          scrollToSection('tech-radar')
          return
        }
        if (entry.actionType === 'roadmap') {
          scrollToSection('roadmap')
          return
        }
        if (entry.actionType === 'kb-overview') {
          router.push(APP_ROUTES.knowledgeBase)
          return
        }
      }

      if (entry.kind === 'article') {
        const baseArticlePath = buildKnowledgeBasePath(entry.item.routePath)
        const hashSuffix = entry.matchedHeading ? `#${entry.matchedHeading.id}` : ''
        const targetHref = `${baseArticlePath}${hashSuffix}`
        trackEvent('command_palette_article_selected', {
          routePath: entry.item.routePath,
          query: query.trim(),
        })

        if (isUnlocked || isPublicKnowledgeBasePath(baseArticlePath)) {
          router.push(targetHref)
        } else {
          openGuestPassModal(baseArticlePath)
        }
      }
    },
    [closePalette, isUnlocked, openGuestPassModal, query, router, scrollToSection],
  )

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredEntries.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      shouldScrollActiveRef.current = true
      setActiveIndex((safeActiveIndex + 1) % filteredEntries.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      shouldScrollActiveRef.current = true
      setActiveIndex((safeActiveIndex - 1 + filteredEntries.length) % filteredEntries.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const selected = filteredEntries[safeActiveIndex]
      if (selected) {
        executeEntry(selected)
      }
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closePalette()
      }}
    >
      <DialogContent
        hideCloseButton
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          inputRef.current?.focus()
        }}
        className="top-[10dvh] flex max-h-[80dvh] w-[calc(100%-1.5rem)] max-w-2xl translate-y-0 flex-col gap-0 overflow-hidden rounded-2xl border-border bg-card p-0 shadow-2xl sm:top-[12dvh]"
      >
        <DialogTitle className="sr-only">{t('cmdPlaceholder')}</DialogTitle>
        <DialogDescription className="sr-only">{t('cmdHintNavigate')}</DialogDescription>

        {/* Search Input Header */}
        <div className="flex shrink-0 items-center gap-2.5 border-b border-border px-3.5 py-3 sm:px-4">
          {isLoadingIndex ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
          ) : (
            <Search className="h-4 w-4 shrink-0 text-primary" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => updateQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={t('cmdPlaceholder')}
            className="min-w-0 flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-hidden sm:text-sm"
          />
          {query ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => updateQuery('')}
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={closePalette}
            className="h-6 bg-muted/60 px-1.5 font-mono text-[10px] text-muted-foreground hover:text-foreground"
          >
            ESC
          </Button>
        </div>

        {/* Quick #Tag Chips */}
        {topTags.length > 0 ? (
          <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-border/60 bg-muted/20 px-3.5 py-2.5 sm:px-4">
            <Hash className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            {topTags.slice(0, 10).map(({ tag }) => {
              const tagQuery = `#${tag}`
              const isSelectedTag = query.trim().toLowerCase() === tagQuery
              return (
                <Button
                  key={tag}
                  type="button"
                  variant={isSelectedTag ? 'default' : 'outline'}
                  size="sm"
                  aria-pressed={isSelectedTag}
                  onClick={() => updateQuery(isSelectedTag ? '' : tagQuery)}
                  className={`h-6 shrink-0 rounded-md px-2 font-mono text-[11px] font-normal ${
                    isSelectedTag
                      ? ''
                      : 'border-border/80 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  }`}
                >
                  #{tag}
                </Button>
              )
            })}
          </div>
        ) : null}

        {/* Guest 1-Click Unlock Banner */}
        {!isUnlocked ? (
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-warning/25 bg-warning/5 px-3.5 py-2 sm:px-4">
            <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5 shrink-0 text-warning" />
              <span className="truncate">{t('cmdGuestUnlockBanner')}</span>
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                closePalette()
                openGuestPassModal(APP_ROUTES.knowledgeBase)
              }}
              className="h-6 shrink-0 gap-1 border-warning/40 bg-background px-2 font-mono text-[10px] text-warning hover:bg-warning/10 hover:text-warning"
            >
              <Lock className="h-2.5 w-2.5" />
              <span>{t('unlockInPlaceCta')}</span>
            </Button>
          </div>
        ) : null}

        {/* Results List */}
        <div ref={listContainerRef} className="min-h-0 flex-1 overflow-y-auto p-2 sm:p-2.5">
          {filteredEntries.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground sm:text-sm">{t('cmdEmpty')}</div>
          ) : (
            <div className="space-y-1">
              {filteredEntries.map((entry, idx) => {
                const isSelected = idx === safeActiveIndex
                const prevEntry = idx > 0 ? filteredEntries[idx - 1] : undefined
                const showSectionHeader = !prevEntry || prevEntry.section !== entry.section
                const isLockedArticle =
                  entry.kind === 'article' &&
                  !isUnlocked &&
                  !isPublicKnowledgeBasePath(buildKnowledgeBasePath(entry.item.routePath))

                return (
                  <div key={entry.id}>
                    {showSectionHeader ? (
                      entry.section === 'protected-articles' ? (
                        <div className="mt-2 border-t border-border/70 px-2.5 pt-2.5 pb-1">
                          <div className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            <Lock className="h-3 w-3 shrink-0 text-warning" />
                            <span>{t('lockedSectionDivider')}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="px-2.5 pt-2 pb-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {entry.section === 'quick-actions'
                            ? t('cmdQuickActionsHeading')
                            : entry.section === 'public-articles'
                              ? t('cmdPublicArticlesHeading')
                              : t('cmdArticlesHeading')}
                        </div>
                      )
                    ) : null}

                    {entry.kind === 'quick-action' ? (
                      <button
                        type="button"
                        data-palette-index={idx}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => executeEntry(entry)}
                        className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors sm:text-sm ${
                          isSelected ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-muted/60'
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
                    ) : (
                      <button
                        type="button"
                        data-palette-index={idx}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => executeEntry(entry)}
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
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Keyboard Hints Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-border bg-muted/30 px-4 py-2 font-mono text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>{t('cmdHintNavigate')}</span>
            <span className={isActiveEntryLocked ? 'text-warning' : undefined}>
              {isActiveEntryLocked ? t('cmdHintUnlock') : t('cmdHintOpen')}
            </span>
            <span>{t('cmdHintClose')}</span>
          </div>
          <span>Ctrl+K / ⌘K</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
