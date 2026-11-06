'use client'

import { Skeleton } from '@repo/ui'
import dynamic from 'next/dynamic'
import { ArticleImageGrid } from './article-image-grid'

const ReactRenderGraphD3 = dynamic(() => import('./d3-react-render-graph').then((m) => m.ReactRenderGraphD3), {
  ssr: false,
  loading: () => <Skeleton className="my-6 h-72 w-full rounded-xl" />,
})

const ArchitectureFlowD3 = dynamic(() => import('./d3-architecture-flow').then((m) => m.ArchitectureFlowD3), {
  ssr: false,
  loading: () => <Skeleton className="my-6 h-64 w-full rounded-xl" />,
})

export function MdxInteractiveWidget({
  name,
}: {
  name: 'ReactRenderGraphD3' | 'ArchitectureFlowD3' | 'ArticleImageGrid'
}) {
  if (name === 'ReactRenderGraphD3') {
    return <ReactRenderGraphD3 />
  }
  if (name === 'ArchitectureFlowD3') {
    return <ArchitectureFlowD3 />
  }
  return <ArticleImageGrid />
}
