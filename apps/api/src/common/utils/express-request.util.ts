import type { SessionProfile } from '@repo/shared-schemas'
import type { Request } from 'express'

export interface RequestWithSession extends Request {
  requestId?: string
  sessionProfile?: SessionProfile
}

/**
 * Safely extracts a string cookie value from cookie-parser's untyped `req.cookies` bag
 * using runtime type narrowing instead of unsafe type assertions.
 */
export function extractCookieString(request: Request, cookieName: string): string | undefined {
  const cookies: unknown = request.cookies
  if (typeof cookies !== 'object' || cookies === null) {
    return undefined
  }
  const value = (cookies as Record<string, unknown>)[cookieName]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}
