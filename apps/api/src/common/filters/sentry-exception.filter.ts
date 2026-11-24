import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common'
import type { Response } from 'express'
import { appConfig } from '../../config/app.config.js'
import { sanitizeLogValue } from '../utils/log-sanitizer.util.js'
import type { RequestWithCorrelationId } from '../utils/request-id.util.js'

@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SentryExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<RequestWithCorrelationId>()
    const requestId = request.requestId
    const safeUrl = sanitizeLogValue(request.url)

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : { message: 'Internal server error' }

    if (status >= 500) {
      this.logger.error(
        `[5xx Exception] ${request.method} ${safeUrl} [reqId:${requestId ?? 'n/a'}] (Sentry DSN: ${appConfig.sentryDsn ? 'active' : 'noop'})`,
        exception instanceof Error ? exception.stack : String(exception),
      )
    }

    // Guard against ERR_HTTP_HEADERS_SENT crashes: when an error occurs mid-stream
    // (e.g. client disconnects during an active SSE /api/telemetry/stream response),
    // HTTP headers have already been flushed and attempting to write a JSON error body
    // would throw an uncaught Node.js error and terminate the worker process.
    if (response.headersSent) {
      return
    }

    response.status(status).json({
      statusCode: status,
      path: safeUrl,
      ...(requestId ? { requestId } : {}),
      timestamp: new Date().toISOString(),
      ...(typeof exceptionResponse === 'string'
        ? { message: exceptionResponse }
        : (exceptionResponse as Record<string, unknown>)),
    })
  }
}
