'use client';

import { useIncrementArticleHelpful, useKnowledgeMetrics } from '@/hooks/use-knowledge-metrics';
import { useVisitorProfile } from '@/hooks/use-session';
import {
  KNOWLEDGE_CATEGORY_LABELS,
  type KnowledgeCategory,
  TECH_RADAR_ITEMS,
} from '@repo/shared-schemas';
import {
  Badge,
  Button,
  Callout,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui';
import { ArrowRight, BookOpen, Eye, ShieldCheck, ThumbsUp } from 'lucide-react';
import Link from 'next/link';
import type * as React from 'react';

const INITIAL_ARTICLES: ReadonlyArray<{
  slug: string;
  title: string;
  category: KnowledgeCategory;
  summary: string;
  readTime: string;
}> = [
  {
    slug: 'adr-full-stack-catalog',
    title: 'Полный ADR-каталог: Почему, Где и Как выбраны 15 технологий нашего стека',
    category: 'architecture-devops',
    summary:
      'Архитектурная защита каждого решения: от монорепозитория pnpm + Turborepo до разделения Zustand / TanStack Query и микросервисного SSE.',
    readTime: '8 мин',
  },
  {
    slug: 'react-18-vs-19-compiler-and-fiber',
    title: 'React 18 vs React 19: Эволюция рендеринга, мемоизации и хук use()',
    category: 'react',
    summary:
      'Сравнение ручной оптимизации (useMemo / useCallback) и автоматической мемоизации React Compiler с интерактивным графом D3.js.',
    readTime: '6 мин',
  },
  {
    slug: 'nestjs-jwt-httponly-rbac-prisma',
    title: 'Безопасность без компромиссов: JWT в HttpOnly Cookies, Next.js Edge и RBAC',
    category: 'nestjs-prisma',
    summary:
      'Почему хранить JWT в LocalStorage опасно и как устроена сквозная авторизация GUEST -> USER -> ADMIN между Next.js и NestJS.',
    readTime: '7 мин',
  },
  {
    slug: 'strict-typescript-zod-contracts',
    title: 'Единые контракты API: Strict TypeScript + Zod между фронтендом и бэкендом',
    category: 'typescript',
    summary:
      'Как пакет @repo/shared-schemas исключает рассинхронизацию DTO между React Hook Form и NestJS ZodValidationPipe.',
    readTime: '5 мин',
  },
  {
    slug: 'tanstack-redact-bundle-experiment',
    title: 'Инженерный эксперимент: Оптимизация клиентского бандла с TanStack Redact',
    category: 'architecture-devops',
    summary:
      'Замеры размера клиентского JS-бандла в Next.js App Router и техники bundle-* оптимизации по стандарту Vercel Engineering.',
    readTime: '5 мин',
  },
];

export default function KnowledgeBasePage(): React.JSX.Element {
  const { data: session } = useVisitorProfile();
  const { data: metrics } = useKnowledgeMetrics(true);
  const helpfulMutation = useIncrementArticleHelpful();

  const metricsBySlug = new Map((metrics ?? []).map((m) => [m.slug, m]));

  return (
    <div className="space-y-8">
      <div className="space-y-2 border-b border-border pb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <BookOpen className="h-4 w-4 text-emerald-600" />
            <span>/knowledge-base • Protected by Edge Middleware & NestJS JwtRolesGuard</span>
          </div>
          <Badge variant="core">
            <ShieldCheck className="h-3.5 w-3.5" />
            {session?.displayName ?? 'Authorized Guest'} ({session?.role})
          </Badge>
        </div>

        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Engineering Base of Knowledge (MDX + D3.js + IndexedDB)
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Выберите любую статью ниже или в древовидном сайдбаре слева, чтобы открыть полный
          инженерный разбор с живыми графами <code className="font-mono">D3.js</code> и диаграммами{' '}
          <code className="font-mono">&lt;ArticleImageGrid /&gt;</code>.
        </p>
      </div>

      <Callout icon="⚡" title="Offline-First IndexedDB + Optimistic UI + SSE">
        Все метрики кэшируются в браузерной БД <code className="font-mono">IndexedDB</code> на 24
        часа. Нажмите <strong>«Полезно»</strong> или откройте статью — счетчик мгновенно обновится
        через <code className="font-mono">TanStack Query onMutate</code> и отправит real-time ивент
        в микросервис <code className="font-mono">telemetry-ms</code>.
      </Callout>

      <div className="grid gap-4 md:grid-cols-2">
        {INITIAL_ARTICLES.map((article) => {
          const meta = metricsBySlug.get(article.slug);
          const viewsCount = meta?.viewsCount ?? 100;
          const helpfulCount = meta?.helpfulCount ?? 25;
          const href = `/knowledge-base/${article.category}/${article.slug}`;

          return (
            <Card key={article.slug} className="flex flex-col justify-between">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary">{KNOWLEDGE_CATEGORY_LABELS[article.category]}</Badge>
                  <span className="font-mono text-xs text-muted-foreground">
                    {article.readTime}
                  </span>
                </div>
                <CardTitle className="mt-2 text-base leading-snug">
                  <Link href={href} className="hover:underline">
                    {article.title}
                  </Link>
                </CardTitle>
                <CardDescription className="mt-1 text-xs leading-relaxed">
                  {article.summary}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between border-t border-border/60 pt-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    {viewsCount}
                  </span>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() =>
                      helpfulMutation.mutate({
                        slug: article.slug,
                        category: article.category,
                      })
                    }
                    className="inline-flex items-center gap-1 text-emerald-600 hover:underline"
                  >
                    <ThumbsUp className="h-3 w-3" />
                    {helpfulCount}
                  </button>
                </div>

                <Button asChild size="sm" variant="outline" className="h-8 gap-1 text-xs">
                  <Link href={href}>
                    Читать и открыть D3.js
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Built-in Full 15 ADR Quick Reference inside Knowledge Base */}
      <section className="pt-4 space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">
          Реестр всех 15 Архитектурных Решений (ADR Summary)
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TECH_RADAR_ITEMS.map((adr) => (
            <div
              key={adr.id}
              className="rounded-lg border border-border bg-card p-4 text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-semibold text-emerald-600">
                  ADR #{adr.adrNumber}
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {adr.category}
                </Badge>
              </div>
              <p className="font-semibold text-sm text-foreground">{adr.name}</p>
              <p className="text-muted-foreground leading-relaxed">{adr.adrWhy}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
