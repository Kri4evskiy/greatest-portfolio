'use client'

import {
  type ArticleMeta,
  ArticleMetaSchema,
  type KnowledgeCategory,
  type KnowledgeMetricsSortBy,
  type PaginatedArticleMetricsResponse,
  PaginatedArticleMetricsResponseSchema,
} from '@repo/shared-schemas'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'

export const KNOWLEDGE_METRICS_QUERY_KEY = ['knowledge', 'metrics'] as const
export const KNOWLEDGE_PAGINATED_METRICS_QUERY_KEY = ['knowledge', 'metrics', 'paginated'] as const

const ArticleMetaArraySchema = z.array(ArticleMetaSchema).max(500)

async function fetchKnowledgeMetrics(): Promise<ArticleMeta[]> {
  const res = await fetch('/api/knowledge/metrics', {
    method: 'GET',
    credentials: 'include',
  })
  if (!res.ok) {
    throw new Error(`Protected endpoint (${res.status})`)
  }
  const data: unknown = await res.json()
  return ArticleMetaArraySchema.parse(data)
}

export function useKnowledgeMetrics(enabled = true) {
  return useQuery({
    queryKey: KNOWLEDGE_METRICS_QUERY_KEY,
    queryFn: fetchKnowledgeMetrics,
    enabled,
  })
}

export interface UsePaginatedKnowledgeMetricsParams {
  limit: number
  offset: number
  category?: KnowledgeCategory | undefined
  sortBy: KnowledgeMetricsSortBy
}

async function fetchPaginatedKnowledgeMetrics(
  params: UsePaginatedKnowledgeMetricsParams,
): Promise<PaginatedArticleMetricsResponse> {
  const searchParams = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
    sortBy: params.sortBy,
  })
  if (params.category) {
    searchParams.set('category', params.category)
  }

  const res = await fetch(`/api/knowledge/metrics/paginated?${searchParams.toString()}`, {
    method: 'GET',
    credentials: 'include',
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch paginated metrics (${res.status})`)
  }
  const data: unknown = await res.json()
  return PaginatedArticleMetricsResponseSchema.parse(data)
}

export function usePaginatedKnowledgeMetrics(params: UsePaginatedKnowledgeMetricsParams) {
  return useQuery({
    queryKey: [...KNOWLEDGE_PAGINATED_METRICS_QUERY_KEY, params] as const,
    queryFn: () => fetchPaginatedKnowledgeMetrics(params),
    placeholderData: keepPreviousData,
  })
}

export function useIncrementViewMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ slug, category }: { slug: string; category: KnowledgeCategory }): Promise<ArticleMeta> => {
      const res = await fetch(`/api/knowledge/${encodeURIComponent(slug)}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ category }),
      })
      if (!res.ok) {
        throw new Error('Failed to record article view')
      }
      const data: unknown = await res.json()
      return ArticleMetaSchema.parse(data)
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<ArticleMeta[]>(KNOWLEDGE_METRICS_QUERY_KEY, (prev) => {
        if (!prev) return [updated]
        const exists = prev.some((item) => item.slug === updated.slug)
        if (!exists) return [...prev, updated]
        return prev.map((item) => (item.slug === updated.slug ? updated : item))
      })
    },
  })
}

export function useIncrementHelpfulMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ slug, category }: { slug: string; category: KnowledgeCategory }): Promise<ArticleMeta> => {
      const res = await fetch(`/api/knowledge/${encodeURIComponent(slug)}/helpful`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ category }),
      })
      if (!res.ok) {
        throw new Error('Failed to record helpful reaction')
      }
      const data: unknown = await res.json()
      return ArticleMetaSchema.parse(data)
    },
    onMutate: async ({ slug, category }) => {
      await queryClient.cancelQueries({ queryKey: KNOWLEDGE_METRICS_QUERY_KEY })
      const previous = queryClient.getQueryData<ArticleMeta[]>(KNOWLEDGE_METRICS_QUERY_KEY)

      queryClient.setQueryData<ArticleMeta[]>(KNOWLEDGE_METRICS_QUERY_KEY, (old) => {
        const now = new Date().toISOString()
        if (!old) {
          return [
            {
              slug,
              category,
              viewsCount: 1,
              helpfulCount: 1,
              updatedAt: now,
            },
          ]
        }
        return old.map((item) =>
          item.slug === slug
            ? {
                ...item,
                helpfulCount: item.helpfulCount + 1,
                updatedAt: now,
              }
            : item,
        )
      })

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(KNOWLEDGE_METRICS_QUERY_KEY, context.previous)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: KNOWLEDGE_METRICS_QUERY_KEY })
    },
  })
}
