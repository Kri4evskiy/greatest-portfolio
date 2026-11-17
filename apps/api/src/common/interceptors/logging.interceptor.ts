import { type CallHandler, type ExecutionContext, Injectable, Logger, type NestInterceptor } from '@nestjs/common'
import type { Request, Response } from 'express'
import { type Observable, tap } from 'rxjs'

/**
 * Cross-cutting interceptor that logs HTTP request completion time and status code.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name)

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle()
    }

    const http = context.switchToHttp()
    const request = http.getRequest<Request>()
    const response = http.getResponse<Response>()
    const startedAt = Date.now()

    return next.handle().pipe(
      tap(() => {
        const durationMs = Date.now() - startedAt
        this.logger.debug(`${request.method} ${request.originalUrl} ${response.statusCode} (${durationMs}ms)`)
      }),
    )
  }
}
