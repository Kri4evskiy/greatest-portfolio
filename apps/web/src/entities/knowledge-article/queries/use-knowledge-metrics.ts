'use client'

import {
  API_ENDPOINTS,
  type ArticleMeta,
  ArticleMetaSchema,
  buildKnowledgeHelpfulEndpoint,
  buildKnowledgeViewEndpoint,
  type KnowledgeCategory,
  type KnowledgeMetricsSortBy,
  type PaginatedArticleMetricsResponse,
  PaginatedArticleMetricsResponseSchema,
} from '@repo/shared-schemas'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { apiClient } from '@/shared/lib/api-client'

export const KNOWLEDGE_METRICS_QUERY_KEY = ['knowledge', 'metrics'] as const
export const KNOWLEDGE_PAGINATED_METRICS_QUERY_KEY = ['knowledge', 'metrics', 'paginated'] as const

const ArticleMetaArraySchema = z.array(ArticleMetaSchema).max(500)

export function useKnowledgeMetrics(enabled = true) {
  return useQuery({
    queryKey: KNOWLEDGE_METRICS_QUERY_KEY,
    queryFn: ({ signal }) => apiClient.get(API_ENDPOINTS.knowledgeMetrics, ArticleMetaArraySchema, { signal }),
    enabled,
  })
}

export interface UsePaginatedKnowledgeMetricsParams {
  limit: number
  offset: number
  category?: KnowledgeCategory | undefined
  sortBy: KnowledgeMetricsSortBy
}

export function usePaginatedKnowledgeMetrics(params: UsePaginatedKnowledgeMetricsParams) {
  return useQuery({
    queryKey: [...KNOWLEDGE_PAGINATED_METRICS_QUERY_KEY, params] as const,
    queryFn: ({ signal }): Promise<PaginatedArticleMetricsResponse> =>
      apiClient.get(API_ENDPOINTS.knowledgeMetricsPaginated, PaginatedArticleMetricsResponseSchema, {
        signal,
        params: {
          limit: params.limit,
          offset: params.offset,
          sortBy: params.sortBy,
          category: params.category,
        },
      }),
    placeholderData: keepPreviousData,
  })
}

export function useIncrementViewMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ slug, category }: { slug: string; category: KnowledgeCategory }): Promise<ArticleMeta> =>
      apiClient.post(buildKnowledgeViewEndpoint(slug), ArticleMetaSchema, { category }),
    onSuccess: (updated) => {
      queryClient.setQueryData<ArticleMeta[]>(KNOWLEDGE_METRICS_QUERY_KEY, (prev) => {
        if (!prev) return [updated]
        const exists = prev.some((item) => item.slug === updated.slug)
        if (!exists) return [...prev, updated]
        return prev.map((item) => (item.slug === updated.slug ? updated : item))
      })
      void queryClient.invalidateQueries({ queryKey: KNOWLEDGE_PAGINATED_METRICS_QUERY_KEY })
    },
  })
}

export function useIncrementHelpfulMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ slug, category }: { slug: string; category: KnowledgeCategory }): Promise<ArticleMeta> =>
      apiClient.post(buildKnowledgeHelpfulEndpoint(slug), ArticleMetaSchema, { category }),
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
      void queryClient.invalidateQueries({ queryKey: KNOWLEDGE_PAGINATED_METRICS_QUERY_KEY })
    },
  })
}
