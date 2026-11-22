'use client'

import {
  getKnowledgeCategoryLabel,
  type KnowledgeCategory,
  KnowledgeCategoryEnum,
  type KnowledgeMetricsSortBy,
  KnowledgeMetricsSortByEnum,
  type SupportedLocale,
} from '@repo/shared-schemas'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Skeleton,
  ToggleGroup,
  ToggleGroupItem,
} from '@repo/ui'
import { BarChart3, ChevronLeft, ChevronRight, Eye, ThumbsUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { usePaginatedKnowledgeMetrics } from '@/entities/knowledge-article/queries/use-knowledge-metrics'
import { computeOffsetPagination } from '../lib/system-status-helpers'

const PAGE_LIMIT = 5
type CategoryFilterValue = 'ALL' | KnowledgeCategory

export function KnowledgeLeaderboardCard({ locale }: { locale: SupportedLocale }) {
  const t = useTranslations('SystemStatusPage')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterValue>('ALL')
  const [sortBy, setSortBy] = useState<KnowledgeMetricsSortBy>('viewsCount')
  const [offset, setOffset] = useState(0)

  const metricsQuery = usePaginatedKnowledgeMetrics({
    limit: PAGE_LIMIT,
    offset,
    category: categoryFilter === 'ALL' ? undefined : categoryFilter,
    sortBy,
  })

  const data = metricsQuery.data
  const total = data?.total ?? 0
  const { currentPage, totalPages, pageNumbers } = computeOffsetPagination(total, PAGE_LIMIT, offset)

  const handleCategoryChange = (value: string) => {
    if (!value) return
    setOffset(0)
    if (value === 'ALL') {
      setCategoryFilter('ALL')
      return
    }
    const parsed = KnowledgeCategoryEnum.safeParse(value)
    if (parsed.success) {
      setCategoryFilter(parsed.data)
    }
  }

  const handleSortChange = (value: string) => {
    if (!value) return
    const parsed = KnowledgeMetricsSortByEnum.safeParse(value)
    if (parsed.success) {
      setOffset(0)
      setSortBy(parsed.data)
    }
  }

  const goToPage = (pageNumber: number) => {
    const nextOffset = Math.max(0, (pageNumber - 1) * PAGE_LIMIT)
    setOffset(nextOffset)
  }

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info" className="font-mono text-[10px]">
              useQuery + keepPreviousData ➔ GET /api/knowledge/metrics/paginated
            </Badge>
            {metricsQuery.isPlaceholderData ? (
              <Badge variant="warning" className="font-mono text-[10px]">
                {t('updatingPage')}
              </Badge>
            ) : null}
          </div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span>{t('module3Title')}</span>
          </CardTitle>
          <CardDescription>{t('module3Subtitle')}</CardDescription>
        </div>

        {/* Sort toggle (viewsCount vs helpfulCount) */}
        <ToggleGroup
          type="single"
          value={sortBy}
          onValueChange={handleSortChange}
          variant="segmented"
          size="sm"
          aria-label={t('sortByAria')}
          className="shrink-0"
        >
          <ToggleGroupItem value="viewsCount" className="gap-1 font-mono text-[11px]">
            <Eye className="h-3 w-3" />
            <span>{t('sortViews')}</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="helpfulCount" className="gap-1 font-mono text-[11px]">
            <ThumbsUp className="h-3 w-3" />
            <span>{t('sortHelpful')}</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Category filter */}
        <ToggleGroup
          type="single"
          value={categoryFilter}
          onValueChange={handleCategoryChange}
          variant="outline"
          size="xs"
          aria-label={t('categoryFilterAria')}
        >
          <ToggleGroupItem value="ALL" className="font-mono text-[11px]">
            {t('filterAllCategories')}
          </ToggleGroupItem>
          {KnowledgeCategoryEnum.options.map((category) => (
            <ToggleGroupItem key={category} value={category} className="font-mono text-[11px]">
              {getKnowledgeCategoryLabel(category, locale)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {/* Leaderboard table */}
        {metricsQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }, (_, idx) => (
              <Skeleton key={`leaderboard-skeleton-${String(idx)}`} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : metricsQuery.isError && !data ? (
          <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 text-xs text-muted-foreground">
            {t('leaderboardFetchError')}
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-surface-subtle p-6 text-center text-xs text-muted-foreground">
            {t('leaderboardEmptyState')}
          </div>
        ) : (
          <div
            className={`overflow-x-auto rounded-lg border border-border/80 transition-opacity ${
              metricsQuery.isPlaceholderData ? 'opacity-70' : 'opacity-100'
            }`}
          >
            <table className="w-full min-w-[560px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border/70 bg-surface-subtle font-mono text-[11px] text-muted-foreground">
                  <th className="w-12 px-3 py-2.5 font-medium">#</th>
                  <th className="px-3 py-2.5 font-medium">{t('colArticleSlug')}</th>
                  <th className="px-3 py-2.5 font-medium">{t('colCategory')}</th>
                  <th className="px-3 py-2.5 text-right font-medium">{t('colViews')}</th>
                  <th className="px-3 py-2.5 text-right font-medium">{t('colHelpful')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {data.items.map((item, idx) => (
                  <tr key={item.slug} className="bg-background transition-colors hover:bg-surface-subtle/60">
                    <td className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">{offset + idx + 1}</td>
                    <td className="px-3 py-2.5 font-mono text-xs font-medium text-foreground">{item.slug}</td>
                    <td className="px-3 py-2.5">
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        {getKnowledgeCategoryLabel(item.category, locale)}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs font-semibold text-foreground">
                      {item.viewsCount}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs font-semibold text-success">
                      {item.helpfulCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex-col items-stretch justify-between gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <span>
            limit={data?.limit ?? PAGE_LIMIT} • offset={data?.offset ?? offset} • total={total}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1 || metricsQuery.isFetching}
            onClick={() => goToPage(currentPage - 1)}
            className="h-8 gap-1 px-2.5 font-mono text-xs"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>{t('prevPageBtn')}</span>
          </Button>

          {pageNumbers.map((pageNum) => (
            <Button
              key={`page-${String(pageNum)}`}
              variant={pageNum === currentPage ? 'default' : 'outline'}
              size="sm"
              disabled={metricsQuery.isFetching}
              onClick={() => goToPage(pageNum)}
              className="h-8 min-w-8 px-2.5 font-mono text-xs"
            >
              {pageNum}
            </Button>
          ))}

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages || !data?.hasMore || metricsQuery.isFetching}
            onClick={() => goToPage(currentPage + 1)}
            className="h-8 gap-1 px-2.5 font-mono text-xs"
          >
            <span>{t('nextPageBtn')}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
