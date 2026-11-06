import { DEFAULT_LOCALE, SupportedLocaleEnum } from '@repo/shared-schemas'
import { Badge, Callout } from '@repo/ui'
import { ArrowRight, Database, FolderOpen, Layers, ShieldCheck, Sparkles } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { getKnowledgeTree, type KnowledgeTreeFolderNode } from '@/lib/mdx-content'

export default async function KnowledgeBaseIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const parsed = SupportedLocaleEnum.safeParse(locale)
  const resolvedLocale = parsed.success ? parsed.data : DEFAULT_LOCALE

  const t = await getTranslations({ locale: resolvedLocale, namespace: 'KnowledgeBase' })
  const tree = getKnowledgeTree(resolvedLocale)

  return (
    <div className="space-y-8">
      <div className="space-y-3 border-b border-border/70 pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="success" className="font-mono text-xs">
            {t('protectedBadge')}
          </Badge>
          <Badge variant="outline" className="font-mono text-xs">
            Topic → Subtopic → Articles • SSG MDX 2.0
          </Badge>
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('title')}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{t('description')}</p>
      </div>

      <Callout variant="success" title={t('calloutTitle')} icon={<ShieldCheck className="h-4 w-4" />}>
        {t('calloutBody')}
      </Callout>

      {/* Structured 3-Tier Directory: Topics -> Subtopics -> Articles */}
      <div className="space-y-4">
        {tree.map((topic) => {
          const subtopics = topic.children.filter((child): child is KnowledgeTreeFolderNode => child.type === 'folder')
          const isThisProject = topic.segment === 'this-project'

          return (
            <section
              key={topic.pathKey}
              className={`rounded-xl border p-5 shadow-sm transition-colors ${
                isThisProject ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'
              }`}
            >
              {/* Level 1: Topic Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3.5">
                <Link
                  href={`/knowledge-base/${topic.pathKey}`}
                  className="group inline-flex items-center gap-2.5 text-lg font-bold tracking-tight text-foreground transition-colors hover:text-primary"
                >
                  {isThisProject ? (
                    <Sparkles className="h-5 w-5 text-primary" />
                  ) : (
                    <Layers className="h-5 w-5 text-primary" />
                  )}
                  <span>{topic.label}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </Link>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-[11px]">
                    {t('subtopicsCountBadge', { subtopics: subtopics.length, articles: topic.articleCount })}
                  </Badge>
                </div>
              </div>

              {/* Level 2: Clickable Subtopic Tabs/Cards inside the Topic */}
              {subtopics.length > 0 ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {subtopics.map((sub) => (
                    <Link key={sub.pathKey} href={`/knowledge-base/${sub.pathKey}`} className="group block">
                      <div className="flex h-full flex-col justify-between rounded-lg border border-border/80 bg-background/80 p-3.5 transition-all group-hover:border-primary/50 group-hover:bg-accent/40 group-hover:shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground group-hover:text-primary">
                            <FolderOpen className="h-4 w-4 shrink-0 text-primary/80" />
                            <span className="truncate">{sub.label}</span>
                          </span>
                          <Badge variant="outline" className="shrink-0 font-mono text-[10px]">
                            {sub.articleCount}
                          </Badge>
                        </div>

                        {/* Level 3 Preview: Titles of articles inside this subtopic */}
                        <ul className="mt-2.5 space-y-1 border-t border-border/50 pt-2 text-xs text-muted-foreground">
                          {sub.children.slice(0, 3).map((leaf) =>
                            leaf.type === 'article' ? (
                              <li key={leaf.pathKey} className="flex items-center gap-1.5 truncate">
                                <span className="h-1 w-1 shrink-0 rounded-full bg-primary/60" />
                                <span className="truncate">{leaf.article.sidebarLabel}</span>
                              </li>
                            ) : null,
                          )}
                        </ul>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : null}
            </section>
          )
        })}
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
