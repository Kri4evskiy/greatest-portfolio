export const API_ENDPOINTS = {
  health: '/api/health',
  capabilities: '/api/capabilities',
  authGuestPass: '/api/auth/guest-pass',
  authLogin: '/api/auth/login',
  authMe: '/api/auth/me',
  authLogout: '/api/auth/logout',
  knowledgeMetrics: '/api/knowledge/metrics',
  knowledgeMetricsPaginated: '/api/knowledge/metrics/paginated',
  knowledgeArticleView: '/api/knowledge/:slug/view',
  knowledgeArticleHelpful: '/api/knowledge/:slug/helpful',
  telemetryStats: '/api/telemetry/stats',
  telemetryEvents: '/api/telemetry/events',
  telemetryStream: '/api/telemetry/stream',
  telemetryAdminDiagnostics: '/api/telemetry/admin-diagnostics',
} as const

export type ApiEndpointPath = (typeof API_ENDPOINTS)[keyof typeof API_ENDPOINTS]

type ExtractParamNames<TPath extends string> = TPath extends `${string}:${infer Param}/${infer Rest}`
  ? Param | ExtractParamNames<`/${Rest}`>
  : TPath extends `${string}:${infer Param}`
    ? Param
    : never

export type EndpointPathParams<TPath extends ApiEndpointPath> = [ExtractParamNames<TPath>] extends [never]
  ? undefined
  : Record<ExtractParamNames<TPath>, string>

/**
 * Resolves parameterized API route templates (e.g. `/api/knowledge/:slug/view`)
 * into URL-encoded concrete paths without per-endpoint helper boilerplate.
 */
export function resolveEndpoint<TPath extends ApiEndpointPath>(
  template: TPath,
  pathParams?: EndpointPathParams<TPath>,
): string {
  if (!pathParams) {
    return template
  }

  let resolved: string = template
  for (const [key, value] of Object.entries(pathParams)) {
    resolved = resolved.replace(`:${key}`, encodeURIComponent(String(value)))
  }
  return resolved
}
