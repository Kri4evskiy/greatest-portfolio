import { randomUUID } from 'node:crypto'
import type { Request } from 'express'

export const REQUEST_ID_HEADER = 'X-Request-Id'
const SAFE_REQUEST_ID_REGEX = /^[A-Za-z0-9_-]{8,64}$/

export type RequestWithCorrelationId = Request & { requestId?: string }

/**
 * Resolves a validated correlation ID from the incoming X-Request-Id header
 * (guarded against CRLF / Log Injection) or generates a new UUID v4.
 */
export function resolveCorrelationRequestId(incomingHeaderValue?: string): string {
  const trimmed = incomingHeaderValue?.trim()
  return trimmed && SAFE_REQUEST_ID_REGEX.test(trimmed) ? trimmed : randomUUID()
}
