import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common'
import type { Response } from 'express'
import { appConfig } from '../../config/app.config.js'
import type { RequestWithCorrelationId } from '../utils/request-id.util.js'

@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SentryExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<RequestWithCorrelationId>()
    const requestId = request.requestId

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : { message: 'Internal server error' }

    if (status >= 500) {
      this.logger.error(
        `[5xx Exception] ${request.method} ${request.url} [reqId:${requestId ?? 'n/a'}] (Sentry DSN: ${appConfig.sentryDsn ? 'active' : 'noop'})`,
        exception instanceof Error ? exception.stack : String(exception),
      )
    }

    response.status(status).json({
      statusCode: status,
      path: request.url,
      ...(requestId ? { requestId } : {}),
      timestamp: new Date().toISOString(),
      ...(typeof exceptionResponse === 'string'
        ? { message: exceptionResponse }
        : (exceptionResponse as Record<string, unknown>)),
    })
  }
}
