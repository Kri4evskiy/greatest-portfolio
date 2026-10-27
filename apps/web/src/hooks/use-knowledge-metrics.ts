'use client';

import type { ArticleMeta, ArticleReactionInput } from '@repo/shared-schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const KNOWLEDGE_METRICS_KEY = ['knowledge-metrics'] as const;

export function useKnowledgeMetrics(enabled = true) {
  return useQuery({
    queryKey: KNOWLEDGE_METRICS_KEY,
    enabled,
    queryFn: async (): Promise<ArticleMeta[]> => {
      const response = await fetch('/api/knowledge/metrics', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch knowledge metrics');
      }
      const data = (await response.json()) as { items: ArticleMeta[] };
      return data.items;
    },
  });
}

export function useIncrementArticleHelpful() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ArticleReactionInput): Promise<ArticleMeta> => {
      const response = await fetch(`/api/knowledge/${input.slug}/helpful`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        throw new Error('Failed to mark article as helpful');
      }
      return (await response.json()) as ArticleMeta;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: KNOWLEDGE_METRICS_KEY });
      const previous = queryClient.getQueryData<ArticleMeta[]>(KNOWLEDGE_METRICS_KEY);

      if (previous) {
        queryClient.setQueryData<ArticleMeta[]>(
          KNOWLEDGE_METRICS_KEY,
          previous.map((item) =>
            item.slug === input.slug ? { ...item, helpfulCount: item.helpfulCount + 1 } : item,
          ),
        );
      }

      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(KNOWLEDGE_METRICS_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: KNOWLEDGE_METRICS_KEY });
    },
  });
}
