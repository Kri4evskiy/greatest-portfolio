'use client'

import { Skeleton } from '@repo/ui'
import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'
import type { MdxWidgetName } from '@/entities/knowledge-content'
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

export interface MdxWidgetRendererProps {
  widgetProps: Readonly<Record<string, string>>
  childrenPayload?: string | undefined
}

const MDX_WIDGET_REGISTRY: Record<MdxWidgetName, (props: MdxWidgetRendererProps) => ReactNode> = {
  ReactRenderGraphD3: () => <ReactRenderGraphD3 />,
  ArchitectureFlowD3: () => <ArchitectureFlowD3 />,
  NestAiMcpDiagram: ({ widgetProps }) => {
    const defaultMode = widgetProps.defaultMode === 'ai' ? 'ai' : 'mcp'
    return <NestAiMcpDiagram defaultMode={defaultMode} />
  },
  ArticleImageGrid: () => <ArticleImageGrid />,
}

export function MdxInteractiveWidget({
  name,
  widgetProps = {},
  childrenPayload,
}: {
  name: MdxWidgetName
  widgetProps?: Readonly<Record<string, string>> | undefined
  childrenPayload?: string | undefined
}) {
  const renderWidget = MDX_WIDGET_REGISTRY[name]
  return renderWidget({ widgetProps, childrenPayload })
}
