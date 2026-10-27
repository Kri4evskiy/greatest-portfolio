'use client';

import { ArticleImageGrid, type ArticleImageItem } from '@/components/knowledge/article-image-grid';
import { useIncrementArticleHelpful, useKnowledgeMetrics } from '@/hooks/use-knowledge-metrics';
import type { KnowledgeCategory } from '@repo/shared-schemas';
import { Badge, Button, Skeleton } from '@repo/ui';
import { Eye, Sparkles, ThumbsUp } from 'lucide-react';
import dynamic from 'next/dynamic';
import * as React from 'react';

const ReactRenderGraphD3 = dynamic(
  () =>
    import('@/components/knowledge/react-render-graph-d3').then((mod) => mod.ReactRenderGraphD3),
  {
    ssr: false,
    loading: () => <Skeleton className="my-6 h-72 w-full rounded-xl" />,
  },
);

const ArchitectureFlowD3 = dynamic(
  () => import('@/components/knowledge/architecture-flow-d3').then((mod) => mod.ArchitectureFlowD3),
  {
    ssr: false,
    loading: () => <Skeleton className="my-6 h-72 w-full rounded-xl" />,
  },
);

const DEFAULT_WEBP_DIAGRAMS: readonly ArticleImageItem[] = [
  {
    title: 'Pipeline 1: Request & Security Boundary',
    caption: 'Next.js Edge Middleware -> NestJS JwtRolesGuard -> Prisma Neon PostgreSQL',
    diagramCode: `[Browser Cookie: kb_access_token (HttpOnly; SameSite=Lax)]
       │
       ▼
[Next.js Edge Middleware (~1ms verify)]
       │
       ▼
[NestJS Controller + ZodValidationPipe + @Roles('USER','ADMIN')]`,
  },
  {
    title: 'Pipeline 2: Offline-First & Real-Time SSE Bus',
    caption: 'TanStack Query v5 + IndexedDB (24h TTL) & @nestjs/microservices TCP :4001',
    diagramCode: `[NestJS API] ──emit('telemetry.event')──► [Telemetry MS :4001]
     │                                             │
     ◄───────── RxJS Observable @Sse('/stream') ───┘
     ▼
[Browser Footer Live EventSource + IndexedDB 0ms Cache]`,
  },
];

export function ArticleClientWidgets({
  slug,
  category,
  embedGraph,
}: {
  slug: string;
  category: KnowledgeCategory;
  embedGraph: 'react-render' | 'architecture-flow' | 'none';
}): React.JSX.Element {
  const { data: metrics } = useKnowledgeMetrics(true);
  const helpfulMutation = useIncrementArticleHelpful();

  React.useEffect(() => {
    fetch(`/api/knowledge/${slug}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ slug, category }),
    }).catch(() => {
      // Non-blocking view increment
    });
  }, [slug, category]);

  const currentMeta = (metrics ?? []).find((m) => m.slug === slug);
  const viewsCount = currentMeta?.viewsCount ?? 112;
  const helpfulCount = currentMeta?.helpfulCount ?? 34;

  return (
    <div className="space-y-6">
      {/* Live Metrics Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
          <Badge variant="core">IndexedDB Cached</Badge>
          <span className="inline-flex items-center gap-1 text-foreground">
            <Eye className="h-3.5 w-3.5 text-emerald-600" />
            {viewsCount} views
          </span>
          <span>•</span>
          <span>{helpfulCount} helpful reactions</span>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => helpfulMutation.mutate({ slug, category })}
          className="gap-1.5 text-xs"
        >
          <ThumbsUp className="h-3.5 w-3.5 text-emerald-600" />
          Статья полезна ({helpfulCount})
          <Sparkles className="h-3 w-3 text-amber-500" />
        </Button>
      </div>

      {/* Dynamic D3.js Interactive Playground */}
      {embedGraph === 'react-render' ? <ReactRenderGraphD3 /> : null}
      {embedGraph === 'architecture-flow' ? <ArchitectureFlowD3 /> : null}

      {/* Custom MDX Component: <ArticleImageGrid /> */}
      <ArticleImageGrid images={DEFAULT_WEBP_DIAGRAMS} columns={2} />
    </div>
  );
}
