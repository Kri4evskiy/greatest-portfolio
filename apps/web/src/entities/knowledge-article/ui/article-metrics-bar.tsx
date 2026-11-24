'use client'

import type { KnowledgeCategory, SessionProfile } from '@repo/shared-schemas'
import { Badge, Button, Skeleton } from '@repo/ui'
import { useQuery } from '@tanstack/react-query'
import { Database, Eye, Loader2, ThumbsUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useRef } from 'react'
import {
  useIncrementHelpfulMutation,
  useIncrementViewMutation,
  useKnowledgeMetrics,
} from '@/entities/knowledge-article/queries/use-knowledge-metrics'
import { usePathname } from '@/shared/i18n/navigation'
import { trackEvent } from '@/shared/lib/analytics'
import { useUIActions } from '@/shared/store/use-ui-store'

export function ArticleMetricsBar({ slug, category }: { slug: string; category: KnowledgeCategory }) {
  const t = useTranslations('KnowledgeBase')
  const pathname = usePathname()
  // Subscribe reactively to the root `['auth', 'me']` cache without violating FSD (`entities` -> `features`)
  const { data: profile } = useQuery<SessionProfile>({
    queryKey: ['auth', 'me'],
    enabled: false,
  })
  const { openGuestPassModal } = useUIActions()
  const isUnlocked = profile?.role === 'USER' || profile?.role === 'ADMIN'

  const { data: metricsList, isPending: isMetricsPending } = useKnowledgeMetrics(true)
  const { mutate: recordArticleView } = useIncrementViewMutation()
  const { mutate: recordArticleHelpful, isPending: isMarkingHelpful } = useIncrementHelpfulMutation()
  const viewRecordedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isUnlocked || viewRecordedRef.current === slug) {
      return
    }
    viewRecordedRef.current = slug
    recordArticleView({ slug, category })
    trackEvent('article_read', { slug, category })
  }, [isUnlocked, slug, category, recordArticleView])

  const currentMetric = metricsList?.find((m) => m.slug === slug)
  const isLoadingCounts = isMetricsPending && !currentMetric
  const viewsCount = currentMetric?.viewsCount ?? 0
  const helpfulCount = currentMetric?.helpfulCount ?? 0

  const handleHelpfulClick = () => {
    if (!isUnlocked) {
      openGuestPassModal(pathname)
      return
    }
    recordArticleHelpful({ slug, category })
    trackEvent('article_helpful_clicked', { slug, category })
  }

  return (
    <div className="my-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 font-mono text-muted-foreground">
          <Eye className="h-3.5 w-3.5 text-primary" />
          {isLoadingCounts ? (
            <Skeleton className="h-4 w-16 rounded-xs" />
          ) : (
            <span>{t('viewsLabel', { count: viewsCount })}</span>
          )}
        </div>
        <span className="text-border">•</span>
        <Badge variant="outline" className="font-mono text-[11px]">
          <Database className="mr-1 h-3 w-3 text-success" />
          {t('indexedDbBadge')}
        </Badge>
      </div>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={isMarkingHelpful}
        onClick={handleHelpfulClick}
        className="h-8 gap-1.5 font-mono text-xs"
      >
        {isMarkingHelpful ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-success" />
        ) : (
          <ThumbsUp className="h-3.5 w-3.5 text-success" />
        )}
        {isLoadingCounts ? (
          <Skeleton className="h-3.5 w-14 rounded-xs" />
        ) : (
          <span>{t('helpfulBtn', { count: helpfulCount })}</span>
        )}
      </Button>
    </div>
  )
}
