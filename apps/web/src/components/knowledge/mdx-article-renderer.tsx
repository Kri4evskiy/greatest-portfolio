'use client'

import { Skeleton } from '@repo/ui'
import dynamic from 'next/dynamic'
import type { MdxBlock } from '@/lib/mdx-content'
import { ArticleImageGrid } from './article-image-grid'

const ReactRenderGraphD3 = dynamic(() => import('./d3-react-render-graph').then((m) => m.ReactRenderGraphD3), {
  ssr: false,
  loading: () => <Skeleton className="my-6 h-72 w-full rounded-xl" />,
})

const ArchitectureFlowD3 = dynamic(() => import('./d3-architecture-flow').then((m) => m.ArchitectureFlowD3), {
  ssr: false,
  loading: () => <Skeleton className="my-6 h-64 w-full rounded-xl" />,
})

export function MdxArticleRenderer({ blocks }: { blocks: readonly MdxBlock[] }) {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-foreground sm:text-base">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`

        if (block.type === 'h2') {
          return (
            <h2 key={key} className="mt-8 border-b border-border/60 pb-2 text-xl font-bold tracking-tight">
              {block.text}
            </h2>
          )
        }

        if (block.type === 'paragraph') {
          return (
            <p key={key} className="text-muted-foreground leading-relaxed">
              {block.text}
            </p>
          )
        }

        if (block.type === 'list') {
          return (
            <ul key={key} className="list-disc space-y-1.5 pl-5 text-muted-foreground">
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )
        }

        if (block.type === 'code') {
          return (
            <div
              key={key}
              className="my-4 overflow-x-auto rounded-lg border border-border bg-slate-950 p-4 font-mono text-xs text-slate-100"
            >
              <div className="mb-2 flex items-center justify-between border-b border-slate-800 pb-1.5 text-[10px] uppercase tracking-wider text-slate-400">
                <span>{block.language}</span>
                <span>MDX Code Block</span>
              </div>
              <pre className="leading-relaxed">
                <code>{block.code}</code>
              </pre>
            </div>
          )
        }

        if (block.type === 'component') {
          if (block.name === 'ReactRenderGraphD3') {
            return <ReactRenderGraphD3 key={key} />
          }
          if (block.name === 'ArchitectureFlowD3') {
            return <ArchitectureFlowD3 key={key} />
          }
          return <ArticleImageGrid key={key} />
        }

        return null
      })}
    </div>
  )
}
