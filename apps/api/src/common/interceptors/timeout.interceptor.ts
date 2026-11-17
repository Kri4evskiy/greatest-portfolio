import {
  type CallHandler,
  type ExecutionContext,
  Inject,
  Injectable,
  type NestInterceptor,
  RequestTimeoutException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { catchError, type Observable, TimeoutError, throwError, timeout } from 'rxjs'
import { SKIP_TIMEOUT_KEY } from '../decorators/skip-timeout.decorator.js'

const DEFAULT_TIMEOUT_MS = 15_000
const NEST_SSE_METADATA_KEY = '__sse__'

/**
 * Global HTTP timeout interceptor (15s) protecting against hung DB or microservice calls.
 * Automatically bypasses `@Sse()` endpoints and handlers decorated with `@SkipTimeout()`.
 */
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle()
    }

    const isSse = this.reflector.get<boolean | undefined>(NEST_SSE_METADATA_KEY, context.getHandler()) === true
    const skipTimeout =
      this.reflector.getAllAndOverride<boolean | undefined>(SKIP_TIMEOUT_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) === true

    if (isSse || skipTimeout) {
      return next.handle()
    }

    return next.handle().pipe(
      timeout(DEFAULT_TIMEOUT_MS),
      catchError((error: unknown) => {
        if (error instanceof TimeoutError) {
          return throwError(() => new RequestTimeoutException('Request timed out'))
        }
        return throwError(() => error)
      }),
    )
  }
}
