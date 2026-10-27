'use client';

import { Badge } from '@repo/ui';
import * as d3 from 'd3';
import * as React from 'react';

interface ArchNode {
  id: string;
  title: string;
  subtitle: string;
  x: number;
  y: number;
  adrRef: string;
  description: string;
}

const ARCH_NODES: readonly ArchNode[] = [
  {
    id: 'client',
    title: 'Browser Client',
    subtitle: 'RHF + IndexedDB + Zustand',
    x: 90,
    y: 120,
    adrRef: 'ADR #4, #5, #6',
    description:
      'Клиент валидирует форму через @repo/shared-schemas (Zod) и хранит 24ч кэш в браузерной БД IndexedDB.',
  },
  {
    id: 'edge',
    title: 'Next.js Edge',
    subtitle: 'Middleware + RSC/SSG',
    x: 250,
    y: 60,
    adrRef: 'ADR #3, #8, #9',
    description:
      'Edge Middleware проверяет наличие HttpOnly куки kb_access_token до рендера защищенных маршрутов /knowledge-base/*.',
  },
  {
    id: 'api',
    title: 'NestJS Core API',
    subtitle: 'JwtRolesGuard + ZodPipe',
    x: 410,
    y: 120,
    adrRef: 'ADR #10, #11',
    description:
      'Основной бэкенд верифицирует подпись JWT, управляет RBAC (GUEST / USER / ADMIN) и атомарно обновляет метрики.',
  },
  {
    id: 'db',
    title: 'Neon PostgreSQL',
    subtitle: 'Prisma ORM',
    x: 565,
    y: 60,
    adrRef: 'ADR #12',
    description:
      'Serverless PostgreSQL хранит таблицы VisitorSession, ArticleMetrics и SystemEventLog.',
  },
  {
    id: 'ms',
    title: 'Telemetry MS',
    subtitle: '@nestjs/microservices TCP',
    x: 410,
    y: 215,
    adrRef: 'ADR #13',
    description:
      'Изолированный микросервис принимает события emit("telemetry.event") по TCP :4001 и агрегирует аналитику.',
  },
  {
    id: 'sse',
    title: 'SSE Live Stream',
    subtitle: '@Sse RxJS Observable',
    x: 250,
    y: 215,
    adrRef: 'ADR #13, #15',
    description:
      'Реактивный поток пушит события в реальном времени и 15-секундный пульс обратно в футер браузера.',
  },
];

const ARCH_EDGES: ReadonlyArray<{ from: string; to: string; label: string }> = [
  { from: 'client', to: 'edge', label: 'GET / Cookie' },
  { from: 'edge', to: 'api', label: '/api/* Proxy' },
  { from: 'api', to: 'db', label: 'Prisma SQL' },
  { from: 'api', to: 'ms', label: 'TCP :4001' },
  { from: 'ms', to: 'sse', label: 'RxJS Subject' },
  { from: 'sse', to: 'client', label: 'text/event-stream' },
];

const DEFAULT_ACTIVE_NODE: ArchNode = {
  id: 'api',
  title: 'NestJS Core API',
  subtitle: 'JwtRolesGuard + ZodPipe',
  x: 410,
  y: 120,
  adrRef: 'ADR #10, #11',
  description:
    'Основной бэкенд верифицирует подпись JWT, управляет RBAC (GUEST / USER / ADMIN) и атомарно обновляет метрики.',
};

export function ArchitectureFlowD3(): React.JSX.Element {
  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const [activeNode, setActiveNode] = React.useState<ArchNode>(DEFAULT_ACTIVE_NODE);

  React.useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const byId = new Map(ARCH_NODES.map((n) => [n.id, n]));

    // Draw edges
    const edgeGroup = svg.append('g');
    edgeGroup
      .selectAll('line')
      .data(ARCH_EDGES)
      .join('line')
      .attr('x1', (d) => byId.get(d.from)?.x ?? 0)
      .attr('y1', (d) => byId.get(d.from)?.y ?? 0)
      .attr('x2', (d) => byId.get(d.to)?.x ?? 0)
      .attr('y2', (d) => byId.get(d.to)?.y ?? 0)
      .attr('stroke', (d) =>
        d.from === activeNode.id || d.to === activeNode.id ? '#10b981' : '#a8a29e',
      )
      .attr('stroke-width', (d) => (d.from === activeNode.id || d.to === activeNode.id ? 2.5 : 1.5))
      .attr('stroke-dasharray', '5 3');

    // Draw nodes
    const nodes = svg
      .append('g')
      .selectAll('g')
      .data(ARCH_NODES)
      .join('g')
      .attr('transform', (d) => `translate(${d.x}, ${d.y})`)
      .style('cursor', 'pointer')
      .on('click', (_event, d) => {
        setActiveNode(d);
      });

    nodes
      .append('rect')
      .attr('x', -68)
      .attr('y', -24)
      .attr('width', 136)
      .attr('height', 48)
      .attr('rx', 8)
      .attr('fill', (d) => (d.id === activeNode.id ? '#ecfdf5' : '#fafaf9'))
      .attr('stroke', (d) => (d.id === activeNode.id ? '#059669' : '#d6d3d1'))
      .attr('stroke-width', (d) => (d.id === activeNode.id ? 2.5 : 1.5));

    nodes
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', -4)
      .attr('fill', '#1c1917')
      .style('font-size', '11px')
      .style('font-weight', '700')
      .text((d) => d.title);

    nodes
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 12)
      .attr('fill', '#57534e')
      .style('font-size', '9px')
      .style('font-family', 'monospace')
      .text((d) => d.subtitle);
  }, [activeNode]);

  return (
    <div className="my-6 rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <Badge variant="production">D3.js Interactive Playground #2</Badge>
          <h4 className="mt-1.5 text-base font-semibold">
            Distributed Request & Real-Time SSE Architecture Graph
          </h4>
        </div>
        <Badge variant="outline" className="font-mono">
          {activeNode.adrRef}
        </Badge>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-border/70 bg-background p-2">
        <svg
          ref={svgRef}
          viewBox="0 0 660 265"
          className="mx-auto h-60 w-full max-w-[660px]"
          role="img"
          aria-label="Monorepo full-stack request and SSE flow graph"
        />
      </div>

      <div className="mt-3 rounded-lg bg-muted/50 p-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-foreground">
            Узел: {activeNode.title} ({activeNode.subtitle})
          </span>
          <span className="font-mono text-emerald-600">{activeNode.adrRef}</span>
        </div>
        <p className="mt-1 text-muted-foreground leading-relaxed">{activeNode.description}</p>
      </div>
    </div>
  );
}
