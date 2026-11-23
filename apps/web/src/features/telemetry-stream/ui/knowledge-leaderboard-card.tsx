'use client'

import {
  API_ENDPOINTS,
  type ArticleMeta,
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
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowDown, BarChart3, ChevronLeft, ChevronRight, Eye, ThumbsUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { usePaginatedKnowledgeMetrics } from '@/entities/knowledge-article/queries/use-knowledge-metrics'
import { computeOffsetPagination } from '../lib/system-status-helpers'
import { ObservabilityDataTable } from './observability-data-table'

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

  const columns: ColumnDef<ArticleMeta>[] = [
    {
      id: 'rank',
      header: () => '#',
      meta: {
        headerClassName: 'w-12 px-3 py-2.5 font-medium',
        cellClassName: 'px-3 py-2.5 font-mono text-[11px] text-muted-foreground',
      },
      cell: ({ row }) => offset + row.index + 1,
    },
    {
      accessorKey: 'slug',
      header: () => t('colArticleSlug'),
      meta: {
        cellClassName: 'px-3 py-2.5 font-mono text-xs font-medium text-foreground',
      },
      cell: ({ row }) => row.original.slug,
    },
    {
      accessorKey: 'category',
      header: () => t('colCategory'),
      meta: {
        cellClassName: 'px-3 py-2.5',
      },
      cell: ({ row }) => (
        <Badge variant="secondary" className="font-mono text-[10px]">
          {getKnowledgeCategoryLabel(row.original.category, locale)}
        </Badge>
      ),
    },
    {
      accessorKey: 'viewsCount',
      header: () => (
        <button
          type="button"
          onClick={() => handleSortChange('viewsCount')}
          className={`inline-flex items-center gap-1 transition-colors hover:text-foreground ${
            sortBy === 'viewsCount' ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <span>{t('colViews')}</span>
          {sortBy === 'viewsCount' ? <ArrowDown className="h-3 w-3" /> : null}
        </button>
      ),
      meta: {
        headerClassName: 'px-3 py-2.5 text-right font-medium',
        cellClassName: 'px-3 py-2.5 text-right font-mono text-xs font-semibold text-foreground',
      },
      cell: ({ row }) => row.original.viewsCount,
    },
    {
      accessorKey: 'helpfulCount',
      header: () => (
        <button
          type="button"
          onClick={() => handleSortChange('helpfulCount')}
          className={`inline-flex items-center gap-1 transition-colors hover:text-foreground ${
            sortBy === 'helpfulCount' ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <span>{t('colHelpful')}</span>
          {sortBy === 'helpfulCount' ? <ArrowDown className="h-3 w-3" /> : null}
        </button>
      ),
      meta: {
        headerClassName: 'px-3 py-2.5 text-right font-medium',
        cellClassName: 'px-3 py-2.5 text-right font-mono text-xs font-semibold text-success',
      },
      cell: ({ row }) => row.original.helpfulCount,
    },
  ]

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info" className="font-mono text-[10px]">
              {`useQuery + keepPreviousData ➔ GET ${API_ENDPOINTS.knowledgeMetricsPaginated}`}
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
        ) : (
          <ObservabilityDataTable
            data={data?.items ?? []}
            columns={columns}
            emptyState={t('leaderboardEmptyState')}
            minTableWidthClass="min-w-[560px]"
            getRowId={(row) => row.slug}
            isDimmed={metricsQuery.isPlaceholderData}
            tableTestId="leaderboard-table"
          />
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
              data-testid={`leaderboard-page-${String(pageNum)}-btn`}
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
