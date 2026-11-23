import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PALETTE_STORAGE_KEY } from '@/shared/lib/palette'
import { uiStore } from '../use-ui-store'

describe('use-ui-store (SSR safety, modals, KB folders & 2D palette)', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    delete document.documentElement.dataset.palette
    uiStore.getState().actions.closeGuestPassModal()
    uiStore.getState().actions.collapseAllKbFolders()
    uiStore.getState().actions.setPalette('default')
  })

  it('is SSR-safe when window and document are undefined', () => {
    vi.stubGlobal('window', undefined)
    vi.stubGlobal('document', undefined)

    const actions = uiStore.getState().actions
    expect(() => {
      actions.syncPaletteFromStorage()
      actions.hydrateKbFoldersFromSession()
      actions.toggleKbFolder('react')
      actions.setPalette('sepia')
    }).not.toThrow()

    expect(uiStore.getState().palette).toBe('sepia')
  })

  it('switches 2D palette, syncs DOM data-palette attribute, and validates localStorage values', () => {
    const actions = uiStore.getState().actions

    actions.setPalette('graphite')
    expect(uiStore.getState().palette).toBe('graphite')
    expect(document.documentElement.dataset.palette).toBe('graphite')
    expect(window.localStorage.getItem(PALETTE_STORAGE_KEY)).toBe('graphite')

    actions.setPalette('default')
    expect(uiStore.getState().palette).toBe('default')
    expect(document.documentElement.dataset.palette).toBeUndefined()
    expect(window.localStorage.getItem(PALETTE_STORAGE_KEY)).toBeNull()

    window.localStorage.setItem(PALETTE_STORAGE_KEY, 'sepia')
    actions.syncPaletteFromStorage()
    expect(uiStore.getState().palette).toBe('sepia')
    expect(document.documentElement.dataset.palette).toBe('sepia')

    window.localStorage.setItem(PALETTE_STORAGE_KEY, 'invalid-palette')
    actions.syncPaletteFromStorage()
    expect(uiStore.getState().palette).toBe('default')
    expect(document.documentElement.dataset.palette).toBeUndefined()
  })

  it('manages GuestPassModal state and Knowledge Base folder tree persistence', () => {
    const actions = uiStore.getState().actions

    actions.openGuestPassModal('/knowledge-base/nestjs')
    expect(uiStore.getState().isGuestPassModalOpen).toBe(true)
    expect(uiStore.getState().pendingRedirectPath).toBe('/knowledge-base/nestjs')

    actions.closeGuestPassModal()
    expect(uiStore.getState().isGuestPassModalOpen).toBe(false)

    actions.toggleKbFolder('this-project')
    expect(uiStore.getState().expandedKbFolders['this-project']).toBe(true)
    actions.expandKbAncestors(['this-project', 'this-project/monorepo-docker'])
    expect(uiStore.getState().expandedKbFolders['this-project/monorepo-docker']).toBe(true)
    actions.collapseAllKbFolders()
    expect(uiStore.getState().expandedKbFolders).toEqual({})
  })
})
