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

export async function highlightCodeServer(code: string, rawLanguage: string): Promise<string> {
  const normalized = rawLanguage.trim().toLowerCase()
  const lang = LANGUAGE_ALIASES[normalized] ?? (normalized || 'typescript')

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
