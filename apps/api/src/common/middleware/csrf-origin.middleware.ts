import { Injectable, Logger, type NestMiddleware } from '@nestjs/common'
import type { NextFunction, Request, Response } from 'express'
import { appConfig } from '../../config/app.config.js'
import { sanitizeLogValue } from '../utils/log-sanitizer.util.js'

const MUTATING_HTTP_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/**
 * Defense-in-depth CSRF & Content-Type guard for state-changing API mutations:
 * 1. Rejects non-JSON bodies (including `application/x-www-form-urlencoded`, `text/plain`,
 *    and `multipart/form-data` — all 3 are CORS "simple requests" that cross-site HTML `<form>`
 *    tags can submit without preflight, enabling Login/Logout CSRF).
 * 2. Validates `Origin` against `appConfig.allowedOrigins` whenever browsers attach it.
 * 3. Rejects `Sec-Fetch-Site: cross-site` unless the request Origin is explicitly allowlisted
 *    (supporting cross-domain Vercel -> Render deployments when WEB_ORIGIN is configured).
 *
 * Future Media / File Uploads Extension Patterns:
 * - Pattern A (Recommended — S3/R2 Presigned URLs): client calls a JSON endpoint
 *   (`POST /api/storage/presign`) which passes this middleware unchanged, then uploads
 *   binary media directly to Cloudflare R2 / MinIO (zero Node.js RAM pressure).
 * - Pattern B (Scoped Multipart Proxy): if a NestJS route ever requires `multipart/form-data`,
 *   exempt ONLY that explicit path via a narrow allowlist while still enforcing `Origin`,
 *   `Sec-Fetch-Site`, and a preflight-triggering custom header (e.g. `X-Requested-With`).
 * - Security Rule for User Uploads: never accept/serve inline user `.svg` files on the app
 *   origin (Stored XSS vector); allow only raster formats (PNG/WebP/AVIF/JPEG) verified by
 *   magic bytes and served from an isolated CDN/R2 domain or sandboxed CSP.
 */
@Injectable()
export class CsrfOriginMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CsrfOriginMiddleware.name)

  use(req: Request, res: Response, next: NextFunction): void {
    if (!MUTATING_HTTP_METHODS.has(req.method.toUpperCase())) {
      next()
      return
    }

    const contentLengthHeader = req.headers['content-length']
    const hasBody =
      (typeof contentLengthHeader === 'string' && Number.parseInt(contentLengthHeader, 10) > 0) ||
      Boolean(req.headers['transfer-encoding'])

    const contentType = req.headers['content-type']?.toLowerCase() ?? ''
    if (hasBody && !contentType.includes('application/json')) {
      this.logger.warn(
        `[CSRF] Blocked non-JSON mutation Content-Type "${sanitizeLogValue(contentType, 80)}" on ${req.method} ${sanitizeLogValue(req.originalUrl)}`,
      )
      res.status(415).json({
        statusCode: 415,
        message: 'Unsupported Media Type: JSON payload required for mutating requests.',
        timestamp: new Date().toISOString(),
      })
      return
    }

    const originHeader = typeof req.headers.origin === 'string' ? req.headers.origin.trim() : undefined
    const secFetchSite =
      typeof req.headers['sec-fetch-site'] === 'string' ? req.headers['sec-fetch-site'].trim().toLowerCase() : undefined

    const isAllowedOrigin = originHeader ? appConfig.allowedOrigins.includes(originHeader) : false

    if (originHeader && !isAllowedOrigin) {
      this.logger.warn(
        `[CSRF] Blocked disallowed Origin "${sanitizeLogValue(originHeader, 120)}" on ${req.method} ${sanitizeLogValue(req.originalUrl)}`,
      )
      res.status(403).json({
        statusCode: 403,
        message: 'Forbidden cross-origin mutation request.',
        timestamp: new Date().toISOString(),
      })
      return
    }

    if (secFetchSite && secFetchSite !== 'same-origin' && secFetchSite !== 'none' && !isAllowedOrigin) {
      this.logger.warn(
        `[CSRF] Blocked Sec-Fetch-Site="${sanitizeLogValue(secFetchSite, 40)}" on ${req.method} ${sanitizeLogValue(req.originalUrl)}`,
      )
      res.status(403).json({
        statusCode: 403,
        message: 'Forbidden cross-site mutation request.',
        timestamp: new Date().toISOString(),
      })
      return
    }

    next()
  }
}
