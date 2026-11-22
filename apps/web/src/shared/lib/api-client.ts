import { type ApiEndpointPath, type EndpointPathParams, resolveEndpoint } from '@repo/shared-schemas'
import type { z } from 'zod'

const DEFAULT_REQUEST_TIMEOUT_MS = 10_000

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export class ApiClientError extends Error {
  readonly status: number
  readonly requestId: string | undefined

  constructor(message: string, status: number, requestId?: string) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.requestId = requestId
  }
}

export type QueryParamValue = string | number | boolean | null | undefined

export interface ApiRequestOptions<TPath extends ApiEndpointPath> {
  pathParams?: EndpointPathParams<TPath>
  params?: Record<string, QueryParamValue>
  headers?: HeadersInit
  signal?: AbortSignal | undefined
  timeoutMs?: number
}

export interface ApiRequestInterceptorContext {
  url: string
  method: HttpMethod
  init: RequestInit
}

export interface ApiResponseInterceptorContext {
  url: string
  method: HttpMethod
  response: Response
}

export interface ApiErrorInterceptorContext {
  url: string
  method: HttpMethod
  error: unknown
}

export type ApiRequestInterceptor = (context: ApiRequestInterceptorContext) => RequestInit | Promise<RequestInit>
export type ApiResponseInterceptor = (context: ApiResponseInterceptorContext) => void | Promise<void>
export type ApiErrorInterceptor = (context: ApiErrorInterceptorContext) => void | Promise<void>

export function isCancelledRequestError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }
  return error.name === 'AbortError' || error.name === 'CancelledError' || error.name === 'CanceledError'
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
    if (Array.isArray(body.message)) {
      const joined = body.message.filter((item): item is string => typeof item === 'string').join(', ')
      if (joined.length > 0) {
        return joined
      }
    }
  } catch {
    // Ignore non-JSON error payloads
  }
  return `API request failed (${response.status})`
}

function buildRequestInit(
  method: HttpMethod,
  signal: AbortSignal,
  body?: unknown,
  customHeaders?: HeadersInit,
): RequestInit {
  const headers = new Headers(customHeaders)
  let serializedBody: BodyInit | undefined

  if (body instanceof FormData) {
    serializedBody = body
  } else if (body !== undefined) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
    serializedBody = JSON.stringify(body)
  }

  return {
    method,
    credentials: 'include',
    signal,
    headers,
    ...(serializedBody !== undefined ? { body: serializedBody } : {}),
  }
}

const requestInterceptors: ApiRequestInterceptor[] = []
const responseInterceptors: ApiResponseInterceptor[] = []
const errorInterceptors: ApiErrorInterceptor[] = []

async function requestAndValidate<TPath extends ApiEndpointPath, TSchema extends z.ZodType>(
  method: HttpMethod,
  endpoint: TPath,
  schema: TSchema,
  body?: unknown,
  options: ApiRequestOptions<TPath> = {},
): Promise<z.infer<TSchema>> {
  const url = buildRequestUrl(endpoint, options.pathParams, options.params)
  const { signal, cleanup } = createRequestSignal(options.signal, options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS)

  try {
    let init = buildRequestInit(method, signal, body, options.headers)
    for (const interceptor of requestInterceptors) {
      init = await interceptor({ url, method, init })
    }

    const response = await fetch(url, init)

    for (const interceptor of responseInterceptors) {
      await interceptor({ url, method, response })
    }

    if (!response.ok) {
      const errorMessage = await parseErrorMessage(response)
      const requestId = response.headers.get('x-request-id') ?? undefined
      throw new ApiClientError(errorMessage, response.status, requestId)
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return schema.parse(undefined)
    }

    const payload: unknown = await response.json()
    return schema.parse(payload)
  } catch (error) {
    if (!options.signal?.aborted && !isCancelledRequestError(error)) {
      for (const interceptor of errorInterceptors) {
        await interceptor({ url, method, error })
      }
    }
    throw error
  } finally {
    cleanup()
  }
}

export const apiClient = {
  interceptors: {
    request: requestInterceptors,
    response: responseInterceptors,
    error: errorInterceptors,
  },

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

  put<TPath extends ApiEndpointPath, TSchema extends z.ZodType>(
    endpoint: TPath,
    schema: TSchema,
    body?: unknown,
    options?: ApiRequestOptions<TPath>,
  ): Promise<z.infer<TSchema>> {
    return requestAndValidate('PUT', endpoint, schema, body, options)
  },

  patch<TPath extends ApiEndpointPath, TSchema extends z.ZodType>(
    endpoint: TPath,
    schema: TSchema,
    body?: unknown,
    options?: ApiRequestOptions<TPath>,
  ): Promise<z.infer<TSchema>> {
    return requestAndValidate('PATCH', endpoint, schema, body, options)
  },

  delete<TPath extends ApiEndpointPath, TSchema extends z.ZodType>(
    endpoint: TPath,
    schema: TSchema,
    options?: ApiRequestOptions<TPath>,
  ): Promise<z.infer<TSchema>> {
    return requestAndValidate('DELETE', endpoint, schema, undefined, options)
  },
}
