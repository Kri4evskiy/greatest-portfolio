import type { ReactNode } from 'react'
import {
  classifySafeMarkdownLink,
  isSafeMarkdownImageSrc,
  type MdxInlineNode,
  parseInlineMarkdownToAst,
} from '@/entities/knowledge-content'
import { Link } from '@/shared/i18n/navigation'

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
        if (!isSafeMarkdownImageSrc(node.url)) {
          return null
        }
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
        const { href, kind } = classifySafeMarkdownLink(node.url)
        if (!href) {
          return (
            <span key={key} title={node.title} className="font-medium text-muted-foreground">
              {renderInlineAst(node.children, `${key}-span`)}
            </span>
          )
        }

        if (kind === 'internal') {
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

        const isHash = kind === 'hash'
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
