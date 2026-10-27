'use client';

import { useUIStore } from '@/store/use-ui-store';
import { Badge, Button } from '@repo/ui';
import * as d3 from 'd3';
import { Play, Sparkles, Zap } from 'lucide-react';
import * as React from 'react';

interface FiberNode {
  id: string;
  label: string;
  x: number;
  y: number;
  react18Renders: boolean;
  react19Renders: boolean;
  note18: string;
  note19: string;
}

const FIBER_NODES: readonly FiberNode[] = [
  {
    id: 'root',
    label: '<WorkfolioApp />',
    x: 320,
    y: 45,
    react18Renders: true,
    react19Renders: true,
    note18: 'State owner: triggers re-render on filter change',
    note19: 'State owner: compiler tracks fine-grained dependencies',
  },
  {
    id: 'header',
    label: '<StickyHeader />',
    x: 130,
    y: 140,
    react18Renders: true,
    react19Renders: false,
    note18: 'Re-renders unless wrapped in React.memo + useCallback',
    note19: 'Skipped automatically by React Compiler (0ms)',
  },
  {
    id: 'table',
    label: '<TechRadarTable />',
    x: 320,
    y: 140,
    react18Renders: true,
    react19Renders: true,
    note18: 'Depends on filter state — re-renders rows',
    note19: 'Only affected table rows update; static cells memoized',
  },
  {
    id: 'footer',
    label: '<LiveSseFooter />',
    x: 510,
    y: 140,
    react18Renders: true,
    react19Renders: false,
    note18: 'Unnecessary re-render due to inline object prop',
    note19: 'Auto-memoized by compiler without manual useMemo',
  },
  {
    id: 'row-card',
    label: '<AdrRowActions />',
    x: 230,
    y: 235,
    react18Renders: true,
    react19Renders: false,
    note18: 'New callback reference breaks child memoization',
    note19: 'Stable handler reference synthesized at build time',
  },
  {
    id: 'suspense-data',
    label: 'use(metricsPromise)',
    x: 410,
    y: 235,
    react18Renders: true,
    react19Renders: true,
    note18: 'Requires useEffect + useState waterfall in React 18',
    note19: 'First-class use() hook reads Promise directly in render',
  },
];

const FIBER_LINKS: ReadonlyArray<{ source: string; target: string }> = [
  { source: 'root', target: 'header' },
  { source: 'root', target: 'table' },
  { source: 'root', target: 'footer' },
  { source: 'table', target: 'row-card' },
  { source: 'table', target: 'suspense-data' },
];

const DEFAULT_FIBER_NODE: FiberNode = {
  id: 'root',
  label: '<WorkfolioApp />',
  x: 320,
  y: 45,
  react18Renders: true,
  react19Renders: true,
  note18: 'State owner: triggers re-render on filter change',
  note19: 'State owner: compiler tracks fine-grained dependencies',
};

export function ReactRenderGraphD3(): React.JSX.Element {
  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const mode = useUIStore((s) => s.d3ReactMode);
  const setMode = useUIStore((s) => s.setD3ReactMode);
  const [pulseCount, setPulseCount] = React.useState(1);
  const [selectedNode, setSelectedNode] = React.useState<FiberNode>(DEFAULT_FIBER_NODE);

  React.useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const nodeById = new Map(FIBER_NODES.map((n) => [n.id, n]));

    // Draw edges
    svg
      .append('g')
      .selectAll('line')
      .data(FIBER_LINKS)
      .join('line')
      .attr('x1', (d) => nodeById.get(d.source)?.x ?? 0)
      .attr('y1', (d) => nodeById.get(d.source)?.y ?? 0)
      .attr('x2', (d) => nodeById.get(d.target)?.x ?? 0)
      .attr('y2', (d) => nodeById.get(d.target)?.y ?? 0)
      .attr('stroke', mode === 'react19' ? '#10b981' : '#f59e0b')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4 3')
      .attr('opacity', 0.65);

    // Draw nodes
    const groups = svg
      .append('g')
      .selectAll('g')
      .data(FIBER_NODES)
      .join('g')
      .attr('transform', (d) => `translate(${d.x}, ${d.y})`)
      .style('cursor', 'pointer')
      .on('click', (_event, d) => {
        setSelectedNode(d);
      });

    groups
      .append('rect')
      .attr('x', -78)
      .attr('y', -22)
      .attr('width', 156)
      .attr('height', 44)
      .attr('rx', 8)
      .attr('fill', (d) => {
        const didRender = mode === 'react19' ? d.react19Renders : d.react18Renders;
        if (mode === 'react19') {
          return didRender ? '#ecfdf5' : '#f5f5f4';
        }
        return didRender ? '#fffbeb' : '#f5f5f4';
      })
      .attr('stroke', (d) => {
        const didRender = mode === 'react19' ? d.react19Renders : d.react18Renders;
        if (mode === 'react19') {
          return didRender ? '#10b981' : '#a8a29e';
        }
        return didRender ? '#f59e0b' : '#a8a29e';
      })
      .attr('stroke-width', 2);

    groups
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', -2)
      .attr('fill', '#1c1917')
      .style('font-size', '11px')
      .style('font-family', 'monospace')
      .style('font-weight', '600')
      .text((d) => d.label);

    groups
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 13)
      .attr('fill', (d) => {
        const didRender = mode === 'react19' ? d.react19Renders : d.react18Renders;
        if (!didRender) return '#059669';
        return mode === 'react19' ? '#047857' : '#d97706';
      })
      .style('font-size', '9px')
      .style('font-weight', '500')
      .text((d) => {
        const didRender = mode === 'react19' ? d.react19Renders : d.react18Renders;
        return didRender ? `Rendered (#${pulseCount})` : 'Memoized (0ms skip)';
      });
  }, [mode, pulseCount]);

  return (
    <div className="my-6 rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="core">D3.js Interactive Playground #1</Badge>
            <span className="font-mono text-xs text-muted-foreground">Zustand Synced</span>
          </div>
          <h4 className="mt-1.5 text-base font-semibold">
            React 18 (Manual useMemo/useCallback) vs React 19 (Compiler & use())
          </h4>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={mode === 'react18' ? 'default' : 'outline'}
            onClick={() => setMode('react18')}
          >
            <Zap className="h-3.5 w-3.5" />
            React 18 (6/6 nodes render)
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === 'react19' ? 'unlocked' : 'outline'}
            onClick={() => setMode('react19')}
          >
            <Sparkles className="h-3.5 w-3.5" />
            React 19 Compiler (3/6 skip)
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setPulseCount((c) => c + 1)}
          >
            <Play className="h-3.5 w-3.5" />
            Trigger Commit #{pulseCount + 1}
          </Button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-border/70 bg-background p-2">
        <svg
          ref={svgRef}
          viewBox="0 0 640 280"
          className="mx-auto h-64 w-full max-w-[640px]"
          role="img"
          aria-label="React 18 vs React 19 Fiber render tree visualization"
        />
      </div>

      <div className="mt-3 flex flex-col justify-between gap-2 rounded-lg bg-muted/50 p-3 text-xs sm:flex-row sm:items-center">
        <div>
          <span className="font-mono font-semibold text-foreground">{selectedNode.label}: </span>
          <span className="text-muted-foreground">
            {mode === 'react19' ? selectedNode.note19 : selectedNode.note18}
          </span>
        </div>
        <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
          Кликните по любому узлу графа для инспекции
        </span>
      </div>
    </div>
  );
}
