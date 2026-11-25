'use client'

import {
  formatKnowledgeSegmentLabel,
  getKnowledgeCategoryLabel,
  getKnowledgeFormatLabel,
  type SupportedLocale,
} from '@repo/shared-schemas'
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui'
import { ArrowRight, Clock, Lock, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { MdxArticleFrontmatter } from '@/entities/knowledge-content'
import { buildKnowledgeBasePath, isPublicKnowledgeBasePath } from '@/shared/i18n/app-routes'
import { Link } from '@/shared/i18n/navigation'

interface FilteredArticleCardProps {
  article: MdxArticleFrontmatter
  locale: SupportedLocale
  isUnlocked: boolean
  onRequestUnlock: (targetHref: string) => void
}

export function FilteredArticleCard({ article, locale, isUnlocked, onRequestUnlock }: FilteredArticleCardProps) {
  const t = useTranslations('KnowledgeBase')
  const subPath = article.pathSegments
    .slice(1, -1)
    .map((seg) => formatKnowledgeSegmentLabel(seg, locale))
    .join(' / ')
  const articleHref = buildKnowledgeBasePath(article.routePath)
  const isLockedArticle = !isUnlocked && !isPublicKnowledgeBasePath(articleHref)

  return (
    <Link
      href={articleHref}
      onClick={(event) => {
        if (isLockedArticle) {
          event.preventDefault()
          onRequestUnlock(articleHref)
        }
      }}
      className="group block"
    >
      <Card
        className={`flex h-full flex-col justify-between transition-all ${
          isLockedArticle
            ? 'border-dashed border-border/80 bg-muted/20 opacity-85 hover:border-warning/60 hover:opacity-100'
            : 'group-hover:border-primary/50 group-hover:shadow-md'
        }`}
      >
        <CardHeader className="p-4 pb-3 @sm:p-5 @sm:pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary" className="font-mono text-[10px]">
                {getKnowledgeCategoryLabel(article.category, locale)}
              </Badge>
              {subPath ? (
                <Badge variant="outline" className="font-mono text-[10px]">
                  {subPath}
                </Badge>
              ) : null}
              <Badge variant="outline" className="font-mono text-[10px] text-primary">
                {getKnowledgeFormatLabel(article.format, locale)}
              </Badge>
              {isLockedArticle ? (
                <Badge variant="warning" className="gap-1 font-mono text-[10px]">
                  <Lock className="h-2.5 w-2.5" />
                  <span>{t('cmdLockedBadge')}</span>
                </Badge>
              ) : null}
            </div>
            <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              {article.readingTime}
            </span>
          </div>
          <CardTitle className="mt-2 text-base leading-snug transition-colors group-hover:text-primary @sm:text-lg">
            {article.title}
          </CardTitle>
          <CardDescription className="text-xs leading-relaxed">{article.summary}</CardDescription>
        </CardHeader>

        <CardContent className="p-4 pt-0 @sm:px-5 @sm:pb-5 @sm:pt-0">
          {article.tags.length > 0 ? (
            <div className="mb-3 flex flex-wrap gap-1">
              {article.tags.map((tag) => (
                <span
                  key={`${article.routePath}-${tag}`}
                  className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}

          <div
            className={`flex items-center justify-between border-t border-border/60 pt-3 font-mono text-xs ${
              isLockedArticle ? 'text-warning' : 'text-primary'
            }`}
          >
            <span className="flex items-center gap-1">
              {isLockedArticle ? <Lock className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
              {isLockedArticle ? t('unlockInPlaceCta') : t('openArticleCta')}
            </span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
