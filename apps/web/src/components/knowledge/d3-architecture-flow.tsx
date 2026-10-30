'use client';

import { useUIStore } from '@/store/use-ui-store';
import { Badge } from '@repo/ui';
import * as d3 from 'd3';
import { Network } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ArchNode {
  id: string;
  label: string;
  sub: string;
  x: number;
  y: number;
  description: string;
}

const DEFAULT_ARCH_NODE: ArchNode = {
  id: 'nextjs-edge',
  label: 'Next.js 16 Edge',
  sub: 'Middleware + SSG MDX',
  x: 235,
  y: 120,
  description:
    'Edge Middleware проверяет наличие HttpOnly куки kb_access_token за <5 мс до отдачи SSG-страницы Базы Знаний.',
};

const ARCH_NODES: readonly ArchNode[] = [
  {
    id: 'client-idb',
    label: 'Browser Client',
    sub: 'RHF + IndexedDB Cache',
    x: 80,
    y: 120,
    description:
      'Клиентское ядро: React Hook Form + Zod валидируют форму Guest Pass, а TanStack Query v5 синхронизирует кэш в IndexedDB (idb-keyval, TTL 24h).',
  },
  DEFAULT_ARCH_NODE,
  {
    id: 'nestjs-api',
    label: 'NestJS 12 API',
    sub: 'Native ESM + JwtGuard',
    x: 390,
    y: 120,
    description:
      'Модульный бэкенд на нативном ESM (порт 4000): выпускает HttpOnly JWT куки, проверяет роли GUEST/USER/ADMIN и валидирует DTO через единый пакет @repo/shared-schemas.',
  },
  {
    id: 'prisma-neon',
    label: 'Prisma + Neon DB',
    sub: 'PostgreSQL Serverless',
    x: 555,
    y: 65,
    description:
      'Персистентное хранилище PostgreSQL: таблицы VisitorSession, ArticleMetrics (атомарный upsert increment) и SystemEventLog.',
  },
  {
    id: 'telemetry-ms',
    label: 'Telemetry MS',
    sub: 'TCP :4001 + @Sse Stream',
    x: 555,
    y: 175,
    description:
      'Изолированный микросервис @nestjs/microservices (Transport.TCP) обогащает события и стримит их обратно в браузер через RxJS @Sse("/api/telemetry/stream").',
  },
];

const ARCH_LINKS: ReadonlyArray<{ source: string; target: string; label: string }> = [
  { source: 'client-idb', target: 'nextjs-edge', label: 'Cookie / RSC' },
  { source: 'nextjs-edge', target: 'nestjs-api', label: '/api/*' },
  { source: 'nestjs-api', target: 'prisma-neon', label: 'Prisma Upsert' },
  { source: 'nestjs-api', target: 'telemetry-ms', label: 'TCP Event' },
  { source: 'telemetry-ms', target: 'client-idb', label: 'SSE Push' },
];

export function ArchitectureFlowD3() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const activeNodeId = useUIStore((s) => s.archFlowActiveNode);
  const setActiveNodeId = useUIStore((s) => s.setArchFlowActiveNode);

  const selectedNode = ARCH_NODES.find((n) => n.id === activeNodeId) ?? DEFAULT_ARCH_NODE;

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const nodeMap = new Map(ARCH_NODES.map((n) => [n.id, n]));

    // Draw edges
    const linkGroup = svg.append('g');
    for (const link of ARCH_LINKS) {
      const s = nodeMap.get(link.source);
      const t = nodeMap.get(link.target);
      if (!s || !t) continue;

      const isLoopback = link.source === 'telemetry-ms' && link.target === 'client-idb';
      const pathData = isLoopback
        ? `M ${s.x} ${s.y + 22} C ${s.x - 120} 245, ${t.x + 120} 245, ${t.x} ${t.y + 22}`
        : `M ${s.x + 48} ${s.y} L ${t.x - 48} ${t.y}`;

      linkGroup
        .append('path')
        .attr('d', pathData)
        .attr('fill', 'none')
        .attr('stroke', isLoopback ? '#10b981' : '#64748b')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', isLoopback ? '4,4' : 'none');
    }

    // Draw nodes
    const nodeGroup = svg
      .append('g')
      .selectAll('g')
      .data(ARCH_NODES)
      .enter()
      .append('g')
      .attr('transform', (d) => `translate(${d.x}, ${d.y})`)
      .style('cursor', 'pointer')
      .on('click', (_event, d) => {
        setActiveNodeId(d.id);
      });

    nodeGroup
      .append('rect')
      .attr('x', -55)
      .attr('y', -26)
      .attr('width', 110)
      .attr('height', 52)
      .attr('rx', 8)
      .attr('fill', (d) => (d.id === selectedNode.id ? '#0f172a' : '#f8fafc'))
      .attr('stroke', (d) => (d.id === selectedNode.id ? '#10b981' : '#cbd5e1'))
      .attr('stroke-width', (d) => (d.id === selectedNode.id ? 2.5 : 1.5));

    nodeGroup
      .append('text')
      .attr('dy', -4)
      .attr('text-anchor', 'middle')
      .attr('font-family', 'monospace')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .attr('fill', (d) => (d.id === selectedNode.id ? '#ffffff' : '#0f172a'))
      .text((d) => d.label);

    nodeGroup
      .append('text')
      .attr('dy', 12)
      .attr('text-anchor', 'middle')
      .attr('font-family', 'monospace')
      .attr('font-size', '8.5px')
      .attr('fill', (d) => (d.id === selectedNode.id ? '#a7f3d0' : '#64748b'))
      .text((d) => d.sub);
  }, [selectedNode.id, setActiveNodeId]);

  return (
    <div className="my-6 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-primary" />
          <h4 className="font-semibold text-sm">
            D3.js Interactive Monorepo Data-Flow (Кликните на любой узел архитектуры)
          </h4>
        </div>
        <Badge variant="outline" className="font-mono text-[10px]">
          Active Node: {selectedNode.label}
        </Badge>
      </div>

      <div className="mt-3 overflow-x-auto">
        <svg
          ref={svgRef}
          viewBox="0 0 650 250"
          className="h-auto w-full min-w-[540px]"
          role="img"
          aria-label="Monorepo Architecture Flow Graph"
        />
      </div>

      <div className="mt-2 rounded-lg border border-border/80 bg-muted/40 p-3 text-xs">
        <div className="font-mono font-semibold text-foreground">
          {selectedNode.label} ({selectedNode.sub})
        </div>
        <p className="mt-1 text-muted-foreground leading-relaxed">{selectedNode.description}</p>
      </div>
    </div>
  );
}
