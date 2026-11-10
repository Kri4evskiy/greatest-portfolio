import type { TechCategory, TechRadarItem } from '@repo/shared-schemas'
import { create } from 'zustand'

const KB_EXPANDED_SESSION_KEY = 'workfolio-kb-expanded'

function readExpandedFoldersFromSession(): Record<string, boolean> {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const raw = window.sessionStorage.getItem(KB_EXPANDED_SESSION_KEY)
    if (!raw) {
      return {}
    }
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {}
    }

    const result: Record<string, boolean> = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'boolean' && value) {
        result[key] = true
      }
    }
    return result
  } catch {
    return {}
  }
}

function persistExpandedFoldersToSession(folders: Record<string, boolean>): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.sessionStorage.setItem(KB_EXPANDED_SESSION_KEY, JSON.stringify(folders))
  } catch {
    // Ignore storage quota or private-mode restrictions
  }
}

interface UIState {
  isGuestPassModalOpen: boolean
  pendingRedirectPath: string | null
  isCommandPaletteOpen: boolean
  commandPaletteInitialQuery: string
  selectedAdrItem: TechRadarItem | null
  techRadarCategoryFilter: TechCategory | 'ALL'
  techRadarSearch: string
  isKbSidebarOpen: boolean
  expandedKbFolders: Record<string, boolean>
  hasHydratedKbFolders: boolean

  openGuestPassModal: (redirectPath?: string | null) => void
  closeGuestPassModal: () => void
  openCommandPalette: (initialQuery?: string) => void
  closeCommandPalette: () => void
  openAdrInspector: (item: TechRadarItem) => void
  closeAdrInspector: () => void
  setTechRadarCategoryFilter: (category: TechCategory | 'ALL') => void
  setTechRadarSearch: (search: string) => void
  toggleKbSidebar: () => void
  setKbSidebarOpen: (open: boolean) => void
  hydrateKbFoldersFromSession: () => void
  toggleKbFolder: (pathKey: string) => void
  expandKbAncestors: (pathKeys: readonly string[]) => void
  collapseAllKbFolders: () => void
  expandAllKbFolders: (pathKeys: readonly string[]) => void
}

const DEFAULT_EXPANDED_FOLDERS: Record<string, boolean> = {}

export const useUIStore = create<UIState>((set) => ({
  isGuestPassModalOpen: false,
  pendingRedirectPath: null,
  isCommandPaletteOpen: false,
  commandPaletteInitialQuery: '',
  selectedAdrItem: null,
  techRadarCategoryFilter: 'ALL',
  techRadarSearch: '',
  isKbSidebarOpen: true,
  expandedKbFolders: DEFAULT_EXPANDED_FOLDERS,
  hasHydratedKbFolders: false,

  openGuestPassModal: (redirectPath = null) =>
    set({
      isGuestPassModalOpen: true,
      pendingRedirectPath: redirectPath ?? null,
    }),
  closeGuestPassModal: () =>
    set({
      isGuestPassModalOpen: false,
    }),
  openCommandPalette: (initialQuery = '') =>
    set({
      isCommandPaletteOpen: true,
      commandPaletteInitialQuery: initialQuery,
    }),
  closeCommandPalette: () =>
    set({
      isCommandPaletteOpen: false,
      commandPaletteInitialQuery: '',
    }),
  openAdrInspector: (item) =>
    set({
      selectedAdrItem: item,
    }),
  closeAdrInspector: () =>
    set({
      selectedAdrItem: null,
    }),
  setTechRadarCategoryFilter: (category) =>
    set({
      techRadarCategoryFilter: category,
    }),
  setTechRadarSearch: (search) =>
    set({
      techRadarSearch: search,
    }),
  toggleKbSidebar: () =>
    set((state) => ({
      isKbSidebarOpen: !state.isKbSidebarOpen,
    })),
  setKbSidebarOpen: (open) =>
    set({
      isKbSidebarOpen: open,
    }),
  hydrateKbFoldersFromSession: () =>
    set((state) => {
      if (state.hasHydratedKbFolders) {
        return state
      }
      const restored = readExpandedFoldersFromSession()
      return {
        hasHydratedKbFolders: true,
        expandedKbFolders: {
          ...restored,
          ...state.expandedKbFolders,
        },
      }
    }),
  toggleKbFolder: (pathKey) =>
    set((state) => {
      const next: Record<string, boolean> = {
        ...state.expandedKbFolders,
        [pathKey]: !(state.expandedKbFolders[pathKey] ?? false),
      }
      persistExpandedFoldersToSession(next)
      return { expandedKbFolders: next }
    }),
  expandKbAncestors: (pathKeys) =>
    set((state) => {
      let changed = false
      const next = { ...state.expandedKbFolders }
      for (const key of pathKeys) {
        if (!next[key]) {
          next[key] = true
          changed = true
        }
      }
      if (!changed) {
        return state
      }
      persistExpandedFoldersToSession(next)
      return { expandedKbFolders: next }
    }),
  collapseAllKbFolders: () =>
    set(() => {
      persistExpandedFoldersToSession({})
      return { expandedKbFolders: {} }
    }),
  expandAllKbFolders: (pathKeys) =>
    set(() => {
      const next: Record<string, boolean> = {}
      for (const key of pathKeys) {
        next[key] = true
      }
      persistExpandedFoldersToSession(next)
      return { expandedKbFolders: next }
    }),
}))
