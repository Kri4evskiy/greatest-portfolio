'use client'

import { getTechRadarItems, type SupportedLocale, type TechCategory, type TechRadarItem } from '@repo/shared-schemas'
import { Badge, Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input } from '@repo/ui'
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowUpDown, BookOpenCheck, Compass, Layers, Search, Sparkles } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { trackEvent } from '@/lib/analytics'
import { useUIStore } from '@/store/use-ui-store'

const CATEGORIES: ReadonlyArray<TechCategory | 'ALL'> = [
  'ALL',
  'Frontend',
  'Backend',
  'Database & Storage',
  'DevOps & DX',
  'Architecture',
]

export function TechRadarTable() {
  const locale = useLocale() as SupportedLocale
  const t = useTranslations('TechRadar')
  const localizedItems = useMemo(() => getTechRadarItems(locale), [locale])

  const categoryFilter = useUIStore((s) => s.techRadarCategoryFilter)
  const searchQuery = useUIStore((s) => s.techRadarSearch)
  const selectedAdrItem = useUIStore((s) => s.selectedAdrItem)
  const setCategoryFilter = useUIStore((s) => s.setTechRadarCategoryFilter)
  const setSearchQuery = useUIStore((s) => s.setTechRadarSearch)
  const openAdrInspector = useUIStore((s) => s.openAdrInspector)
  const closeAdrInspector = useUIStore((s) => s.closeAdrInspector)

  const [sorting, setSorting] = useState<SortingState>([{ id: 'adrNumber', desc: false }])

  const activeDialogItem = useMemo(() => {
    if (!selectedAdrItem) return null
    return localizedItems.find((item) => item.id === selectedAdrItem.id) ?? selectedAdrItem
  }, [localizedItems, selectedAdrItem])

  const filteredData = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    return localizedItems.filter((item) => {
      const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter
      if (!matchesCategory) return false
      if (!normalizedQuery) return true
      return (
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.summary.toLowerCase().includes(normalizedQuery) ||
        item.category.toLowerCase().includes(normalizedQuery)
      )
    })
  }, [categoryFilter, localizedItems, searchQuery])

  const columns = useMemo<ColumnDef<TechRadarItem>[]>(
    () => [
      {
        accessorKey: 'adrNumber',
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 font-mono text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <span>ADR #</span>
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            #{String(row.original.adrNumber).padStart(2, '0')}
          </span>
        ),
      },
      {
        accessorKey: 'name',
        header: t('colTech'),
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-sm text-foreground">{row.original.name}</div>
            <div className="text-xs text-muted-foreground line-clamp-1">{row.original.summary}</div>
          </div>
        ),
      },
      {
        accessorKey: 'category',
        header: t('colDomain'),
        cell: ({ row }) => (
          <Badge variant="secondary" className="font-mono text-[11px] whitespace-nowrap">
            {row.original.category}
          </Badge>
        ),
      },
      {
        accessorKey: 'level',
        header: t('colStatus'),
        cell: ({ row }) => {
          const level = row.original.level
          const variant = level === 'Core' ? 'success' : level === 'Production' ? 'default' : 'warning'
          return (
            <Badge variant={variant} className="font-mono text-[10px]">
              {level}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'experienceYears',
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 font-mono text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <span>{t('colExp')}</span>
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-medium">
            {t('yearsSuffix', { years: row.original.experienceYears })}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">ADR</span>,
        cell: ({ row }) => (
          <div className="text-right">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                openAdrInspector(row.original)
                trackEvent('adr_popover_inspected', {
                  adrNumber: row.original.adrNumber,
                  name: row.original.name,
                })
              }}
              className="h-7 gap-1 font-mono text-xs"
            >
              <BookOpenCheck className="h-3.5 w-3.5" />
              <span>{t('inspectBtn')}</span>
            </Button>
          </div>
        ),
      },
    ],
    [openAdrInspector, t],
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

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
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
          {CATEGORIES.map((category) => {
            const active = categoryFilter === category
            return (
              <button
                key={category}
                type="button"
                onClick={() => setCategoryFilter(category)}
                className={`shrink-0 rounded-md px-2.5 py-1 font-mono text-xs transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {category === 'ALL' ? t('allDomains') : category}
              </button>
            )
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      {/* Mobile Card View (< md) — Zero horizontal table scroll */}
      <div className="grid gap-3 md:hidden">
        {table.getRowModel().rows.length > 0 ? (
          table.getRowModel().rows.map((row) => {
            const item = row.original
            const levelVariant = item.level === 'Core' ? 'success' : item.level === 'Production' ? 'default' : 'warning'
            return (
              <div key={row.id} className="rounded-lg border border-border bg-card p-3.5 shadow-sm">
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
                    onClick={() => {
                      openAdrInspector(item)
                      trackEvent('adr_popover_inspected', {
                        adrNumber: item.adrNumber,
                        name: item.name,
                      })
                    }}
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

      {/* Desktop Notion Database Table View (>= md) */}
      <div className="hidden overflow-x-auto rounded-lg border border-border bg-card shadow-sm md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border bg-muted/40">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-3.5 py-2.5 font-mono text-xs font-semibold text-muted-foreground">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border/70">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-muted/30">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3.5 py-3 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="py-8 text-center text-sm text-muted-foreground">
                  {t('emptyResult')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
