import { Injectable, Logger, type NestMiddleware } from '@nestjs/common'
import type { NextFunction, Request, Response } from 'express'

/**
 * Express middleware logging incoming HTTP requests and response latency.
 */
@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoggingMiddleware.name)

  use(req: Request, res: Response, next: NextFunction): void {
    const startedAt = Date.now()
    res.on('finish', () => {
      const durationMs = Date.now() - startedAt
      this.logger.verbose(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs}ms)`)
    })
    next()
  }
}
