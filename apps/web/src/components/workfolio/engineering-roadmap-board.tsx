'use client'

import { Badge } from '@repo/ui'
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  FileCode2,
  Lightbulb,
  Scale,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import type { LocalizedRoadmapItem, RoadmapItemKind, RoadmapItemStatus } from '@/data/engineering-roadmap'

type FilterTab = 'all' | RoadmapItemStatus

export function EngineeringRoadmapBoard({ items }: { items: readonly LocalizedRoadmapItem[] }) {
  const t = useTranslations('Roadmap')

  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    'notion-workfolio-ui-v2': true,
  })

  const counts = useMemo(() => {
    const result: Record<FilterTab, number> = {
      all: items.length,
      planned: 0,
      evaluating: 0,
      deferred: 0,
      shipped: 0,
    }
    for (const item of items) {
      result[item.status] += 1
    }
    return result
  }, [items])

  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') {
      return items
    }
    return items.filter((item) => item.status === activeFilter)
  }, [activeFilter, items])

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const filterTabs: ReadonlyArray<{ id: FilterTab; label: string }> = [
    { id: 'all', label: t('filterAll') },
    { id: 'planned', label: t('statusPlanned') },
    { id: 'evaluating', label: t('statusEvaluating') },
    { id: 'deferred', label: t('statusDeferred') },
    { id: 'shipped', label: t('statusShipped') },
  ]

  const getKindLabel = (kind: RoadmapItemKind): string => {
    switch (kind) {
      case 'ui-ux':
        return t('kindUiUx')
      case 'tech-debt':
        return t('kindTechDebt')
      case 'architecture':
        return t('kindArchitecture')
      case 'idea':
        return t('kindIdea')
      case 'devops':
        return t('kindDevops')
    }
  }

  const renderStatusBadge = (status: RoadmapItemStatus) => {
    switch (status) {
      case 'planned':
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-medium text-primary">
            <Clock className="h-3 w-3" />
            {t('statusPlanned')}
          </span>
        )
      case 'evaluating':
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-warning/30 bg-warning/10 px-2 py-0.5 font-mono text-[11px] font-medium text-warning">
            <Lightbulb className="h-3 w-3" />
            {t('statusEvaluating')}
          </span>
        )
      case 'deferred':
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-[11px] font-medium text-muted-foreground">
            <Scale className="h-3 w-3" />
            {t('statusDeferred')}
          </span>
        )
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-success/30 bg-success/10 px-2 py-0.5 font-mono text-[11px] font-medium text-success">
            <CheckCircle2 className="h-3 w-3" />
            {t('statusShipped')}
          </span>
        )
    }
  }

  return (
    <section id="roadmap" className="scroll-mt-20 space-y-4">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold tracking-tight">{t('title')}</h2>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Mobile-First Horizontal Scrollable Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                  isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                {counts[tab.id]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Cards List */}
      <div className="space-y-3">
        {filteredItems.map((item) => {
          const isExpanded = Boolean(expandedIds[item.id])

          return (
            <div
              key={item.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/30 sm:p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {renderStatusBadge(item.status)}
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {getKindLabel(item.kind)}
                  </Badge>
                </div>

                <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                  <Badge
                    variant={item.priority === 'P1' ? 'warning' : 'outline'}
                    className="px-1.5 py-0 font-mono text-[10px]"
                  >
                    {item.priority}
                  </Badge>
                  <span className="rounded border border-border/70 bg-muted/40 px-1.5 py-0.5 text-[10px]">
                    {t('effortLabel')}: {item.effort}
                  </span>
                </div>
              </div>

              <h3 className="mt-2.5 text-base font-semibold leading-snug text-foreground">{item.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">{item.summary}</p>

              <div className="mt-3">
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() => toggleExpanded(item.id)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-muted/30 px-2.5 py-1 font-mono text-[11px] font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted"
                >
                  <Scale className="h-3 w-3 text-primary" />
                  <span>{isExpanded ? t('hideArgumentsBtn') : t('showArgumentsBtn')}</span>
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>

              {isExpanded ? (
                <div className="mt-3 space-y-3 border-t border-border/60 pt-3 text-xs">
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
                      <Sparkles className="h-3.5 w-3.5 shrink-0" />
                      <span>{t('rationaleHeading')}</span>
                    </div>
                    <p className="mt-1 leading-relaxed text-foreground/90">{item.rationale}</p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-success/25 bg-success/5 p-3">
                      <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-success">
                        {t('prosHeading')}
                      </div>
                      <ul className="mt-1.5 space-y-1.5 text-muted-foreground">
                        {item.pros.map((pro) => (
                          <li key={pro} className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-lg border border-warning/25 bg-warning/5 p-3">
                      <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-warning">
                        {t('constraintsHeading')}
                      </div>
                      <ul className="mt-1.5 space-y-1.5 text-muted-foreground">
                        {item.constraints.map((con) => (
                          <li key={con} className="flex items-start gap-2">
                            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      {/* Author Note: How to append new ideas */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-3.5 py-2.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <FileCode2 className="h-4 w-4 shrink-0 text-primary" />
          <span>{t('sourceNote')}</span>
        </div>
        <code className="rounded bg-background px-2 py-0.5 font-mono text-[11px] text-foreground">
          apps/web/src/data/engineering-roadmap.ts
        </code>
      </div>
    </section>
  )
}
