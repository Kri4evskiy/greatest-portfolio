export const API_ENDPOINTS = {
  health: '/api/health',
  capabilities: '/api/capabilities',
  authGuestPass: '/api/auth/guest-pass',
  authLogin: '/api/auth/login',
  authMe: '/api/auth/me',
  authLogout: '/api/auth/logout',
  knowledgeMetrics: '/api/knowledge/metrics',
  knowledgeMetricsPaginated: '/api/knowledge/metrics/paginated',
  telemetryStats: '/api/telemetry/stats',
  telemetryEvents: '/api/telemetry/events',
  telemetryStream: '/api/telemetry/stream',
} as const

export type ApiEndpointPath = (typeof API_ENDPOINTS)[keyof typeof API_ENDPOINTS]

export type KnowledgeReactionEndpoint = `/api/knowledge/${string}/view` | `/api/knowledge/${string}/helpful`

export type ApiRouteTarget = ApiEndpointPath | KnowledgeReactionEndpoint

export function buildKnowledgeViewEndpoint(slug: string): `/api/knowledge/${string}/view` {
  return `/api/knowledge/${encodeURIComponent(slug)}/view`
}

export function buildKnowledgeHelpfulEndpoint(slug: string): `/api/knowledge/${string}/helpful` {
  return `/api/knowledge/${encodeURIComponent(slug)}/helpful`
}
