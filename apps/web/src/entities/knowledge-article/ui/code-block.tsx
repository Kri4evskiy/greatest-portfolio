import { CodeCopyButton } from './code-copy-button'

interface MdxCodeBlockProps {
  language: string
  title?: string | undefined
  code: string
  highlightedHtml: string
}

export function MdxCodeBlock({ language, title, code, highlightedHtml }: MdxCodeBlockProps) {
  return (
    <div className="my-5 overflow-hidden rounded-xl border border-code-border bg-code-bg shadow-xs">
      <div className="flex items-center justify-between gap-2 border-b border-code-border bg-code-header px-3.5 py-2">
        <div className="flex min-w-0 items-center gap-2 font-mono text-[11px]">
          <span className="rounded-sm border border-code-border bg-background/70 px-1.5 py-0.5 uppercase tracking-wider text-foreground">
            {language}
          </span>
          {title ? <span className="truncate text-muted-foreground">{title}</span> : null}
        </div>
        <CodeCopyButton code={code} />
      </div>

      <div
        className="text-xs leading-relaxed [&_code]:font-mono [&_pre]:overflow-x-auto [&_pre]:bg-transparent [&_pre]:p-4"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Trusted build-time Shiki syntax highlighter HTML generated strictly on the server from repo .mdx files
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      />
    </div>
  )
}
