import { codeToHtml } from 'shiki'

const LANGUAGE_ALIASES: Record<string, string> = {
  ts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  jsx: 'jsx',
  mjs: 'javascript',
  cjs: 'javascript',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  yml: 'yaml',
  docker: 'dockerfile',
  md: 'markdown',
  mdx: 'mdx',
  plaintext: 'text',
  txt: 'text',
}

function escapeHtmlFallback(raw: string): string {
  return raw
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

const SHIKI_THEMES = {
  light: 'github-light-default',
  dark: 'github-dark-default',
} as const

const globalForShiki = globalThis as unknown as {
  __kbShikiCache?: Map<string, Promise<string>>
}

const shikiCache: Map<string, Promise<string>> = globalForShiki.__kbShikiCache ?? new Map<string, Promise<string>>()
globalForShiki.__kbShikiCache = shikiCache

async function renderHighlightedHtml(code: string, lang: string): Promise<string> {
  try {
    return await codeToHtml(code, {
      lang,
      themes: SHIKI_THEMES,
      defaultColor: false,
    })
  } catch {
    try {
      return await codeToHtml(code, {
        lang: 'text',
        themes: SHIKI_THEMES,
        defaultColor: false,
      })
    } catch {
      return `<pre class="shiki"><code>${escapeHtmlFallback(code)}</code></pre>`
    }
  }
}

export function highlightCodeServer(code: string, rawLanguage: string): Promise<string> {
  const normalized = rawLanguage.trim().toLowerCase()
  const lang = LANGUAGE_ALIASES[normalized] ?? (normalized || 'typescript')
  const cacheKey = `${lang}\0${code}`

  const existing = shikiCache.get(cacheKey)
  if (existing) {
    return existing
  }

  const promise = renderHighlightedHtml(code, lang)
  if (shikiCache.size > 1000) {
    shikiCache.clear()
  }
  shikiCache.set(cacheKey, promise)
  return promise
}
