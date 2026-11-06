import { formatKnowledgeSegmentLabel, getKnowledgeFormatLabel, type SupportedLocale } from '@repo/shared-schemas'
import { Badge } from '@repo/ui'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { MdxArticleFrontmatter } from '@/lib/mdx-content'

interface ArticleFooterNavProps {
  prev: MdxArticleFrontmatter | null
  next: MdxArticleFrontmatter | null
  related: readonly MdxArticleFrontmatter[]
  locale: SupportedLocale
  prevLabel: string
  nextLabel: string
  relatedHeading: string
  backHref: string
  backLabel: string
}

function formatArticleContext(item: MdxArticleFrontmatter, locale: SupportedLocale): string {
  return item.pathSegments
    .slice(0, -1)
    .map((seg) => formatKnowledgeSegmentLabel(seg, locale))
    .join(' / ')
}

export function ArticleFooterNav({
  prev,
  next,
  related,
  locale,
  prevLabel,
  nextLabel,
  relatedHeading,
  backHref,
  backLabel,
}: ArticleFooterNavProps) {
  return (
    <footer className="mt-10 space-y-6 border-t border-border/70 pt-6">
      {/* Prev / Next Sequential Navigation */}
      {prev || next ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {prev ? (
            <Link
              href={`/knowledge-base/${prev.routePath}`}
              className="group flex flex-col justify-between rounded-xl border border-border bg-muted/20 p-4 transition-all hover:border-primary/50 hover:bg-accent/40"
            >
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                <span>{prevLabel}</span>
              </span>
              <span className="mt-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
                {prev.sidebarLabel}
              </span>
              <span className="mt-1 truncate font-mono text-[10px] text-muted-foreground">
                {formatArticleContext(prev, locale)}
              </span>
            </Link>
          ) : (
            <div className="hidden sm:block" />
          )}

          {next ? (
            <Link
              href={`/knowledge-base/${next.routePath}`}
              className="group flex flex-col justify-between rounded-xl border border-border bg-muted/20 p-4 text-left transition-all hover:border-primary/50 hover:bg-accent/40 sm:items-end sm:text-right"
            >
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                <span>{nextLabel}</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
              <span className="mt-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
                {next.sidebarLabel}
              </span>
              <span className="mt-1 truncate font-mono text-[10px] text-muted-foreground">
                {formatArticleContext(next, locale)}
              </span>
            </Link>
          ) : null}
        </div>
      ) : null}

      {/* Related Notes by Shared #Tags */}
      {related.length > 0 ? (
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>{relatedHeading}</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {related.map((item) => (
              <Link
                key={item.routePath}
                href={`/knowledge-base/${item.routePath}`}
                className="group flex flex-col justify-between rounded-lg border border-border/80 bg-background p-3.5 transition-all hover:border-primary/50 hover:shadow-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-[10px] text-muted-foreground">
                    {formatArticleContext(item, locale)}
                  </span>
                  <Badge variant="outline" className="shrink-0 px-1.5 py-0 font-mono text-[10px]">
                    {getKnowledgeFormatLabel(item.format, locale)}
                  </Badge>
                </div>
                <span className="mt-1.5 text-xs font-semibold leading-snug text-foreground group-hover:text-primary sm:text-sm">
                  {item.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{backLabel}</span>
        </Link>
      </div>
    </footer>
  )
}
