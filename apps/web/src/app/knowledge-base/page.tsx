import { getAllKnowledgeArticles } from '@/lib/mdx-content';
import { KNOWLEDGE_CATEGORY_LABELS } from '@repo/shared-schemas';
import {
  Badge,
  Callout,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui';
import { ArrowRight, Clock, Database, ShieldCheck, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function KnowledgeBaseIndexPage() {
  const articles = getAllKnowledgeArticles();

  return (
    <div className="space-y-8">
      <div className="space-y-3 border-b border-border/70 pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="success" className="font-mono text-xs">
            🔓 Protected Engineering Knowledge Base
          </Badge>
          <Badge variant="outline" className="font-mono text-xs">
            SSG + MDX + D3.js + WebP + IndexedDB
          </Badge>
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Инженерная База Знаний и Архитектурные Разборы
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Все статьи ниже скомпилированы статически на этапе сборки (<code>SSG</code> из{' '}
          <code>apps/web/content/*.mdx</code>), содержат интерактивные симуляции на{' '}
          <code>D3.js</code> и кэшируют пользовательские метрики в браузерной БД{' '}
          <code>IndexedDB</code> через <code>TanStack Query v5</code>.
        </p>
      </div>

      <Callout
        variant="success"
        title="Доступ подтвержден (Next.js Edge Middleware + NestJS JWT HttpOnly Cookie)"
        icon={<ShieldCheck className="h-4 w-4" />}
      >
        Вы успешно прошли проверку куки <code>kb_access_token</code>. Откройте вкладку{' '}
        <code>Application → IndexedDB</code> в Chrome DevTools, чтобы увидеть клиентский кэш{' '}
        <code>greatest-portfolio-query-cache</code>.
      </Callout>

      <div className="grid gap-4 sm:grid-cols-2">
        {articles.map((article) => (
          <Link
            key={`${article.category}/${article.slug}`}
            href={`/knowledge-base/${article.category}/${article.slug}`}
            className="group block"
          >
            <Card className="h-full transition-all group-hover:border-primary/50 group-hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {KNOWLEDGE_CATEGORY_LABELS[article.category]}
                  </Badge>
                  <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {article.readingTime}
                  </span>
                </div>
                <CardTitle className="mt-2 text-base leading-snug group-hover:text-primary transition-colors">
                  {article.title}
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  {article.summary}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between border-t border-border/60 pt-3 font-mono text-xs text-primary">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    Открыть статью и D3-граф
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2 font-mono font-semibold text-foreground">
          <Database className="h-4 w-4 text-primary" />
          <span>Как добавить новую статью в Базу Знаний:</span>
        </div>
        <p className="mt-1">
          Достаточно создать файл <code>.mdx</code> в любой из папок{' '}
          <code>
            apps/web/content/&#123;typescript,react,nestjs-prisma,architecture-devops&#125;/
          </code>
          . Функция <code>generateStaticParams()</code> автоматически включит его в SSG-сборку и
          древовидный сайдбар.
        </p>
      </div>
    </div>
  );
}
