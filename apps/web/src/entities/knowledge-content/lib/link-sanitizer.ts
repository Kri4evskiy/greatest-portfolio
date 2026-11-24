export function classifySafeMarkdownLink(rawUrl: string): {
  href: string | null
  kind: 'internal' | 'hash' | 'external'
} {
  const trimmed = rawUrl.trim()
  if (!trimmed) {
    return { href: null, kind: 'external' }
  }
  if (trimmed.startsWith('#')) {
    return { href: trimmed, kind: 'hash' }
  }
  if (
    (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\')) ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('../')
  ) {
    return { href: trimmed, kind: 'internal' }
  }
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'mailto:') {
      return { href: trimmed, kind: 'external' }
    }
  } catch {
    // Reject unknown schemes or malformed URIs
  }
  return { href: null, kind: 'external' }
}

export function isSafeMarkdownImageSrc(rawUrl: string): boolean {
  const trimmed = rawUrl.trim()
  if (!trimmed) {
    return false
  }
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\')) {
    return true
  }
  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}
