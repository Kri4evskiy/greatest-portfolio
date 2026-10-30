import { DEFAULT_LOCALE, KNOWLEDGE_CATEGORY_LABELS, SupportedLocaleEnum } from '@repo/shared-schemas'
import { Badge, Callout, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui'
import { ArrowRight, Clock, Database, ShieldCheck, Sparkles } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { getAllKnowledgeArticles } from '@/lib/mdx-content'

export default async function KnowledgeBaseIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const parsed = SupportedLocaleEnum.safeParse(locale)
  const resolvedLocale = parsed.success ? parsed.data : DEFAULT_LOCALE
  setRequestLocale(resolvedLocale)

  const t = await getTranslations({ locale: resolvedLocale, namespace: 'KnowledgeBase' })
  const articles = getAllKnowledgeArticles(resolvedLocale)

  return (
    <div className="space-y-8">
      <div className="space-y-3 border-b border-border/70 pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="success" className="font-mono text-xs">
            {t('protectedBadge')}
          </Badge>
          <Badge variant="outline" className="font-mono text-xs">
            SSG + MDX + D3.js + WebP + IndexedDB
          </Badge>
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('title')}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">{t('description')}</p>
      </div>

      <Callout variant="success" title={t('calloutTitle')} icon={<ShieldCheck className="h-4 w-4" />}>
        {t('calloutBody')}
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
                <CardDescription className="text-xs leading-relaxed">{article.summary}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between border-t border-border/60 pt-3 font-mono text-xs text-primary">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    {t('openArticleCta')}
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
          <span>{t('howToAddTitle')}</span>
        </div>
        <p className="mt-1">{t('howToAddBody')}</p>
      </div>
    </div>
  )
}
