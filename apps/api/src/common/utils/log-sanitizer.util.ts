const ANSI_ESCAPE_REGEX = new RegExp(`${String.fromCharCode(0x1b)}\\[[0-9;]*[a-zA-Z]`, 'g')

/**
 * Strips ANSI escape sequences, CR/LF, and ASCII control characters from user-controlled
 * strings (URLs, telemetry messages) before writing to structured logs to prevent Log Forging.
 */
export function sanitizeLogValue(value: string, maxLength = 300): string {
  const withoutAnsi = value.replace(ANSI_ESCAPE_REGEX, '')
  let cleaned = ''
  for (let i = 0; i < withoutAnsi.length; i += 1) {
    const code = withoutAnsi.charCodeAt(i)
    cleaned += code < 0x20 || code === 0x7f ? ' ' : withoutAnsi[i]
  }
  const trimmed = cleaned.trim()
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength)}…` : trimmed
}
