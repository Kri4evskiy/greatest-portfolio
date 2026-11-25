'use client'

import type { SupportedLocale } from '@repo/shared-schemas'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui'
import { BookOpen, ChevronsDownUp, ChevronsUpDown, Lock, Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { KnowledgeTreeFolderNode } from '@/entities/knowledge-content'
import { prefetchKnowledgeSearchIndex } from '@/features/search/search-index-client'
import { APP_ROUTES, isRouteActive } from '@/shared/i18n/app-routes'
import { Link } from '@/shared/i18n/navigation'
import { KnowledgeTreeItem } from './knowledge-tree-item'

interface KnowledgeSidebarPanelProps {
  locale: SupportedLocale
  pathname: string
  totalArticles: number
  publicRoots: readonly KnowledgeTreeFolderNode[]
  protectedRoots: readonly KnowledgeTreeFolderNode[]
  isUnlocked: boolean
  hasAnyExpanded: boolean
  closeOnSelect: boolean
  scrollable?: boolean
  onToggleAll: () => void
  onOpenSearch: () => void
  onSelectLeaf: () => void
  onRequestUnlock: (targetHref: string) => void
}

export function KnowledgeSidebarPanel({
  locale,
  pathname,
  totalArticles,
  publicRoots,
  protectedRoots,
  isUnlocked,
  hasAnyExpanded,
  closeOnSelect,
  scrollable = false,
  onToggleAll,
  onOpenSearch,
  onSelectLeaf,
  onRequestUnlock,
}: KnowledgeSidebarPanelProps) {
  const t = useTranslations('KnowledgeBase')
  const toggleAllLabel = hasAnyExpanded ? t('collapseAllTree') : t('expandAllTree')
  const lockedTooltip = t('lockedSectionTooltip')
  const isOverviewActive = isRouteActive(pathname, APP_ROUTES.knowledgeBase)

  const toggleAllButton = (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      aria-label={toggleAllLabel}
      onClick={onToggleAll}
      className="h-7 w-7 shrink-0 border-border/60 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      {hasAnyExpanded ? <ChevronsDownUp className="h-3.5 w-3.5" /> : <ChevronsUpDown className="h-3.5 w-3.5" />}
    </Button>
  )

  return (
    <div
      className={`flex flex-col rounded-xl border border-border bg-card shadow-xs ${
        scrollable ? 'max-h-[calc(100dvh-6rem)] overflow-hidden' : ''
      }`}
    >
      {/* Pinned Top Controls: Search trigger + Overview + Expand/Collapse */}
      <div className="shrink-0 space-y-2.5 border-b border-border/60 p-3 pb-2.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onMouseEnter={() => prefetchKnowledgeSearchIndex(locale)}
          onFocus={() => prefetchKnowledgeSearchIndex(locale)}
          onClick={onOpenSearch}
          className="h-auto w-full justify-between gap-2 rounded-lg border-border/80 bg-muted/30 px-2.5 py-1.5 text-left text-xs font-normal text-muted-foreground hover:border-primary/40 hover:bg-muted hover:text-foreground"
        >
          <span className="flex min-w-0 items-center gap-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="truncate">{t('sidebarSearchTrigger')}</span>
          </span>
          <kbd className="shrink-0 rounded-sm border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">
            ⌘K
          </kbd>
        </Button>

        <div className="flex items-center gap-1">
          <Link
            href={APP_ROUTES.knowledgeBase}
            onClick={() => {
              if (closeOnSelect) onSelectLeaf()
            }}
            className={`flex min-w-0 flex-1 items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              isOverviewActive ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
            }`}
          >
            <span className="flex min-w-0 items-center gap-2">
              <BookOpen className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{t('sidebarOverview')}</span>
            </span>
            <span
              className={`ml-2 shrink-0 rounded-sm px-1.5 py-0.5 font-mono text-[10px] ${
                isOverviewActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              {totalArticles}
            </span>
          </Link>

          {closeOnSelect ? (
            toggleAllButton
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>{toggleAllButton}</TooltipTrigger>
              <TooltipContent side="right">{toggleAllLabel}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Scrollable Tree with Reserved Gutter — prevents horizontal layout shift when expanding branches */}
      <nav
        aria-label={t('sidebarNavTitle')}
        className={`space-y-1 p-3 pt-2.5 pr-1 ${
          scrollable ? 'min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-gutter-stable' : ''
        }`}
      >
        {publicRoots.map((rootNode) => (
          <KnowledgeTreeItem
            key={rootNode.pathKey}
            node={rootNode}
            depth={0}
            pathname={pathname}
            closeOnSelect={closeOnSelect}
            isUnlocked={isUnlocked}
            lockedTooltip={lockedTooltip}
            onSelectLeaf={onSelectLeaf}
            onRequestUnlock={onRequestUnlock}
          />
        ))}

        {protectedRoots.length > 0 ? (
          <div className="mt-2.5 border-t border-border/70 pt-2.5">
            {!isUnlocked ? (
              <button
                type="button"
                onClick={() => onRequestUnlock(APP_ROUTES.knowledgeBase)}
                className="mb-1.5 flex w-full items-center justify-between gap-1.5 rounded-md border border-dashed border-warning/40 bg-warning/5 px-2 py-1 text-left font-mono text-[10px] font-medium text-warning transition-colors hover:border-warning/70 hover:bg-warning/10"
              >
                <span className="flex min-w-0 items-center gap-1.5 truncate">
                  <Lock className="h-3 w-3 shrink-0" />
                  <span className="truncate">{t('lockedSectionDivider')}</span>
                </span>
              </button>
            ) : null}

            <div className="space-y-1">
              {protectedRoots.map((rootNode) => (
                <KnowledgeTreeItem
                  key={rootNode.pathKey}
                  node={rootNode}
                  depth={0}
                  pathname={pathname}
                  closeOnSelect={closeOnSelect}
                  isUnlocked={isUnlocked}
                  lockedTooltip={lockedTooltip}
                  onSelectLeaf={onSelectLeaf}
                  onRequestUnlock={onRequestUnlock}
                />
              ))}
            </div>
          </div>
        ) : null}
      </nav>
    </div>
  )
}
