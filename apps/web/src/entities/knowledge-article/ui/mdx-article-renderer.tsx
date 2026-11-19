import { Callout } from '@repo/ui'
import { type Components, toJsxRuntime } from 'hast-util-to-jsx-runtime'
import { CheckSquare, Hash, Square } from 'lucide-react'
import type { ReactNode } from 'react'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import {
  classifySafeMarkdownLink,
  type HastRoot,
  highlightCodeServer,
  isSafeMarkdownImageSrc,
  type MdxCalloutKind,
  type MdxCodeBlockMeta,
  type MdxWidgetName,
  parseInlineMarkdownToHast,
  SUPPORTED_MDX_WIDGETS,
} from '@/entities/knowledge-content'
import { MdxInteractiveWidget } from '@/features/kb-sandboxes/ui/mdx-client-widgets'
import { Link } from '@/shared/i18n/navigation'
import { resolveCalloutConfig } from './callout-config'
import { MdxCodeBlock } from './code-block'

type DataAttributes = Readonly<Record<string, unknown>>

function getStringAttr(props: unknown, key: string): string | undefined {
  if (!props || typeof props !== 'object') return undefined
  const value = (props as DataAttributes)[key]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function parseWidgetPropsJson(rawJson: string | undefined): Record<string, string> {
  if (!rawJson) return {}
  try {
    const parsed: unknown = JSON.parse(rawJson)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const out: Record<string, string> = {}
    for (const [key, val] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof val === 'string') {
        out[key] = val
      }
    }
    return out
  } catch {
    return {}
  }
}

const inlineHastComponents: Partial<Components> = {
  code: ({ children }) => (
    <code className="rounded-sm border border-border/70 bg-muted/70 px-1.5 py-0.5 font-mono text-[0.85em] font-medium text-foreground">
      {children}
    </code>
  ),
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic text-foreground/90">{children}</em>,
  del: ({ children }) => <del className="line-through opacity-70">{children}</del>,
  br: () => <br />,
  img: ({ src, alt, title }) => {
    if (typeof src !== 'string' || !isSafeMarkdownImageSrc(src)) {
      return null
    }
    return (
      // biome-ignore lint/performance/noImgElement: Arbitrary Markdown inline image URLs inside .mdx content
      <img
        src={src}
        alt={alt ?? ''}
        title={title}
        loading="lazy"
        className="my-2 inline-block max-h-80 max-w-full rounded-lg border border-border"
      />
    )
  },
  a: ({ href, title, children }) => {
    const { href: safeHref, kind } = classifySafeMarkdownLink(href ?? '')
    if (!safeHref) {
      return (
        <span title={title} className="font-medium text-muted-foreground">
          {children}
        </span>
      )
    }

    if (kind === 'internal') {
      return (
        <Link
          href={safeHref}
          title={title}
          className="font-medium text-primary underline decoration-primary/40 underline-offset-4 transition-colors hover:decoration-primary"
        >
          {children}
        </Link>
      )
    }

    const isHash = kind === 'hash'
    return (
      <a
        href={safeHref}
        title={title}
        target={isHash ? undefined : '_blank'}
        rel={isHash ? undefined : 'noopener noreferrer'}
        className="font-medium text-primary underline decoration-primary/40 underline-offset-4 transition-colors hover:decoration-primary"
      >
        {children}
      </a>
    )
  },
}

function createBlockHastComponents(
  codeMetaById: ReadonlyMap<string, MdxCodeBlockMeta>,
  highlightedById: ReadonlyMap<string, string>,
): Partial<Components> {
  return {
    ...inlineHastComponents,
    h2: (props) => {
      const id = props.id
      const headingText = getStringAttr(props, 'data-heading-text') ?? id
      return (
        <h2
          id={id}
          className="group mt-9 flex scroll-mt-24 items-center gap-2 border-b border-border/60 pb-2 text-xl font-bold tracking-tight"
        >
          <span>{props.children}</span>
          {id ? (
            <a
              href={`#${id}`}
              aria-label={headingText}
              className="opacity-0 transition-opacity group-hover:opacity-60 hover:opacity-100 focus-visible:opacity-100"
            >
              <Hash className="h-4 w-4 text-muted-foreground" />
            </a>
          ) : null}
        </h2>
      )
    },
    h3: (props) => {
      const id = props.id
      const headingText = getStringAttr(props, 'data-heading-text') ?? id
      return (
        <h3
          id={id}
          className="group mt-6 flex scroll-mt-24 items-center gap-1.5 text-base font-semibold tracking-tight text-foreground sm:text-lg"
        >
          <span>{props.children}</span>
          {id ? (
            <a
              href={`#${id}`}
              aria-label={headingText}
              className="opacity-0 transition-opacity group-hover:opacity-60 hover:opacity-100 focus-visible:opacity-100"
            >
              <Hash className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
          ) : null}
        </h3>
      )
    },
    h4: ({ id, children }) => (
      <h4
        id={id}
        className="mt-4 scroll-mt-24 font-mono text-xs font-semibold uppercase tracking-wider text-foreground/90 sm:text-sm"
      >
        {children}
      </h4>
    ),
    p: ({ children }) => <p className="leading-relaxed text-muted-foreground">{children}</p>,
    hr: () => <hr className="my-8 border-border/70" />,
    figure: (props) => {
      const src = getStringAttr(props, 'data-figure-src')
      if (!src || !isSafeMarkdownImageSrc(src)) {
        return null
      }
      const alt = getStringAttr(props, 'data-figure-alt') ?? ''
      const caption = getStringAttr(props, 'data-figure-caption')
      return (
        <figure className="my-6 overflow-hidden rounded-xl border border-border bg-card p-2 shadow-xs">
          {/* biome-ignore lint/performance/noImgElement: Static and external Markdown figures inside .mdx content */}
          <img
            src={src}
            alt={alt}
            loading="lazy"
            className="mx-auto max-h-[480px] w-auto max-w-full rounded-lg object-contain"
          />
          {caption ? (
            <figcaption className="mt-2 px-2 pb-1 text-center font-mono text-xs text-muted-foreground">
              {caption}
            </figcaption>
          ) : null}
        </figure>
      )
    },
    ul: (props) => {
      const isNested = getStringAttr(props, 'data-nested-list') === 'true'
      return (
        <ul className={`list-disc space-y-2 pl-5 text-muted-foreground ${isNested ? 'mt-1.5 text-xs sm:text-sm' : ''}`}>
          {props.children}
        </ul>
      )
    },
    ol: (props) => {
      const isNested = getStringAttr(props, 'data-nested-list') === 'true'
      return (
        <ol
          className={`list-decimal space-y-2 pl-5 text-muted-foreground ${isNested ? 'mt-1.5 text-xs sm:text-sm' : ''}`}
        >
          {props.children}
        </ol>
      )
    },
    li: (props) => {
      const taskChecked = getStringAttr(props, 'data-task-checked')
      if (taskChecked === 'true' || taskChecked === 'false') {
        const isChecked = taskChecked === 'true'
        return (
          <li className="list-none -ml-5">
            <div className="flex items-start gap-2">
              {isChecked ? (
                <CheckSquare className="mt-1 h-4 w-4 shrink-0 text-success" />
              ) : (
                <Square className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1 space-y-2 [&>p]:inline">{props.children}</div>
            </div>
          </li>
        )
      }
      return <li className="leading-relaxed [&>p]:inline">{props.children}</li>
    },
    table: ({ children }) => (
      <div className="my-5 overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
        <table className="w-full border-collapse text-left text-xs sm:text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="border-b border-border bg-muted/50">{children}</thead>,
    tbody: ({ children }) => <tbody className="divide-y divide-border/60">{children}</tbody>,
    tr: ({ children }) => <tr className="transition-colors hover:bg-muted/25">{children}</tr>,
    th: (props) => {
      const align = getStringAttr(props, 'data-align')
      const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
      return (
        <th className={`px-3.5 py-2.5 font-mono text-xs font-semibold text-foreground ${alignClass}`}>
          {props.children}
        </th>
      )
    },
    td: (props) => {
      const align = getStringAttr(props, 'data-align')
      const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
      return <td className={`px-3.5 py-2.5 align-top text-muted-foreground ${alignClass}`}>{props.children}</td>
    },
    blockquote: (props) => {
      const rawKind = getStringAttr(props, 'data-callout-kind') ?? 'quote'
      const kind = (
        ['note', 'tip', 'important', 'warning', 'caution', 'quote'].includes(rawKind) ? rawKind : 'quote'
      ) as MdxCalloutKind
      const customTitle = getStringAttr(props, 'data-callout-title')
      const cfg = resolveCalloutConfig(kind)
      const resolvedTitle = customTitle ?? cfg.defaultTitle

      return (
        <Callout
          variant={cfg.variant}
          icon={cfg.icon}
          className="my-4"
          {...(resolvedTitle ? { title: resolvedTitle } : {})}
        >
          <div className="space-y-2 text-xs leading-relaxed sm:text-sm">{props.children}</div>
        </Callout>
      )
    },
    pre: (props) => {
      const codeId = getStringAttr(props, 'data-code-id')
      if (!codeId) {
        return <pre className="my-4 overflow-x-auto rounded-lg bg-muted p-4 font-mono text-xs">{props.children}</pre>
      }
      const meta = codeMetaById.get(codeId)
      if (!meta) return null
      const highlightedHtml = highlightedById.get(codeId) ?? ''
      return (
        <MdxCodeBlock language={meta.language} title={meta.title} code={meta.code} highlightedHtml={highlightedHtml} />
      )
    },
    div: (props) => {
      const widgetName = getStringAttr(props, 'data-mdx-widget')
      if (widgetName && SUPPORTED_MDX_WIDGETS.has(widgetName as MdxWidgetName)) {
        const widgetProps = parseWidgetPropsJson(getStringAttr(props, 'data-widget-props'))
        const childrenPayload = getStringAttr(props, 'data-widget-payload')
        return (
          <MdxInteractiveWidget
            name={widgetName as MdxWidgetName}
            widgetProps={widgetProps}
            childrenPayload={childrenPayload}
          />
        )
      }
      return <div>{props.children}</div>
    },
  }
}

export function renderInlineMarkdown(text: string, _keyPrefix?: string): ReactNode {
  const hast = parseInlineMarkdownToHast(text)
  return toJsxRuntime(hast, {
    Fragment,
    jsx,
    jsxs,
    components: inlineHastComponents,
  })
}

export async function MdxArticleRenderer({
  hast,
  codeBlocks,
}: {
  hast: HastRoot
  codeBlocks: readonly MdxCodeBlockMeta[]
}) {
  const codeMetaById = new Map<string, MdxCodeBlockMeta>()
  const highlightedById = new Map<string, string>()

  await Promise.all(
    codeBlocks.map(async (target) => {
      codeMetaById.set(target.id, target)
      const html = await highlightCodeServer(target.code, target.language)
      highlightedById.set(target.id, html)
    }),
  )

  const components = createBlockHastComponents(codeMetaById, highlightedById)

  return (
    <div className="space-y-4 text-sm leading-relaxed text-foreground sm:text-base">
      {toJsxRuntime(hast, {
        Fragment,
        jsx,
        jsxs,
        components,
      })}
    </div>
  )
}
