import { describe, expect, it } from 'vitest'
import { API_ENDPOINTS, resolveEndpoint } from '../api-routes.js'

describe('API_ENDPOINTS & resolveEndpoint', () => {
  it('defines every endpoint under the /api prefix without trailing slashes', () => {
    for (const path of Object.values(API_ENDPOINTS)) {
      expect(path.startsWith('/api/')).toBe(true)
      expect(path.endsWith('/')).toBe(false)
    }
  })

  it('returns static endpoints unchanged when pathParams are omitted', () => {
    expect(resolveEndpoint(API_ENDPOINTS.health)).toBe('/api/health')
    expect(resolveEndpoint(API_ENDPOINTS.capabilities)).toBe('/api/capabilities')
    expect(resolveEndpoint(API_ENDPOINTS.knowledgeMetricsPaginated)).toBe('/api/knowledge/metrics/paginated')
    expect(resolveEndpoint(API_ENDPOINTS.telemetryEvents)).toBe('/api/telemetry/events')
  })

  it('substitutes parameterized :slug routes cleanly', () => {
    expect(resolveEndpoint(API_ENDPOINTS.knowledgeArticleView, { slug: 'adr-full-stack-catalog' })).toBe(
      '/api/knowledge/adr-full-stack-catalog/view',
    )
    expect(resolveEndpoint(API_ENDPOINTS.knowledgeArticleHelpful, { slug: 'react-18-vs-19-compiler-d3' })).toBe(
      '/api/knowledge/react-18-vs-19-compiler-d3/helpful',
    )
  })

  it('URL-encodes unsafe path param characters to prevent path traversal or query injection', () => {
    expect(resolveEndpoint(API_ENDPOINTS.knowledgeArticleView, { slug: '../admin?bypass=1#frag' })).toBe(
      '/api/knowledge/..%2Fadmin%3Fbypass%3D1%23frag/view',
    )
    expect(resolveEndpoint(API_ENDPOINTS.knowledgeArticleHelpful, { slug: 'hello world/тест' })).toBe(
      '/api/knowledge/hello%20world%2F%D1%82%D0%B5%D1%81%D1%82/helpful',
    )
  })
})
