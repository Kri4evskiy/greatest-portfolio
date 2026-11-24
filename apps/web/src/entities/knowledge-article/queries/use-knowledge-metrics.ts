'use client'

import {
  API_ENDPOINTS,
  type ArticleMeta,
  ArticleMetaSchema,
  type KnowledgeCategory,
  type KnowledgeMetricsSortBy,
  type PaginatedArticleMetricsResponse,
  PaginatedArticleMetricsResponseSchema,
} from '@repo/shared-schemas'
import { keepPreviousData, queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { apiClient } from '@/shared/lib/api-client'

export const KNOWLEDGE_METRICS_QUERY_KEY = ['knowledge', 'metrics'] as const
export const KNOWLEDGE_PAGINATED_METRICS_QUERY_KEY = ['knowledge', 'metrics', 'paginated'] as const

const ArticleMetaArraySchema = z.array(ArticleMetaSchema).max(500)

export interface UsePaginatedKnowledgeMetricsParams {
  limit: number
  offset: number
  category?: KnowledgeCategory | undefined
  sortBy: KnowledgeMetricsSortBy
}

export interface ArticleReactionPayload {
  slug: string
  category: KnowledgeCategory
}

export function fetchKnowledgeMetrics(signal?: AbortSignal): Promise<ArticleMeta[]> {
  return apiClient.get(API_ENDPOINTS.knowledgeMetrics, ArticleMetaArraySchema, { signal })
}

export function fetchPaginatedKnowledgeMetrics(
  params: UsePaginatedKnowledgeMetricsParams,
  signal?: AbortSignal,
): Promise<PaginatedArticleMetricsResponse> {
  return apiClient.get(API_ENDPOINTS.knowledgeMetricsPaginated, PaginatedArticleMetricsResponseSchema, {
    signal,
    params: {
      limit: params.limit,
      offset: params.offset,
      sortBy: params.sortBy,
      category: params.category,
    },
  })
}

export function recordArticleView({ slug, category }: ArticleReactionPayload): Promise<ArticleMeta> {
  return apiClient.post(API_ENDPOINTS.knowledgeArticleView, ArticleMetaSchema, { category }, { pathParams: { slug } })
}

export function recordArticleHelpful({ slug, category }: ArticleReactionPayload): Promise<ArticleMeta> {
  return apiClient.post(
    API_ENDPOINTS.knowledgeArticleHelpful,
    ArticleMetaSchema,
    { category },
    { pathParams: { slug } },
  )
}

export function knowledgeMetricsQueryOptions(enabled = true) {
  return queryOptions({
    queryKey: KNOWLEDGE_METRICS_QUERY_KEY,
    queryFn: ({ signal }) => fetchKnowledgeMetrics(signal),
    enabled,
  })
}

export function paginatedKnowledgeMetricsQueryOptions(params: UsePaginatedKnowledgeMetricsParams) {
  return queryOptions({
    queryKey: [...KNOWLEDGE_PAGINATED_METRICS_QUERY_KEY, params] as const,
    queryFn: ({ signal }) => fetchPaginatedKnowledgeMetrics(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useKnowledgeMetrics(enabled = true) {
  return useQuery(knowledgeMetricsQueryOptions(enabled))
}

export function usePaginatedKnowledgeMetrics(params: UsePaginatedKnowledgeMetricsParams) {
  return useQuery(paginatedKnowledgeMetricsQueryOptions(params))
}

export function useIncrementViewMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: recordArticleView,
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
    mutationFn: recordArticleHelpful,
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
        const exists = old.some((item) => item.slug === slug)
        if (!exists) {
          return [
            ...old,
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
