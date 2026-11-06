import { Callout } from '@repo/ui'
import { AlertTriangle, CheckSquare, Hash, Info, Lightbulb, Quote, ShieldAlert, Sparkles, Square } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from '@/i18n/navigation'
import type { MdxBlock, MdxCalloutKind } from '@/lib/mdx-content'
import { highlightCodeServer } from '@/lib/shiki-highlighter'
import { CodeCopyButton } from './code-copy-button'
import { MdxInteractiveWidget } from './mdx-client-widgets'

const INLINE_TOKEN_REGEX = /(`[^`]+`|\*\*[^*]+\*\*|~~[^~]+~~|\[[^\]]+\]\([^)]+\)|\*[^*\s][^*]*\*)/g

export function renderInlineMarkdown(text: string, keyPrefix = 'inl'): ReactNode[] {
  const parts = text.split(INLINE_TOKEN_REGEX)
  const nodes: ReactNode[] = []

  for (let idx = 0; idx < parts.length; idx += 1) {
    const part = parts[idx]
    if (!part) continue
    const key = `${keyPrefix}-${idx}`

    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      nodes.push(
        <code
          key={key}
          className="rounded border border-border/70 bg-muted/70 px-1.5 py-0.5 font-mono text-[0.85em] font-medium text-foreground"
        >
          {part.slice(1, -1)}
        </code>,
      )
      continue
    }

    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      nodes.push(
        <strong key={key} className="font-semibold text-foreground">
          {renderInlineMarkdown(part.slice(2, -2), `${key}-b`)}
        </strong>,
      )
      continue
    }

    if (part.startsWith('~~') && part.endsWith('~~') && part.length >= 4) {
      nodes.push(
        <del key={key} className="line-through opacity-70">
          {renderInlineMarkdown(part.slice(2, -2), `${key}-s`)}
        </del>,
      )
      continue
    }

    if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
      const splitIdx = part.indexOf('](')
      const label = part.slice(1, splitIdx)
      const href = part.slice(splitIdx + 2, -1).trim()

      if (href.startsWith('/')) {
        nodes.push(
          <Link
            key={key}
            href={href}
            className="font-medium text-primary underline decoration-primary/40 underline-offset-4 transition-colors hover:decoration-primary"
          >
            {renderInlineMarkdown(label, `${key}-l`)}
          </Link>,
        )
      } else {
        const isHash = href.startsWith('#')
        nodes.push(
          <a
            key={key}
            href={href}
            target={isHash ? undefined : '_blank'}
            rel={isHash ? undefined : 'noopener noreferrer'}
            className="font-medium text-primary underline decoration-primary/40 underline-offset-4 transition-colors hover:decoration-primary"
          >
            {renderInlineMarkdown(label, `${key}-a`)}
          </a>,
        )
      }
      continue
    }

    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      nodes.push(
        <em key={key} className="italic text-foreground/90">
          {renderInlineMarkdown(part.slice(1, -1), `${key}-i`)}
        </em>,
      )
      continue
    }

    nodes.push(part)
  }

  return nodes
}

function resolveCalloutConfig(kind: MdxCalloutKind): {
  variant: 'default' | 'info' | 'success' | 'warning'
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
        variant: 'warning',
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

export async function MdxArticleRenderer({ blocks }: { blocks: readonly MdxBlock[] }) {
  // Highlight all code blocks in parallel at SSG / RSC render time (0 KB client JS)
  const highlightedByIndex = new Map<number, string>()
  await Promise.all(
    blocks.map(async (block, idx) => {
      if (block.type === 'code') {
        const html = await highlightCodeServer(block.code, block.language)
        highlightedByIndex.set(idx, html)
      }
    }),
  )

  return (
    <div className="space-y-4 text-sm leading-relaxed text-foreground sm:text-base">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`

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
                <span>{renderInlineMarkdown(block.text, key)}</span>
                <a
                  href={`#${block.id}`}
                  aria-label={block.plainText}
                  className="opacity-0 transition-opacity group-hover:opacity-60 hover:!opacity-100"
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
                <span>{renderInlineMarkdown(block.text, key)}</span>
                <a
                  href={`#${block.id}`}
                  aria-label={block.plainText}
                  className="opacity-0 transition-opacity group-hover:opacity-60 hover:!opacity-100"
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
              {renderInlineMarkdown(block.text, key)}
            </h4>
          )
        }

        if (block.type === 'paragraph') {
          return (
            <p key={key} className="leading-relaxed text-muted-foreground">
              {renderInlineMarkdown(block.text, key)}
            </p>
          )
        }

        if (block.type === 'list') {
          const ListTag = block.ordered ? 'ol' : 'ul'
          return (
            <ListTag
              key={key}
              className={`space-y-2 pl-5 text-muted-foreground ${block.ordered ? 'list-decimal' : 'list-disc'}`}
            >
              {block.items.map((item, itemIdx) => {
                const itemKey = `${key}-item-${itemIdx}`
                return (
                  <li key={itemKey} className={item.checked !== undefined ? 'list-none -ml-5' : undefined}>
                    <div className="flex items-start gap-2">
                      {item.checked !== undefined ? (
                        item.checked ? (
                          <CheckSquare className="mt-1 h-4 w-4 shrink-0 text-emerald-500" />
                        ) : (
                          <Square className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                        )
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <span>{renderInlineMarkdown(item.text, itemKey)}</span>
                        {item.subItems.length > 0 ? (
                          <ul className="mt-1.5 list-circle space-y-1 border-l border-border/70 pl-4 text-xs sm:text-sm">
                            {item.subItems.map((sub) => (
                              <li key={`${itemKey}-${sub}`}>
                                {renderInlineMarkdown(sub, `${itemKey}-${sub.slice(0, 20)}`)}
                              </li>
                            ))}
                          </ul>
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
                    {block.headers.map((headerText, colIdx) => {
                      const align = block.alignments[colIdx] ?? 'left'
                      const alignClass =
                        align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
                      const thKey = `${key}-th-${headerText}`
                      return (
                        <th
                          key={thKey}
                          className={`px-3.5 py-2.5 font-mono text-xs font-semibold text-foreground ${alignClass}`}
                        >
                          {renderInlineMarkdown(headerText, thKey)}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {block.rows.map((row) => {
                    const trKey = `${key}-tr-${row.join('|')}`
                    return (
                      <tr key={trKey} className="transition-colors hover:bg-muted/25">
                        {row.map((cellText, colIdx) => {
                          const align = block.alignments[colIdx] ?? 'left'
                          const alignClass =
                            align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
                          const colHeader = block.headers[colIdx] ?? 'col'
                          const tdKey = `${trKey}-${colHeader}-${cellText}`
                          return (
                            <td key={tdKey} className={`px-3.5 py-2.5 align-top text-muted-foreground ${alignClass}`}>
                              {renderInlineMarkdown(cellText, tdKey)}
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
              <div className="space-y-1.5 text-xs leading-relaxed sm:text-sm">
                {block.lines.map((lineText) => (
                  <p key={`${key}-cl-${lineText}`}>
                    {renderInlineMarkdown(lineText, `${key}-cl-${lineText.slice(0, 20)}`)}
                  </p>
                ))}
              </div>
            </Callout>
          )
        }

        if (block.type === 'code') {
          const highlightedHtml = highlightedByIndex.get(index) ?? ''
          return (
            <div key={key} className="my-5 overflow-hidden rounded-xl border border-slate-800 bg-[#0d1117] shadow-sm">
              <div className="flex items-center justify-between gap-2 border-b border-slate-800/90 bg-slate-900/70 px-3.5 py-2">
                <div className="flex min-w-0 items-center gap-2 font-mono text-[11px]">
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 uppercase tracking-wider text-slate-300">
                    {block.language}
                  </span>
                  {block.title ? <span className="truncate text-slate-400">{block.title}</span> : null}
                </div>
                <CodeCopyButton code={block.code} />
              </div>

              <div
                className="text-xs leading-relaxed [&_code]:font-mono [&_pre]:!bg-transparent [&_pre]:overflow-x-auto [&_pre]:p-4"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: Trusted build-time Shiki syntax highlighter HTML generated strictly on the server from repo .mdx files
                dangerouslySetInnerHTML={{ __html: highlightedHtml }}
              />
            </div>
          )
        }

        if (block.type === 'component') {
          return <MdxInteractiveWidget key={key} name={block.name} />
        }

        return null
      })}
    </div>
  )
}
