'use client'

import { Skeleton } from '@repo/ui'
import dynamic from 'next/dynamic'
import type { MdxWidgetName } from '@/lib/mdx-content'
import { ArticleImageGrid } from './article-image-grid'
import { NestAiMcpDiagram } from './nest-ai-mcp-diagram'

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
  widgetProps = {},
}: {
  name: MdxWidgetName
  widgetProps?: Readonly<Record<string, string>> | undefined
}) {
  if (name === 'ReactRenderGraphD3') {
    return <ReactRenderGraphD3 />
  }
  if (name === 'ArchitectureFlowD3') {
    return <ArchitectureFlowD3 />
  }
  if (name === 'NestAiMcpDiagram') {
    const defaultMode = widgetProps.defaultMode === 'ai' ? 'ai' : 'mcp'
    return <NestAiMcpDiagram defaultMode={defaultMode} />
  }
  return <ArticleImageGrid />
}
