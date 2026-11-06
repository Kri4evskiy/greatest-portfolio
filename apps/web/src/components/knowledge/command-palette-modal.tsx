'use client'

import { getKnowledgeFormatLabel, type SupportedLocale } from '@repo/shared-schemas'
import { Badge } from '@repo/ui'
import { ArrowRight, BookOpen, Cpu, FileText, Hash, Home, Lock, Search, Sparkles, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSectionNavigation } from '@/hooks/use-section-navigation'
import { useVisitorProfile } from '@/hooks/use-visitor-profile'
import { useRouter } from '@/i18n/navigation'
import { trackEvent } from '@/lib/analytics'
import type { KnowledgeSearchItem } from '@/lib/mdx-content'
import { useUIStore } from '@/store/use-ui-store'

interface CommandPaletteModalProps {
  items: readonly KnowledgeSearchItem[]
  topTags: ReadonlyArray<{ tag: string; count: number }>
  locale: SupportedLocale
}

type PaletteEntry =
  | {
      kind: 'quick-action'
      id: string
      label: string
      actionType: 'cv-home' | 'tech-radar' | 'kb-overview'
    }
  | {
      kind: 'article'
      id: string
      item: KnowledgeSearchItem
      matchedHeading?: { id: string; text: string } | undefined
    }

export function CommandPaletteModal({ items, topTags, locale }: CommandPaletteModalProps) {
  const t = useTranslations('KnowledgeBase')
  const router = useRouter()
  const { scrollToSection } = useSectionNavigation()
  const { data: profile } = useVisitorProfile()

  const isOpen = useUIStore((s) => s.isCommandPaletteOpen)
  const initialQuery = useUIStore((s) => s.commandPaletteInitialQuery)
  const openPalette = useUIStore((s) => s.openCommandPalette)
  const closePalette = useUIStore((s) => s.closeCommandPalette)
  const openGuestPassModal = useUIStore((s) => s.openGuestPassModal)

  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const isUnlocked = profile?.role === 'USER' || profile?.role === 'ADMIN'

  // Sync query when opened with a pre-filled tag or query
  useEffect(() => {
    if (!isOpen) return
    setQuery(initialQuery)
    setActiveIndex(0)
    const timer = window.setTimeout(() => {
      inputRef.current?.focus()
    }, 20)
    return () => window.clearTimeout(timer)
  }, [isOpen, initialQuery])

  // Global Cmd+K / Ctrl+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        if (isOpen) {
          closePalette()
        } else {
          openPalette('')
        }
      } else if (event.key === 'Escape' && isOpen) {
        event.preventDefault()
        closePalette()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, openPalette, closePalette])

  // Prevent background scrolling while open
  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  const quickActions = useMemo<PaletteEntry[]>(
    () => [
      { kind: 'quick-action', id: 'qa-kb', label: t('cmdActionKbOverview'), actionType: 'kb-overview' },
      { kind: 'quick-action', id: 'qa-radar', label: t('cmdActionTechRadar'), actionType: 'tech-radar' },
      { kind: 'quick-action', id: 'qa-cv', label: t('cmdActionCvHome'), actionType: 'cv-home' },
    ],
    [t],
  )

  const filteredEntries = useMemo<PaletteEntry[]>(() => {
    const trimmed = query.trim().toLowerCase()
    if (!trimmed) {
      return [...quickActions, ...items.map((item): PaletteEntry => ({ kind: 'article', id: item.routePath, item }))]
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
  }, [items, query, quickActions])

  const safeActiveIndex = filteredEntries.length === 0 ? 0 : Math.min(activeIndex, filteredEntries.length - 1)

  const updateQuery = useCallback((nextQuery: string) => {
    setQuery(nextQuery)
    setActiveIndex(0)
  }, [])

  const executeEntry = useCallback(
    (entry: PaletteEntry) => {
      closePalette()

      if (entry.kind === 'quick-action') {
        if (entry.actionType === 'cv-home') {
          router.push('/')
          return
        }
        if (entry.actionType === 'tech-radar') {
          scrollToSection('tech-radar')
          return
        }
        if (entry.actionType === 'kb-overview') {
          if (isUnlocked) {
            router.push('/knowledge-base')
          } else {
            openGuestPassModal('/knowledge-base')
          }
          return
        }
      }

      if (entry.kind === 'article') {
        const hashSuffix = entry.matchedHeading ? `#${entry.matchedHeading.id}` : ''
        const targetHref = `/knowledge-base/${entry.item.routePath}${hashSuffix}`
        trackEvent('command_palette_article_selected', {
          routePath: entry.item.routePath,
          query: query.trim(),
        })

        if (isUnlocked) {
          router.push(targetHref)
        } else {
          openGuestPassModal(`/knowledge-base/${entry.item.routePath}`)
        }
      }
    },
    [closePalette, isUnlocked, openGuestPassModal, query, router, scrollToSection],
  )

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredEntries.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((safeActiveIndex + 1) % filteredEntries.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((safeActiveIndex - 1 + filteredEntries.length) % filteredEntries.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const selected = filteredEntries[safeActiveIndex]
      if (selected) {
        executeEntry(selected)
      }
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Global Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-3 pt-14 backdrop-blur-xs sm:px-4 sm:pt-20"
      onClick={(e) => {
        if (e.target === e.currentTarget) closePalette()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') closePalette()
      }}
    >
      <div className="flex max-h-[80dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        {/* Search Input Header */}
        <div className="flex items-center gap-2.5 border-b border-border px-3.5 py-3 sm:px-4">
          <Search className="h-4 w-4 shrink-0 text-primary" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => updateQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={t('cmdPlaceholder')}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden"
          />
          {query ? (
            <button
              type="button"
              onClick={() => updateQuery('')}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={closePalette}
            className="rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground hover:text-foreground"
          >
            ESC
          </button>
        </div>

        {/* Quick #Tag Chips */}
        {topTags.length > 0 ? (
          <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border/60 bg-muted/20 px-3.5 py-2 sm:px-4">
            <Hash className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            {topTags.slice(0, 10).map(({ tag }) => {
              const tagQuery = `#${tag}`
              const isSelectedTag = query.trim().toLowerCase() === tagQuery
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => updateQuery(isSelectedTag ? '' : tagQuery)}
                  className={`shrink-0 rounded-md border px-2 py-0.5 font-mono text-[11px] transition-colors ${
                    isSelectedTag
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border/80 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  }`}
                >
                  #{tag}
                </button>
              )
            })}
          </div>
        ) : null}

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-2.5">
          {filteredEntries.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground sm:text-sm">{t('cmdEmpty')}</div>
          ) : (
            <div className="space-y-1">
              {filteredEntries.map((entry, idx) => {
                const isSelected = idx === safeActiveIndex
                const prevEntry = idx > 0 ? filteredEntries[idx - 1] : undefined
                const showSectionHeader = !prevEntry || prevEntry.kind !== entry.kind

                return (
                  <div key={entry.id}>
                    {showSectionHeader ? (
                      <div className="px-2.5 pt-2 pb-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {entry.kind === 'quick-action' ? t('cmdQuickActionsHeading') : t('cmdArticlesHeading')}
                      </div>
                    ) : null}

                    {entry.kind === 'quick-action' ? (
                      <button
                        type="button"
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => executeEntry(entry)}
                        className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors sm:text-sm ${
                          isSelected ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-muted/60'
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-2.5 truncate">
                          {entry.actionType === 'cv-home' ? (
                            <Home className="h-4 w-4 shrink-0 text-primary" />
                          ) : entry.actionType === 'tech-radar' ? (
                            <Cpu className="h-4 w-4 shrink-0 text-primary" />
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
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => executeEntry(entry)}
                        className={`flex w-full flex-col gap-1 rounded-lg px-3 py-2.5 text-left transition-colors ${
                          isSelected ? 'bg-primary/10' : 'hover:bg-muted/60'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                            {entry.item.category === 'this-project' ? (
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
                            {!isUnlocked ? (
                              <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 font-mono text-[10px] text-amber-600 dark:text-amber-400">
                                <Lock className="h-2.5 w-2.5" />
                                {t('cmdLockedBadge')}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div
                          className={`text-xs font-semibold leading-snug sm:text-sm ${
                            isSelected ? 'text-primary' : 'text-foreground'
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
                                className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
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
        <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2 font-mono text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>{t('cmdHintNavigate')}</span>
            <span>{t('cmdHintOpen')}</span>
            <span>{t('cmdHintClose')}</span>
          </div>
          <span>Ctrl+K / ⌘K</span>
        </div>
      </div>
    </div>
  )
}
