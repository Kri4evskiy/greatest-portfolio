'use client'

import {
  type ArticleMeta,
  getKnowledgeCategoryLabel,
  type KnowledgeMetricsSortBy,
  type SupportedLocale,
} from '@repo/shared-schemas'
import { Badge } from '@repo/ui'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowDown } from 'lucide-react'

export interface KnowledgeLeaderboardColumnLabels {
  articleSlug: string
  category: string
  views: string
  helpful: string
}

interface CreateKnowledgeLeaderboardColumnsParams {
  locale: SupportedLocale
  offset: number
  sortBy: KnowledgeMetricsSortBy
  onSortChange: (value: KnowledgeMetricsSortBy) => void
  labels: KnowledgeLeaderboardColumnLabels
}

export function createKnowledgeLeaderboardColumns({
  locale,
  offset,
  sortBy,
  onSortChange,
  labels,
}: CreateKnowledgeLeaderboardColumnsParams): ColumnDef<ArticleMeta>[] {
  return [
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
      header: () => labels.articleSlug,
      meta: {
        cellClassName: 'px-3 py-2.5 font-mono text-xs font-medium text-foreground',
      },
      cell: ({ row }) => row.original.slug,
    },
    {
      accessorKey: 'category',
      header: () => labels.category,
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
          onClick={() => onSortChange('viewsCount')}
          className={`inline-flex items-center gap-1 transition-colors hover:text-foreground ${
            sortBy === 'viewsCount' ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <span>{labels.views}</span>
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
          onClick={() => onSortChange('helpfulCount')}
          className={`inline-flex items-center gap-1 transition-colors hover:text-foreground ${
            sortBy === 'helpfulCount' ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <span>{labels.helpful}</span>
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
}
