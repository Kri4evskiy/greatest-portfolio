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

export async function highlightCodeServer(code: string, rawLanguage: string): Promise<string> {
  const normalized = rawLanguage.trim().toLowerCase()
  const lang = LANGUAGE_ALIASES[normalized] ?? (normalized || 'typescript')

  try {
    return await codeToHtml(code, {
      lang,
      theme: 'github-dark-default',
    })
  } catch {
    try {
      return await codeToHtml(code, {
        lang: 'text',
        theme: 'github-dark-default',
      })
    } catch {
      return `<pre class="shiki"><code>${escapeHtmlFallback(code)}</code></pre>`
    }
  }
}
