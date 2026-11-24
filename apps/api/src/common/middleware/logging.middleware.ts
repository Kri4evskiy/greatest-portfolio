import { Injectable, Logger, type NestMiddleware } from '@nestjs/common'
import type { NextFunction, Response } from 'express'
import { sanitizeLogValue } from '../utils/log-sanitizer.util.js'
import {
  REQUEST_ID_HEADER,
  type RequestWithCorrelationId,
  resolveCorrelationRequestId,
} from '../utils/request-id.util.js'

/**
 * Express middleware attaching a validated X-Request-Id correlation header
 * and logging incoming HTTP requests with response latency.
 */
@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoggingMiddleware.name)

  use(req: RequestWithCorrelationId, res: Response, next: NextFunction): void {
    const requestId = resolveCorrelationRequestId(req.header(REQUEST_ID_HEADER))

    req.requestId = requestId
    res.setHeader(REQUEST_ID_HEADER, requestId)

    const startedAt = Date.now()
    res.on('finish', () => {
      const durationMs = Date.now() - startedAt
      this.logger.verbose(
        `${req.method} ${sanitizeLogValue(req.originalUrl)} -> ${res.statusCode} (${durationMs}ms) [reqId:${requestId}]`,
      )
    })
    next()
  }
}
