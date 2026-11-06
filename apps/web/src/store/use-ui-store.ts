import type { TechCategory, TechRadarItem } from '@repo/shared-schemas'
import { create } from 'zustand'

export type ReactRenderMode = 'react18' | 'react19'

interface UIState {
  isGuestPassModalOpen: boolean
  pendingRedirectPath: string | null
  selectedAdrItem: TechRadarItem | null
  techRadarCategoryFilter: TechCategory | 'ALL'
  techRadarSearch: string
  isKbSidebarOpen: boolean
  expandedKbFolders: Record<string, boolean>
  reactGraphMode: ReactRenderMode
  archFlowActiveNode: string | null

  openGuestPassModal: (redirectPath?: string | null) => void
  closeGuestPassModal: () => void
  openAdrInspector: (item: TechRadarItem) => void
  closeAdrInspector: () => void
  setTechRadarCategoryFilter: (category: TechCategory | 'ALL') => void
  setTechRadarSearch: (search: string) => void
  toggleKbSidebar: () => void
  setKbSidebarOpen: (open: boolean) => void
  toggleKbFolder: (pathKey: string) => void
  expandKbAncestors: (pathKeys: readonly string[]) => void
  collapseAllKbFolders: () => void
  expandAllKbFolders: (pathKeys: readonly string[]) => void
  setReactGraphMode: (mode: ReactRenderMode) => void
  setArchFlowActiveNode: (nodeId: string | null) => void
}

const DEFAULT_EXPANDED_FOLDERS: Record<string, boolean> = {}

export const useUIStore = create<UIState>((set) => ({
  isGuestPassModalOpen: false,
  pendingRedirectPath: null,
  selectedAdrItem: null,
  techRadarCategoryFilter: 'ALL',
  techRadarSearch: '',
  isKbSidebarOpen: true,
  expandedKbFolders: DEFAULT_EXPANDED_FOLDERS,
  reactGraphMode: 'react19',
  archFlowActiveNode: 'nextjs-edge',

  openGuestPassModal: (redirectPath = null) =>
    set({
      isGuestPassModalOpen: true,
      pendingRedirectPath: redirectPath ?? null,
    }),
  closeGuestPassModal: () =>
    set({
      isGuestPassModalOpen: false,
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
  toggleKbFolder: (pathKey) =>
    set((state) => ({
      expandedKbFolders: {
        ...state.expandedKbFolders,
        [pathKey]: !(state.expandedKbFolders[pathKey] ?? false),
      },
    })),
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
      return changed ? { expandedKbFolders: next } : state
    }),
  collapseAllKbFolders: () =>
    set({
      expandedKbFolders: {},
    }),
  expandAllKbFolders: (pathKeys) =>
    set(() => {
      const next: Record<string, boolean> = {}
      for (const key of pathKeys) {
        next[key] = true
      }
      return { expandedKbFolders: next }
    }),
  setReactGraphMode: (mode) =>
    set({
      reactGraphMode: mode,
    }),
  setArchFlowActiveNode: (nodeId) =>
    set({
      archFlowActiveNode: nodeId,
    }),
}))
