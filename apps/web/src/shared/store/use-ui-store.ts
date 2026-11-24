import type { TechCategory, TechRadarItem } from '@repo/shared-schemas'
import { create, type StoreApi } from 'zustand'
import {
  applyPaletteToDocument,
  persistPaletteToStorage,
  readPaletteFromStorage,
  type WorkfolioPalette,
} from '@/shared/lib/palette'

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

export interface UIState {
  isGuestPassModalOpen: boolean
  pendingRedirectPath: string | null
  isCommandPaletteOpen: boolean
  commandPaletteInitialQuery: string
  selectedAdrItem: TechRadarItem | null
  techRadarCategoryFilter: TechCategory | 'ALL'
  techRadarSearch: string
  expandedKbFolders: Record<string, boolean>
  hasHydratedKbFolders: boolean
  palette: WorkfolioPalette
  hasHydratedPalette: boolean
}

export interface UIActions {
  openGuestPassModal: (redirectPath?: string | null) => void
  closeGuestPassModal: () => void
  openCommandPalette: (initialQuery?: string) => void
  closeCommandPalette: () => void
  openAdrInspector: (item: TechRadarItem) => void
  closeAdrInspector: () => void
  setTechRadarCategoryFilter: (category: TechCategory | 'ALL') => void
  setTechRadarSearch: (search: string) => void
  hydrateKbFoldersFromSession: () => void
  toggleKbFolder: (pathKey: string) => void
  expandKbAncestors: (pathKeys: readonly string[]) => void
  collapseAllKbFolders: () => void
  expandAllKbFolders: (pathKeys: readonly string[]) => void
  syncPaletteFromStorage: () => void
  setPalette: (palette: WorkfolioPalette) => void
}

export type UIStore = UIState & {
  actions: UIActions
}

const DEFAULT_EXPANDED_FOLDERS: Record<string, boolean> = {}

const initialState: UIState = {
  isGuestPassModalOpen: false,
  pendingRedirectPath: null,
  isCommandPaletteOpen: false,
  commandPaletteInitialQuery: '',
  selectedAdrItem: null,
  techRadarCategoryFilter: 'ALL',
  techRadarSearch: '',
  expandedKbFolders: DEFAULT_EXPANDED_FOLDERS,
  hasHydratedKbFolders: false,
  palette: 'default',
  hasHydratedPalette: false,
}

// Keep base hook private so components cannot subscribe to the whole store without a selector.
const useUIStoreBase = create<UIStore>((set) => ({
  ...initialState,
  actions: {
    openGuestPassModal: (redirectPath = null) =>
      set({
        isGuestPassModalOpen: true,
        pendingRedirectPath: redirectPath ?? null,
      }),
    closeGuestPassModal: () =>
      set({
        isGuestPassModalOpen: false,
        pendingRedirectPath: null,
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
    syncPaletteFromStorage: () =>
      set((state) => {
        const restored = readPaletteFromStorage()
        applyPaletteToDocument(restored)
        if (state.hasHydratedPalette && state.palette === restored) {
          return state
        }
        return {
          palette: restored,
          hasHydratedPalette: true,
        }
      }),
    setPalette: (palette) => {
      applyPaletteToDocument(palette)
      persistPaletteToStorage(palette)
      set({
        palette,
        hasHydratedPalette: true,
      })
    },
  },
}))

/** Imperative store handle for non-React contexts (e.g. ThemeProvider mount/storage sync, tests). */
export const uiStore: Pick<StoreApi<UIStore>, 'getState' | 'subscribe'> = {
  getState: useUIStoreBase.getState,
  subscribe: useUIStoreBase.subscribe,
}

export const useUIActions = () => useUIStoreBase((s) => s.actions)
export const useIsGuestPassModalOpen = () => useUIStoreBase((s) => s.isGuestPassModalOpen)
export const usePendingRedirectPath = () => useUIStoreBase((s) => s.pendingRedirectPath)
export const useIsCommandPaletteOpen = () => useUIStoreBase((s) => s.isCommandPaletteOpen)
export const useCommandPaletteInitialQuery = () => useUIStoreBase((s) => s.commandPaletteInitialQuery)
export const useSelectedAdrItem = () => useUIStoreBase((s) => s.selectedAdrItem)
export const useTechRadarCategoryFilter = () => useUIStoreBase((s) => s.techRadarCategoryFilter)
export const useTechRadarSearch = () => useUIStoreBase((s) => s.techRadarSearch)
export const useExpandedKbFolders = () => useUIStoreBase((s) => s.expandedKbFolders)
export const usePalette = () => useUIStoreBase((s) => s.palette)
export const useHasHydratedPalette = () => useUIStoreBase((s) => s.hasHydratedPalette)
