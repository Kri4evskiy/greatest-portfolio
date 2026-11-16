import { Callout } from '@repo/ui'
import { CheckSquare, Hash, Square } from 'lucide-react'
import type { ReactNode } from 'react'
import type { MdxBlock } from '@/entities/knowledge-content'
import { MdxInteractiveWidget } from '@/features/kb-sandboxes/ui/mdx-client-widgets'
import { resolveCalloutConfig } from './callout-config'
import { MdxCodeBlock } from './code-block'
import { renderInlineAst } from './inline-ast'
import { MdxMarkdownTable } from './markdown-table'

export function collectCodeBlocksRecursively(
  blocks: readonly MdxBlock[],
  prefix: string,
  out: Array<{ pathKey: string; code: string; language: string }>,
): void {
  blocks.forEach((block, idx) => {
    const pathKey = `${prefix}-${idx}`
    if (block.type === 'code') {
      out.push({ pathKey, code: block.code, language: block.language })
      return
    }
    if (block.type === 'callout') {
      collectCodeBlocksRecursively(block.blocks, `${pathKey}-c`, out)
      return
    }
    if (block.type === 'list') {
      block.items.forEach((item, itemIdx) => {
        collectCodeBlocksRecursively(item.blocks, `${pathKey}-li-${itemIdx}`, out)
      })
    }
  })
}

export function renderBlockList(
  blocks: readonly MdxBlock[],
  prefix: string,
  highlightedByPath: ReadonlyMap<string, string>,
  nested = false,
): ReactNode[] {
  return blocks.map((block, index) => {
    const pathKey = `${prefix}-${index}`
    const key = `${block.type}-${pathKey}`

    if (block.type === 'hr') {
      return <hr key={key} className="my-8 border-border/70" />
    }

    if (block.type === 'heading') {
      if (block.level === 2) {
        return (
          <h2
            key={key}
            id={block.id}
            className="group mt-9 flex scroll-mt-24 items-center gap-2 border-b border-border/60 pb-2 text-xl font-bold tracking-tight"
          >
            <span>{renderInlineAst(block.inlines, key)}</span>
            <a
              href={`#${block.id}`}
              aria-label={block.plainText}
              className="opacity-0 transition-opacity group-hover:opacity-60 hover:opacity-100"
            >
              <Hash className="h-4 w-4 text-muted-foreground" />
            </a>
          </h2>
        )
      }

      if (block.level === 3) {
        return (
          <h3
            key={key}
            id={block.id}
            className="group mt-6 flex scroll-mt-24 items-center gap-1.5 text-base font-semibold tracking-tight text-foreground sm:text-lg"
          >
            <span>{renderInlineAst(block.inlines, key)}</span>
            <a
              href={`#${block.id}`}
              aria-label={block.plainText}
              className="opacity-0 transition-opacity group-hover:opacity-60 hover:opacity-100"
            >
              <Hash className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
          </h3>
        )
      }

      return (
        <h4
          key={key}
          id={block.id}
          className="mt-4 scroll-mt-24 font-mono text-xs font-semibold uppercase tracking-wider text-foreground/90 sm:text-sm"
        >
          {renderInlineAst(block.inlines, key)}
        </h4>
      )
    }

    if (block.type === 'paragraph') {
      return (
        <p key={key} className="leading-relaxed text-muted-foreground">
          {renderInlineAst(block.inlines, key)}
        </p>
      )
    }

    if (block.type === 'image') {
      return (
        <figure key={key} className="my-6 overflow-hidden rounded-xl border border-border bg-card p-2 shadow-sm">
          {/* biome-ignore lint/performance/noImgElement: Static and external Markdown figures inside .mdx content */}
          <img
            src={block.url}
            alt={block.alt}
            loading="lazy"
            className="mx-auto max-h-[480px] w-auto max-w-full rounded-lg object-contain"
          />
          {block.caption ? (
            <figcaption className="mt-2 px-2 pb-1 text-center font-mono text-xs text-muted-foreground">
              {block.caption}
            </figcaption>
          ) : null}
        </figure>
      )
    }

    if (block.type === 'list') {
      const ListTag = block.ordered ? 'ol' : 'ul'
      return (
        <ListTag
          key={key}
          className={`space-y-2 pl-5 text-muted-foreground ${block.ordered ? 'list-decimal' : 'list-disc'} ${
            nested ? 'mt-1.5 text-xs sm:text-sm' : ''
          }`}
        >
          {block.items.map((item, itemIdx) => {
            const itemPrefix = `${pathKey}-li-${itemIdx}`
            const itemKey = `${key}-item-${itemIdx}`
            const firstBlock = item.blocks[0]
            const restBlocks = item.blocks.slice(1)

            return (
              <li key={itemKey} className={item.checked !== undefined ? 'list-none -ml-5' : undefined}>
                <div className="flex items-start gap-2">
                  {item.checked !== undefined ? (
                    item.checked ? (
                      <CheckSquare className="mt-1 h-4 w-4 shrink-0 text-success" />
                    ) : (
                      <Square className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                    )
                  ) : null}
                  <div className="min-w-0 flex-1 space-y-2">
                    {firstBlock?.type === 'paragraph' ? (
                      <span>{renderInlineAst(firstBlock.inlines, `${itemKey}-p0`)}</span>
                    ) : firstBlock ? (
                      renderBlockList([firstBlock], itemPrefix, highlightedByPath, true)
                    ) : null}

                    {restBlocks.length > 0 ? (
                      <div className="space-y-2">
                        {item.blocks.map((childBlock, childIdx) => {
                          if (childIdx === 0) return null
                          return renderBlockList([childBlock], `${itemPrefix}-sub-${childIdx}`, highlightedByPath, true)
                        })}
                      </div>
                    ) : null}
                  </div>
                </div>
              </li>
            )
          })}
        </ListTag>
      )
    }

    if (block.type === 'table') {
      return (
        <MdxMarkdownTable
          key={key}
          tableKey={key}
          headers={block.headers}
          alignments={block.alignments}
          rows={block.rows}
        />
      )
    }

    if (block.type === 'callout') {
      const cfg = resolveCalloutConfig(block.kind)
      const resolvedTitle = block.title ?? cfg.defaultTitle
      return (
        <Callout
          key={key}
          variant={cfg.variant}
          icon={cfg.icon}
          className="my-4"
          {...(resolvedTitle ? { title: resolvedTitle } : {})}
        >
          <div className="space-y-2 text-xs leading-relaxed sm:text-sm">
            {renderBlockList(block.blocks, `${pathKey}-c`, highlightedByPath, true)}
          </div>
        </Callout>
      )
    }

    if (block.type === 'code') {
      const highlightedHtml = highlightedByPath.get(pathKey) ?? ''
      return (
        <MdxCodeBlock
          key={key}
          language={block.language}
          title={block.title}
          code={block.code}
          highlightedHtml={highlightedHtml}
        />
      )
    }

    if (block.type === 'component') {
      return <MdxInteractiveWidget key={key} name={block.name} widgetProps={block.props} />
    }

    return null
  })
}
