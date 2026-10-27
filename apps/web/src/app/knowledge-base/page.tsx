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
import { ArrowLeft, BookOpen, Eye, ShieldCheck, ThumbsUp } from 'lucide-react';
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
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Назад к Workfolio CV
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Badge variant="core">
            <ShieldCheck className="h-3.5 w-3.5" />
            Сессия активна: {session?.displayName ?? 'Authorized Guest'} ({session?.role})
          </Badge>
        </div>
      </div>

      <div className="space-y-2 border-b border-border pb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <BookOpen className="h-4 w-4 text-emerald-600" />
          <span>/knowledge-base • Protected by Next.js Edge Middleware & NestJS JwtRolesGuard</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Engineering Base of Knowledge</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Закрытая база архитектурных разборов, ADR-документов и живых метрик. Все запросы метрик
          кэшируются в браузерной БД <code className="font-mono">IndexedDB</code> (Offline-First,
          TTL 24ч), а кнопка «Полезно» работает через Optimistic UI и транслирует событие в{' '}
          <code className="font-mono">SSE</code>.
        </p>
      </div>

      <div className="mt-6">
        <Callout icon="⚡" title="Протестируйте Optimistic UI + Microservice SSE прямо сейчас">
          Нажмите кнопку <strong>«Полезно»</strong> на любой карточке статьи ниже: счетчик мгновенно
          обновится через <code className="font-mono">TanStack Query onMutate</code>, сохранится в{' '}
          <code className="font-mono">NestJS + Prisma</code> и отправит real-time событие в футер
          через микросервис <code className="font-mono">telemetry-ms</code>!
        </Callout>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {INITIAL_ARTICLES.map((article) => {
          const meta = metricsBySlug.get(article.slug);
          const viewsCount = meta?.viewsCount ?? 100;
          const helpfulCount = meta?.helpfulCount ?? 25;

          return (
            <Card key={article.slug} className="flex flex-col justify-between">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary">{KNOWLEDGE_CATEGORY_LABELS[article.category]}</Badge>
                  <span className="font-mono text-xs text-muted-foreground">
                    {article.readTime}
                  </span>
                </div>
                <CardTitle className="mt-2 text-lg leading-snug">{article.title}</CardTitle>
                <CardDescription className="mt-1 text-xs leading-relaxed">
                  {article.summary}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between border-t border-border/60 pt-4">
                <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    {viewsCount} views
                  </span>
                  <span>•</span>
                  <span>{helpfulCount} helpful</span>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    helpfulMutation.mutate({
                      slug: article.slug,
                      category: article.category,
                    })
                  }
                  className="h-8 gap-1.5 text-xs"
                >
                  <ThumbsUp className="h-3.5 w-3.5 text-emerald-600" />
                  Полезно ({helpfulCount})
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Built-in Full 15 ADR Quick Reference inside Knowledge Base */}
      <section className="mt-12 space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">
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
