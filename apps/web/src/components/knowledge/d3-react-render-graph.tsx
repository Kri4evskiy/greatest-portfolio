'use client'

import { Badge, Button } from '@repo/ui'
import * as d3 from 'd3'
import { Cpu, RefreshCw, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useUIStore } from '@/store/use-ui-store'

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

export function ReactRenderGraphD3() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const pulseCounterRef = useRef(0)
  const mode = useUIStore((s) => s.reactGraphMode)
  const setMode = useUIStore((s) => s.setReactGraphMode)
  const [triggerCount, setTriggerCount] = useState(1)

  useEffect(() => {
    const svgEl = svgRef.current
    if (!svgEl) return

    const width = 680
    const height = 300
    const svg = d3.select(svgEl)
    svg.selectAll('*').remove()

    const g = svg.append('g').attr('transform', 'translate(90, 30)')
    const hierarchyRoot = d3.hierarchy<RenderTreeNode>(COMPONENT_TREE)
    const treeLayout = d3.tree<RenderTreeNode>().size([height - 60, width - 220])
    const treeData = treeLayout(hierarchyRoot)

    // Links
    g.selectAll('.link')
      .data(treeData.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', mode === 'react19' ? '#10b981' : '#f59e0b')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', mode === 'react19' ? 'none' : '5,3')
      .attr(
        'd',
        d3
          .linkHorizontal<d3.HierarchyPointLink<RenderTreeNode>, d3.HierarchyPointNode<RenderTreeNode>>()
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
          return d.data.react18Status === 'rerendered' ? '#ef4444' : '#f59e0b'
        }
        return d.data.react19Status === 'streamed-use' ? '#3b82f6' : '#10b981'
      })
      .attr('stroke', '#ffffff')
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
      .attr('fill', mode === 'react19' ? '#059669' : '#d97706')
      .text((d) =>
        mode === 'react19'
          ? `${d.data.renderCostMs19}ms (${d.data.react19Status} #${triggerCount})`
          : `${d.data.renderCostMs18}ms (${d.data.react18Status} #${triggerCount})`,
      )
  }, [mode, triggerCount])

  return (
    <div className="my-6 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col justify-between gap-3 border-b border-border/60 pb-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" />
            <h4 className="font-semibold text-sm">
              D3.js Interactive Simulation: React 18 Manual Memo vs React 19 Compiler
            </h4>
          </div>
          <p className="text-xs text-muted-foreground">
            Управляется через атомарный селектор <code>Zustand</code> + <code>useRef</code> SVG
          </p>
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
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              pulseCounterRef.current += 1
              setTriggerCount((c) => c + 1)
            }}
            className="h-7 px-2"
            title="Пересчитать цикл рендера"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
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
              <span className="text-muted-foreground">
                Красные узлы ререндерятся каскадно при каждом изменении фильтра без ручного <code>useCallback</code>.
              </span>
            </>
          ) : (
            <>
              <Badge variant="success" className="font-mono text-[10px]">
                Total Commit: ~5.5ms (-81%)
              </Badge>
              <span className="text-muted-foreground">
                React 19 Compiler автоматически мемоизирует поддеревья, а <code>use(promise)</code> стримит данные в
                Suspense.
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
