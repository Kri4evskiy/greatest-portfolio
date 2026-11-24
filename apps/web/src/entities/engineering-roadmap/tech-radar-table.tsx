'use client'

import type { TechCategory, TechRadarItem } from '@repo/shared-schemas'
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  ToggleGroup,
  ToggleGroupItem,
} from '@repo/ui'
import { BookOpenCheck, Compass, Layers, Search, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo } from 'react'
import { trackEvent } from '@/shared/lib/analytics'
import {
  useSelectedAdrItem,
  useTechRadarCategoryFilter,
  useTechRadarSearch,
  useUIActions,
} from '@/shared/store/use-ui-store'
import { createTechRadarColumns } from './table/tech-radar-columns'
import { DesktopTechRadarDataTable } from './table/tech-radar-data-table'

const CATEGORIES: ReadonlyArray<TechCategory | 'ALL'> = [
  'ALL',
  'Frontend',
  'Backend',
  'Database & Storage',
  'DevOps & DX',
  'Architecture',
]

export function TechRadarTable({ items: localizedItems }: { items: readonly TechRadarItem[] }) {
  const t = useTranslations('TechRadar')

  const categoryFilter = useTechRadarCategoryFilter()
  const searchQuery = useTechRadarSearch()
  const selectedAdrItem = useSelectedAdrItem()
  const {
    setTechRadarCategoryFilter: setCategoryFilter,
    setTechRadarSearch: setSearchQuery,
    openAdrInspector,
    closeAdrInspector,
  } = useUIActions()

  const activeDialogItem = selectedAdrItem
    ? (localizedItems.find((item) => item.id === selectedAdrItem.id) ?? selectedAdrItem)
    : null

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const filteredData = useMemo(
    () =>
      localizedItems.filter((item) => {
        const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter
        if (!matchesCategory) return false
        if (!normalizedQuery) return true
        return (
          item.name.toLowerCase().includes(normalizedQuery) ||
          item.summary.toLowerCase().includes(normalizedQuery) ||
          item.category.toLowerCase().includes(normalizedQuery)
        )
      }),
    [categoryFilter, localizedItems, normalizedQuery],
  )

  const handleInspectAdr = useCallback(
    (item: TechRadarItem) => {
      openAdrInspector(item)
      trackEvent('adr_popover_inspected', {
        adrNumber: item.adrNumber,
        name: item.name,
      })
    },
    [openAdrInspector],
  )

  const columns = useMemo(
    () =>
      createTechRadarColumns({
        onInspectAdr: handleInspectAdr,
        labels: {
          colTech: t('colTech'),
          colDomain: t('colDomain'),
          colStatus: t('colStatus'),
          colExp: t('colExp'),
          inspectBtn: t('inspectBtn'),
          formatYears: (years) => t('yearsSuffix', { years }),
        },
      }),
    [handleInspectAdr, t],
  )

  return (
    <section id="tech-radar" className="scroll-mt-20 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">{t('title')}</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Badge variant="outline" className="w-fit font-mono text-xs">
          {t('shownCount', { filtered: filteredData.length, total: localizedItems.length })}
        </Badge>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={categoryFilter}
          aria-label={t('colDomain')}
          onValueChange={(nextValue) => {
            const matched = CATEGORIES.find((cat) => cat === nextValue)
            if (matched) {
              setCategoryFilter(matched)
            }
          }}
          className="-mx-1 flex flex-nowrap gap-1.5 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0"
        >
          {CATEGORIES.map((category) => (
            <ToggleGroupItem
              key={category}
              value={category}
              className="h-auto shrink-0 border-transparent bg-muted/60 px-2.5 py-1 font-mono text-xs font-normal text-muted-foreground hover:bg-muted hover:text-foreground data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:font-medium data-[state=on]:text-primary-foreground"
            >
              {category === 'ALL' ? t('allDomains') : category}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="h-8 pl-8 text-base sm:text-xs"
          />
        </div>
      </div>

      {/* Mobile Card View (< md) — Zero horizontal table scroll */}
      <div className="grid gap-3 md:hidden">
        {filteredData.length > 0 ? (
          filteredData.map((item) => {
            const levelVariant = item.level === 'Core' ? 'success' : item.level === 'Production' ? 'default' : 'warning'
            return (
              <div key={item.id} className="rounded-lg border border-border bg-card p-3.5 shadow-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-semibold text-muted-foreground">
                      #{String(item.adrNumber).padStart(2, '0')}
                    </span>
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {item.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={levelVariant} className="font-mono text-[10px]">
                      {item.level}
                    </Badge>
                    <span className="font-mono text-[11px] font-medium text-muted-foreground">
                      {t('yearsSuffix', { years: item.experienceYears })}
                    </span>
                  </div>
                </div>

                <div className="mt-2 font-semibold text-sm text-foreground">{item.name}</div>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{item.summary}</p>

                <div className="mt-3 border-t border-border/60 pt-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleInspectAdr(item)}
                    className="h-8 w-full justify-center gap-1.5 font-mono text-xs"
                  >
                    <BookOpenCheck className="h-3.5 w-3.5" />
                    <span>{t('inspectBtn')}</span>
                  </Button>
                </div>
              </div>
            )
          })
        ) : (
          <div className="rounded-lg border border-border bg-card py-8 text-center text-sm text-muted-foreground">
            {t('emptyResult')}
          </div>
        )}
      </div>

      {/* Desktop Data Table View (>= md) */}
      <DesktopTechRadarDataTable data={filteredData} columns={columns} emptyResultLabel={t('emptyResult')} />

      <Dialog
        open={activeDialogItem !== null}
        onOpenChange={(open) => {
          if (!open) closeAdrInspector()
        }}
      >
        <DialogContent className="max-h-[88dvh] w-[calc(100vw-1.5rem)] overflow-y-auto p-4 sm:max-w-xl sm:p-6">
          {activeDialogItem ? (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    ADR-{String(activeDialogItem.adrNumber).padStart(2, '0')}
                  </Badge>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {activeDialogItem.category}
                  </Badge>
                  <Badge variant="success" className="font-mono text-xs">
                    {t('dialogExpBadge', {
                      years: activeDialogItem.experienceYears,
                      level: activeDialogItem.level,
                    })}
                  </Badge>
                </div>
                <DialogTitle className="mt-2 text-xl">{activeDialogItem.name}</DialogTitle>
                <DialogDescription>{activeDialogItem.summary}</DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2 text-sm">
                <div className="rounded-lg border border-border bg-muted/30 p-3.5">
                  <div className="mb-1 flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{t('whyHeading')}</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{activeDialogItem.adrWhy}</p>
                </div>

                <div className="rounded-lg border border-border bg-muted/30 p-3.5">
                  <div className="mb-1 flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-primary">
                    <Layers className="h-3.5 w-3.5" />
                    <span>{t('whereHeading')}</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{activeDialogItem.adrWhere}</p>
                </div>

                <div className="rounded-lg border border-border bg-muted/30 p-3.5">
                  <div className="mb-1 flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-primary">
                    <BookOpenCheck className="h-3.5 w-3.5" />
                    <span>{t('howHeading')}</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{activeDialogItem.adrHow}</p>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  )
}
