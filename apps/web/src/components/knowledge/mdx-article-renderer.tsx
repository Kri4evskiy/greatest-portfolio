import { Callout } from '@repo/ui'
import { AlertTriangle, CheckSquare, Hash, Info, Lightbulb, Quote, ShieldAlert, Sparkles, Square } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from '@/i18n/navigation'
import { type MdxBlock, type MdxCalloutKind, type MdxInlineNode, parseInlineMarkdownToAst } from '@/lib/mdx-content'
import { highlightCodeServer } from '@/lib/shiki-highlighter'
import { CodeCopyButton } from './code-copy-button'
import { MdxInteractiveWidget } from './mdx-client-widgets'

export function renderInlineAst(nodes: readonly MdxInlineNode[], keyPrefix = 'inl'): ReactNode[] {
  return nodes.map((node, idx) => {
    const key = `${keyPrefix}-${idx}`

    switch (node.type) {
      case 'text':
        return node.value

      case 'inlineCode':
        return (
          <code
            key={key}
            className="rounded border border-border/70 bg-muted/70 px-1.5 py-0.5 font-mono text-[0.85em] font-medium text-foreground"
          >
            {node.value}
          </code>
        )

      case 'strong':
        return (
          <strong key={key} className="font-semibold text-foreground">
            {renderInlineAst(node.children, `${key}-b`)}
          </strong>
        )

      case 'emphasis':
        return (
          <em key={key} className="italic text-foreground/90">
            {renderInlineAst(node.children, `${key}-i`)}
          </em>
        )

      case 'delete':
        return (
          <del key={key} className="line-through opacity-70">
            {renderInlineAst(node.children, `${key}-s`)}
          </del>
        )

      case 'break':
        return <br key={key} />

      case 'image':
        return (
          // biome-ignore lint/performance/noImgElement: Arbitrary Markdown inline image URLs inside .mdx content
          <img
            key={key}
            src={node.url}
            alt={node.alt}
            title={node.title}
            loading="lazy"
            className="my-2 inline-block max-h-80 max-w-full rounded-lg border border-border"
          />
        )

      case 'link': {
        const href = node.url.trim()
        if (href.startsWith('/')) {
          return (
            <Link
              key={key}
              href={href}
              title={node.title}
              className="font-medium text-primary underline decoration-primary/40 underline-offset-4 transition-colors hover:decoration-primary"
            >
              {renderInlineAst(node.children, `${key}-l`)}
            </Link>
          )
        }

        const isHash = href.startsWith('#')
        return (
          <a
            key={key}
            href={href}
            title={node.title}
            target={isHash ? undefined : '_blank'}
            rel={isHash ? undefined : 'noopener noreferrer'}
            className="font-medium text-primary underline decoration-primary/40 underline-offset-4 transition-colors hover:decoration-primary"
          >
            {renderInlineAst(node.children, `${key}-a`)}
          </a>
        )
      }

      default:
        return null
    }
  })
}

export function renderInlineMarkdown(text: string, keyPrefix = 'inl'): ReactNode[] {
  return renderInlineAst(parseInlineMarkdownToAst(text), keyPrefix)
}

function resolveCalloutConfig(kind: MdxCalloutKind): {
  variant: 'default' | 'info' | 'success' | 'warning' | 'destructive'
  defaultTitle: string | undefined
  icon: ReactNode
} {
  switch (kind) {
    case 'tip':
      return {
        variant: 'success',
        defaultTitle: 'Tip',
        icon: <Lightbulb className="h-4 w-4" />,
      }
    case 'important':
      return {
        variant: 'info',
        defaultTitle: 'Important',
        icon: <Sparkles className="h-4 w-4" />,
      }
    case 'warning':
      return {
        variant: 'warning',
        defaultTitle: 'Warning',
        icon: <AlertTriangle className="h-4 w-4" />,
      }
    case 'caution':
      return {
        variant: 'destructive',
        defaultTitle: 'Caution',
        icon: <ShieldAlert className="h-4 w-4" />,
      }
    case 'note':
      return {
        variant: 'info',
        defaultTitle: 'Note',
        icon: <Info className="h-4 w-4" />,
      }
    case 'quote':
      return {
        variant: 'default',
        defaultTitle: undefined,
        icon: <Quote className="h-4 w-4 text-muted-foreground" />,
      }
  }
}

function collectCodeBlocksRecursively(
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

function renderBlockList(
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
        <div key={key} className="my-5 overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {block.headers.map((headerInlines, colIdx) => {
                  const align = block.alignments[colIdx] ?? 'left'
                  const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
                  const thKey = `${key}-th-${colIdx}`
                  return (
                    <th
                      key={thKey}
                      className={`px-3.5 py-2.5 font-mono text-xs font-semibold text-foreground ${alignClass}`}
                    >
                      {renderInlineAst(headerInlines, thKey)}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {block.rows.map((row, rowIdx) => {
                const trKey = `${key}-tr-${rowIdx}`
                return (
                  <tr key={trKey} className="transition-colors hover:bg-muted/25">
                    {row.map((cellInlines, colIdx) => {
                      const align = block.alignments[colIdx] ?? 'left'
                      const alignClass =
                        align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
                      const tdKey = `${trKey}-td-${colIdx}`
                      return (
                        <td key={tdKey} className={`px-3.5 py-2.5 align-top text-muted-foreground ${alignClass}`}>
                          {renderInlineAst(cellInlines, tdKey)}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
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
        <div key={key} className="my-5 overflow-hidden rounded-xl border border-code-border bg-code-bg shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-code-border bg-code-header px-3.5 py-2">
            <div className="flex min-w-0 items-center gap-2 font-mono text-[11px]">
              <span className="rounded border border-code-border bg-background/70 px-1.5 py-0.5 uppercase tracking-wider text-foreground">
                {block.language}
              </span>
              {block.title ? <span className="truncate text-muted-foreground">{block.title}</span> : null}
            </div>
            <CodeCopyButton code={block.code} />
          </div>

          <div
            className="text-xs leading-relaxed [&_code]:font-mono [&_pre]:overflow-x-auto [&_pre]:bg-transparent [&_pre]:p-4"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: Trusted build-time Shiki syntax highlighter HTML generated strictly on the server from repo .mdx files
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        </div>
      )
    }

    if (block.type === 'component') {
      return <MdxInteractiveWidget key={key} name={block.name} widgetProps={block.props} />
    }

    return null
  })
}

export async function MdxArticleRenderer({ blocks }: { blocks: readonly MdxBlock[] }) {
  // Highlight all code blocks (including nested ones inside callouts/lists) in parallel at SSG time (0 KB client JS)
  const codeTargets: Array<{ pathKey: string; code: string; language: string }> = []
  collectCodeBlocksRecursively(blocks, 'root', codeTargets)

  const highlightedByPath = new Map<string, string>()
  await Promise.all(
    codeTargets.map(async (target) => {
      const html = await highlightCodeServer(target.code, target.language)
      highlightedByPath.set(target.pathKey, html)
    }),
  )

  return (
    <div className="space-y-4 text-sm leading-relaxed text-foreground sm:text-base">
      {renderBlockList(blocks, 'root', highlightedByPath)}
    </div>
  )
}
