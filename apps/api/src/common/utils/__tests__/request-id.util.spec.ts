import { describe, expect, it } from 'vitest'
import { resolveCorrelationRequestId } from '../request-id.util.js'

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

describe('resolveCorrelationRequestId (Correlation ID & Log Injection guard)', () => {
  it('accepts safe trimmed alphanumeric, underscore, and hyphen request IDs between 8 and 64 chars', () => {
    expect(resolveCorrelationRequestId('  req_trace-2026_01  ')).toBe('req_trace-2026_01')
    expect(resolveCorrelationRequestId('abcdefgh')).toBe('abcdefgh')
    expect(resolveCorrelationRequestId('a'.repeat(64))).toBe('a'.repeat(64))
  })

  it('rejects CRLF / log injection, invalid symbols, and out-of-bounds lengths by issuing a fresh UUID v4', () => {
    expect(resolveCorrelationRequestId(undefined)).toMatch(UUID_V4_REGEX)
    expect(resolveCorrelationRequestId('   ')).toMatch(UUID_V4_REGEX)
    expect(resolveCorrelationRequestId('short7')).toMatch(UUID_V4_REGEX)
    expect(resolveCorrelationRequestId('x'.repeat(65))).toMatch(UUID_V4_REGEX)
    expect(resolveCorrelationRequestId('req-12345678\r\n[INFO] forged')).toMatch(UUID_V4_REGEX)
    expect(resolveCorrelationRequestId('../etc/passwd')).toMatch(UUID_V4_REGEX)
  })
})
