import { type ApiEndpointPath, type EndpointPathParams, resolveEndpoint } from '@repo/shared-schemas'
import axios, { type AxiosHeaders, type AxiosProgressEvent, type AxiosRequestConfig, type Method } from 'axios'
import type { z } from 'zod'

// Exceeds backend TimeoutInterceptor (15_000ms) so Neon.tech cold-start 408 errors propagate cleanly
export const DEFAULT_REQUEST_TIMEOUT_MS = 16_000

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

type ApiBaseRequestOptions = {
  params?: Record<string, QueryParamValue>
  headers?: AxiosRequestConfig['headers']
  signal?: AbortSignal | undefined
  timeoutMs?: number
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void
}

/**
 * Compile-time path parameter enforcement:
 * - Static endpoints (e.g. `/api/capabilities`) disallow `pathParams`.
 * - Parameterized endpoints (e.g. `/api/knowledge/:slug/view`) require `pathParams`.
 */
export type ApiRequestOptions<TPath extends ApiEndpointPath> =
  EndpointPathParams<TPath> extends undefined
    ? ApiBaseRequestOptions & { pathParams?: never }
    : ApiBaseRequestOptions & { pathParams: EndpointPathParams<TPath> }

type OptionalRequestArgs<TPath extends ApiEndpointPath> =
  EndpointPathParams<TPath> extends undefined
    ? [options?: ApiRequestOptions<TPath>]
    : [options: ApiRequestOptions<TPath>]

export function isCancelledRequestError(error: unknown): boolean {
  if (axios.isCancel(error)) {
    return true
  }
  if (!(error instanceof Error)) {
    return false
  }
  return error.name === 'AbortError' || error.name === 'CancelledError' || error.name === 'CanceledError'
}

export function compactQueryParams(
  params?: Record<string, QueryParamValue>,
): Record<string, string | number | boolean> | undefined {
  if (!params) {
    return undefined
  }

  const cleaned: Record<string, string | number | boolean> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      cleaned[key] = value
    }
  }
  return cleaned
}

function extractNestErrorMessage(data: unknown, status: number): string {
  if (typeof data === 'object' && data !== null && 'message' in data) {
    const rawMessage = (data as { message?: unknown }).message
    if (typeof rawMessage === 'string' && rawMessage.trim().length > 0) {
      return rawMessage
    }
    if (Array.isArray(rawMessage)) {
      const joined = rawMessage.filter((item): item is string => typeof item === 'string').join(', ')
      if (joined.length > 0) {
        return joined
      }
    }
  }
  return `API request failed (${status})`
}

function extractHeaderValue(headers: unknown, headerName: string): string | undefined {
  if (!headers || typeof headers !== 'object') {
    return undefined
  }
  if (typeof (headers as AxiosHeaders).get === 'function') {
    const value = (headers as AxiosHeaders).get(headerName)
    return typeof value === 'string' ? value : undefined
  }
  const record = headers as Record<string, unknown>
  const direct = record[headerName] ?? record[headerName.toLowerCase()]
  return typeof direct === 'string' ? direct : undefined
}

const axiosInstance = axios.create({
  withCredentials: true,
  allowAbsoluteUrls: false,
  timeout: DEFAULT_REQUEST_TIMEOUT_MS,
  headers: {
    Accept: 'application/json',
  },
})

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error)
    }

    if (axios.isAxiosError(error) && error.response) {
      const status = error.response.status
      const message = extractNestErrorMessage(error.response.data, status)
      const requestId = extractHeaderValue(error.response.headers, 'x-request-id')
      return Promise.reject(new ApiClientError(message, status, requestId))
    }

    if (axios.isAxiosError(error)) {
      const status = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' ? 408 : 0
      return Promise.reject(new ApiClientError(error.message || 'Network error', status))
    }

    return Promise.reject(error)
  },
)

async function requestAndValidate<TPath extends ApiEndpointPath, TSchema extends z.ZodType>(
  method: Method,
  endpoint: TPath,
  schema: TSchema,
  body?: unknown,
  options?: ApiRequestOptions<TPath>,
): Promise<z.infer<TSchema>> {
  const url = resolveEndpoint(endpoint, options?.pathParams)
  const params = compactQueryParams(options?.params)

  const response = await axiosInstance.request<unknown>({
    method,
    url,
    ...(params ? { params } : {}),
    ...(body !== undefined ? { data: body } : {}),
    ...(options?.headers ? { headers: options.headers } : {}),
    ...(options?.signal ? { signal: options.signal } : {}),
    ...(options?.timeoutMs !== undefined ? { timeout: options.timeoutMs } : {}),
    ...(options?.onUploadProgress ? { onUploadProgress: options.onUploadProgress } : {}),
  })

  const payload = response.status === 204 ? undefined : response.data
  return schema.parse(payload)
}

export const apiClient = {
  /** Exposes native Axios interceptors for cross-cutting concerns (e.g. Refresh Token queues). */
  interceptors: axiosInstance.interceptors,

  get<TPath extends ApiEndpointPath, TSchema extends z.ZodType>(
    endpoint: TPath,
    schema: TSchema,
    ...args: OptionalRequestArgs<TPath>
  ): Promise<z.infer<TSchema>> {
    return requestAndValidate('GET', endpoint, schema, undefined, args[0])
  },

  post<TPath extends ApiEndpointPath, TSchema extends z.ZodType>(
    endpoint: TPath,
    schema: TSchema,
    body?: unknown,
    ...args: OptionalRequestArgs<TPath>
  ): Promise<z.infer<TSchema>> {
    return requestAndValidate('POST', endpoint, schema, body, args[0])
  },

  put<TPath extends ApiEndpointPath, TSchema extends z.ZodType>(
    endpoint: TPath,
    schema: TSchema,
    body?: unknown,
    ...args: OptionalRequestArgs<TPath>
  ): Promise<z.infer<TSchema>> {
    return requestAndValidate('PUT', endpoint, schema, body, args[0])
  },

  patch<TPath extends ApiEndpointPath, TSchema extends z.ZodType>(
    endpoint: TPath,
    schema: TSchema,
    body?: unknown,
    ...args: OptionalRequestArgs<TPath>
  ): Promise<z.infer<TSchema>> {
    return requestAndValidate('PATCH', endpoint, schema, body, args[0])
  },

  delete<TPath extends ApiEndpointPath, TSchema extends z.ZodType>(
    endpoint: TPath,
    schema: TSchema,
    ...args: OptionalRequestArgs<TPath>
  ): Promise<z.infer<TSchema>> {
    return requestAndValidate('DELETE', endpoint, schema, undefined, args[0])
  },
}
