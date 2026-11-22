import { type ApiEndpointPath, type EndpointPathParams, resolveEndpoint } from '@repo/shared-schemas'
import type { z } from 'zod'

const DEFAULT_REQUEST_TIMEOUT_MS = 10_000

export class ApiClientError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
  }
}

export type QueryParamValue = string | number | boolean | null | undefined

export interface ApiRequestOptions<TPath extends ApiEndpointPath> {
  pathParams?: EndpointPathParams<TPath>
  params?: Record<string, QueryParamValue>
  signal?: AbortSignal | undefined
  timeoutMs?: number
}

function buildRequestUrl<TPath extends ApiEndpointPath>(
  endpoint: TPath,
  pathParams?: EndpointPathParams<TPath>,
  params?: Record<string, QueryParamValue>,
): string {
  const resolvedPath = resolveEndpoint(endpoint, pathParams)
  if (!params) {
    return resolvedPath
  }

  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value))
    }
  }

  const serialized = searchParams.toString()
  return serialized ? `${resolvedPath}?${serialized}` : resolvedPath
}

/**
 * Composes TanStack Query's cancellation signal with a bounded safety timeout,
 * supporting all browsers in our `browserslist` (`Chrome >= 111`, `Safari >= 16.4`).
 */
function createRequestSignal(
  externalSignal: AbortSignal | undefined,
  timeoutMs: number,
): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController()

  if (externalSignal?.aborted) {
    controller.abort(externalSignal.reason)
    return { signal: controller.signal, cleanup: () => undefined }
  }

  const onExternalAbort = () => {
    controller.abort(externalSignal?.reason)
  }

  externalSignal?.addEventListener('abort', onExternalAbort, { once: true })

  const timerId = setTimeout(() => {
    controller.abort(new DOMException(`Request timed out after ${timeoutMs}ms`, 'TimeoutError'))
  }, timeoutMs)

  const cleanup = () => {
    clearTimeout(timerId)
    externalSignal?.removeEventListener('abort', onExternalAbort)
  }

  return { signal: controller.signal, cleanup }
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: unknown }
    if (typeof body.message === 'string' && body.message.trim().length > 0) {
      return body.message
    }
  } catch {
    // Ignore non-JSON error payloads
  }
  return `API request failed (${response.status})`
}

async function requestAndValidate<TPath extends ApiEndpointPath, TSchema extends z.ZodType>(
  method: 'GET' | 'POST',
  endpoint: TPath,
  schema: TSchema,
  body?: unknown,
  options: ApiRequestOptions<TPath> = {},
): Promise<z.infer<TSchema>> {
  const url = buildRequestUrl(endpoint, options.pathParams, options.params)
  const { signal, cleanup } = createRequestSignal(options.signal, options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      method,
      credentials: 'include',
      signal,
      ...(body !== undefined
        ? {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }
        : {}),
    })

    if (!response.ok) {
      const errorMessage = await parseErrorMessage(response)
      throw new ApiClientError(errorMessage, response.status)
    }

    const payload: unknown = await response.json()
    return schema.parse(payload)
  } finally {
    cleanup()
  }
}

export const apiClient = {
  get<TPath extends ApiEndpointPath, TSchema extends z.ZodType>(
    endpoint: TPath,
    schema: TSchema,
    options?: ApiRequestOptions<TPath>,
  ): Promise<z.infer<TSchema>> {
    return requestAndValidate('GET', endpoint, schema, undefined, options)
  },

  post<TPath extends ApiEndpointPath, TSchema extends z.ZodType>(
    endpoint: TPath,
    schema: TSchema,
    body?: unknown,
    options?: ApiRequestOptions<TPath>,
  ): Promise<z.infer<TSchema>> {
    return requestAndValidate('POST', endpoint, schema, body, options)
  },
}
