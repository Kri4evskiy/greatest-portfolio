import { describe, expect, it } from 'vitest'
import {
  APP_ROUTES,
  buildKnowledgeBasePath,
  isProtectedKnowledgeBasePath,
  isPublicKnowledgeBasePath,
  isRouteActive,
  normalizeKbRedirectPath,
  resolveHeaderRouteBadge,
} from '../app-routes'

describe('normalizeKbRedirectPath (Open Redirect & i18n prefix guard)', () => {
  it('blocks external URLs, protocol-relative URLs, non-KB routes, and empty values', () => {
    expect(normalizeKbRedirectPath(undefined)).toBe(APP_ROUTES.knowledgeBase)
    expect(normalizeKbRedirectPath(null)).toBe(APP_ROUTES.knowledgeBase)
    expect(normalizeKbRedirectPath('   ')).toBe(APP_ROUTES.knowledgeBase)
    expect(normalizeKbRedirectPath('https://evil.example/knowledge-base')).toBe(APP_ROUTES.knowledgeBase)
    expect(normalizeKbRedirectPath('//evil.example/knowledge-base')).toBe(APP_ROUTES.knowledgeBase)
    expect(normalizeKbRedirectPath('/\\evil.example/knowledge-base')).toBe(APP_ROUTES.knowledgeBase)
    expect(normalizeKbRedirectPath('javascript:alert(1)')).toBe(APP_ROUTES.knowledgeBase)
    expect(normalizeKbRedirectPath('/cv')).toBe(APP_ROUTES.knowledgeBase)
    expect(normalizeKbRedirectPath('/system-status')).toBe(APP_ROUTES.knowledgeBase)
    expect(normalizeKbRedirectPath('/knowledge-base-evil')).toBe(APP_ROUTES.knowledgeBase)
  })

  it('strips supported locale prefixes (/en, /ua, /uk, /ru) and preserves deep KB paths', () => {
    expect(normalizeKbRedirectPath('/knowledge-base')).toBe('/knowledge-base')
    expect(normalizeKbRedirectPath('  /knowledge-base/react/compiler/auto-memoization-rules  ')).toBe(
      '/knowledge-base/react/compiler/auto-memoization-rules',
    )
    expect(normalizeKbRedirectPath('/en/knowledge-base/typescript')).toBe('/knowledge-base/typescript')
    expect(normalizeKbRedirectPath('/ua/knowledge-base/nestjs/ai-mcp')).toBe('/knowledge-base/nestjs/ai-mcp')
    expect(normalizeKbRedirectPath('/uk/knowledge-base/testing')).toBe('/knowledge-base/testing')
    expect(normalizeKbRedirectPath('/ru/knowledge-base/this-project')).toBe('/knowledge-base/this-project')
  })
})

describe('route helpers', () => {
  it('builds normalized knowledge-base subpaths', () => {
    expect(buildKnowledgeBasePath()).toBe('/knowledge-base')
    expect(buildKnowledgeBasePath('///react/compiler')).toBe('/knowledge-base/react/compiler')
  })

  it('resolves active routes and header route badges', () => {
    expect(isRouteActive('/knowledge-base/react', APP_ROUTES.knowledgeBase, true)).toBe(true)
    expect(isRouteActive('/cv/extra', APP_ROUTES.cv, false)).toBe(false)
    expect(resolveHeaderRouteBadge('/knowledge-base/react')).toBe('knowledge-base')
    expect(resolveHeaderRouteBadge('/cv')).toBe('cv.pdf')
    expect(resolveHeaderRouteBadge('/system-status')).toBe('system-status')
    expect(resolveHeaderRouteBadge('/')).toBeNull()
  })

  it('enforces Hybrid Knowledge Base access boundaries (public hub & this-project vs protected domains)', () => {
    expect(isPublicKnowledgeBasePath('/knowledge-base')).toBe(true)
    expect(isPublicKnowledgeBasePath('/ua/knowledge-base')).toBe(true)
    expect(isPublicKnowledgeBasePath('/knowledge-base/this-project')).toBe(true)
    expect(isPublicKnowledgeBasePath('/ru/knowledge-base/this-project/security/production-security')).toBe(true)

    expect(isProtectedKnowledgeBasePath('/knowledge-base')).toBe(false)
    expect(isProtectedKnowledgeBasePath('/knowledge-base/this-project/monorepo-docker')).toBe(false)
    expect(isProtectedKnowledgeBasePath('/cv')).toBe(false)

    expect(isPublicKnowledgeBasePath('/knowledge-base/react/compiler/auto-memoization-rules')).toBe(false)
    expect(isProtectedKnowledgeBasePath('/knowledge-base/react/compiler/auto-memoization-rules')).toBe(true)
    expect(isProtectedKnowledgeBasePath('/ua/knowledge-base/nestjs/ai-mcp')).toBe(true)
  })
})
