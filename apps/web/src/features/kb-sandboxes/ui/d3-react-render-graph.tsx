'use client'

import { DEFAULT_LOCALE, type SupportedLocale, SupportedLocaleEnum } from '@repo/shared-schemas'
import { Badge, Button, Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui'
import { type HierarchyPointLink, type HierarchyPointNode, hierarchy, linkHorizontal, select, tree } from 'd3'
import { Cpu, RefreshCw, Sparkles } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

export type ReactRenderMode = 'react18' | 'react19'

interface RenderTreeNode {
  id: string
  label: string
  react18Status: 'rerendered' | 'manual-memo' | 'root'
  react19Status: 'auto-memoized' | 'streamed-use' | 'root'
  renderCostMs18: number
  renderCostMs19: number
  children?: RenderTreeNode[]
}

const COMPONENT_TREE: RenderTreeNode = {
  id: 'app-shell',
  label: '<WorkfolioLayout />',
  react18Status: 'root',
  react19Status: 'root',
  renderCostMs18: 4.2,
  renderCostMs19: 1.8,
  children: [
    {
      id: 'sticky-header',
      label: '<StickyHeader />',
      react18Status: 'manual-memo',
      react19Status: 'auto-memoized',
      renderCostMs18: 3.1,
      renderCostMs19: 0.4,
      children: [
        {
          id: 'guest-pass-btn',
          label: '<GuestPassTrigger />',
          react18Status: 'rerendered',
          react19Status: 'auto-memoized',
          renderCostMs18: 2.8,
          renderCostMs19: 0.2,
        },
      ],
    },
    {
      id: 'tech-radar',
      label: '<TechRadarTable />',
      react18Status: 'rerendered',
      react19Status: 'auto-memoized',
      renderCostMs18: 9.6,
      renderCostMs19: 1.9,
      children: [
        {
          id: 'filter-bar',
          label: '<FilterToolbar />',
          react18Status: 'rerendered',
          react19Status: 'auto-memoized',
          renderCostMs18: 4.4,
          renderCostMs19: 0.5,
        },
        {
          id: 'adr-dialog',
          label: '<AdrPromiseBoundary />',
          react18Status: 'rerendered',
          react19Status: 'streamed-use',
          renderCostMs18: 6.2,
          renderCostMs19: 0.7,
        },
      ],
    },
  ],
}

const UI_COPY: Record<
  SupportedLocale,
  {
    title: string
    subtitle: string
    recalculateAria: string
    react18Summary: string
    react19Summary: string
  }
> = {
  en: {
    title: 'D3.js Interactive Simulation: React 18 Manual Memo vs React 19 Compiler',
    subtitle: 'Tree-shaken d3 hierarchy/tree layout rendered inside a scoped SVG ref',
    recalculateAria: 'Recalculate render cycle',
    react18Summary: 'Red nodes re-render in a cascade on every filter change without manual useMemo / useCallback.',
    react19Summary: 'React 19 Compiler auto-memoizes subtrees while use(promise) streams data into Suspense.',
  },
  uk: {
    title: 'D3.js Інтерактивна симуляція: React 18 Manual Memo vs React 19 Compiler',
    subtitle: 'Точковий імпорт d3 hierarchy/tree у локальному SVG ref',
    recalculateAria: 'Перерахувати цикл рендеру',
    react18Summary: 'Червоні вузли ререндеряться каскадно при кожній зміні фільтра без ручного useMemo / useCallback.',
    react19Summary: 'React 19 Compiler автоматично мемоїзує піддерева, а use(promise) стрімить дані в Suspense.',
  },
  ru: {
    title: 'D3.js Интерактивная симуляция: React 18 Manual Memo vs React 19 Compiler',
    subtitle: 'Точечный импорт d3 hierarchy/tree в локальном SVG ref',
    recalculateAria: 'Пересчитать цикл рендера',
    react18Summary:
      'Красные узлы ререндерятся каскадно при каждом изменении фильтра без ручного useMemo / useCallback.',
    react19Summary: 'React 19 Compiler автоматически мемоизирует поддеревья, а use(promise) стримит данные в Suspense.',
  },
}

export function ReactRenderGraphD3() {
  const rawLocale = useLocale()
  const parsedLocale = SupportedLocaleEnum.safeParse(rawLocale)
  const locale: SupportedLocale = parsedLocale.success ? parsedLocale.data : DEFAULT_LOCALE
  const copy = UI_COPY[locale]

  const svgRef = useRef<SVGSVGElement | null>(null)
  const [mode, setMode] = useState<ReactRenderMode>('react19')
  const [triggerCount, setTriggerCount] = useState(1)

  useEffect(() => {
    const svgEl = svgRef.current
    if (!svgEl) return

    const width = 680
    const height = 300
    const svg = select(svgEl)
    svg.selectAll('*').remove()

    const g = svg.append('g').attr('transform', 'translate(90, 30)')
    const hierarchyRoot = hierarchy<RenderTreeNode>(COMPONENT_TREE)
    const treeLayout = tree<RenderTreeNode>().size([height - 60, width - 220])
    const treeData = treeLayout(hierarchyRoot)

    // Links
    g.selectAll('.link')
      .data(treeData.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', mode === 'react19' ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-3))')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', mode === 'react19' ? 'none' : '5,3')
      .attr(
        'd',
        linkHorizontal<HierarchyPointLink<RenderTreeNode>, HierarchyPointNode<RenderTreeNode>>()
          .x((d) => d.y)
          .y((d) => d.x),
      )

    // Nodes
    const nodes = g
      .selectAll('.node')
      .data(treeData.descendants())
      .enter()
      .append('g')
      .attr('transform', (d) => `translate(${d.y},${d.x})`)

    nodes
      .append('circle')
      .attr('r', 14)
      .attr('fill', (d) => {
        if (mode === 'react18') {
          return d.data.react18Status === 'rerendered' ? 'hsl(var(--destructive))' : 'hsl(var(--chart-3))'
        }
        return d.data.react19Status === 'streamed-use' ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-1))'
      })
      .attr('stroke', 'hsl(var(--card))')
      .attr('stroke-width', 2)

    nodes
      .append('text')
      .attr('dy', -20)
      .attr('text-anchor', 'middle')
      .attr('font-family', 'monospace')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', 'currentColor')
      .text((d) => d.data.label)

    nodes
      .append('text')
      .attr('dy', 28)
      .attr('text-anchor', 'middle')
      .attr('font-family', 'monospace')
      .attr('font-size', '10px')
      .attr('fill', mode === 'react19' ? 'hsl(var(--success))' : 'hsl(var(--warning))')
      .text((d) =>
        mode === 'react19'
          ? `${d.data.renderCostMs19}ms (${d.data.react19Status} #${triggerCount})`
          : `${d.data.renderCostMs18}ms (${d.data.react18Status} #${triggerCount})`,
      )

    return () => {
      svg.selectAll('*').remove()
    }
  }, [mode, triggerCount])

  return (
    <div className="my-6 min-h-[420px] rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="flex flex-col justify-between gap-3 border-b border-border/60 pb-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" />
            <h4 className="font-semibold text-sm">{copy.title}</h4>
          </div>
          <p className="text-xs text-muted-foreground">{copy.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            size="sm"
            variant={mode === 'react18' ? 'default' : 'outline'}
            onClick={() => setMode('react18')}
            className="h-7 font-mono text-xs"
          >
            React 18 (useMemo / Cascade)
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === 'react19' ? 'default' : 'outline'}
            onClick={() => setMode('react19')}
            className="h-7 gap-1 font-mono text-xs"
          >
            <Sparkles className="h-3 w-3" />
            React 19 (Compiler + use())
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label={copy.recalculateAria}
                onClick={() => setTriggerCount((c) => c + 1)}
                className="h-7 w-7"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{copy.recalculateAria}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <svg
          ref={svgRef}
          viewBox="0 0 680 300"
          className="h-auto w-full min-w-[540px] text-foreground"
          role="img"
          aria-label="React 18 vs React 19 Render Graph"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {mode === 'react18' ? (
            <>
              <Badge variant="warning" className="font-mono text-[10px]">
                Total Commit: ~30.3ms
              </Badge>
              <span className="text-muted-foreground">{copy.react18Summary}</span>
            </>
          ) : (
            <>
              <Badge variant="success" className="font-mono text-[10px]">
                Total Commit: ~5.5ms (-81%)
              </Badge>
              <span className="text-muted-foreground">{copy.react19Summary}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
