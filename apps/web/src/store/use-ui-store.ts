import type { TechCategory, TechRadarItem } from '@repo/shared-schemas';
import { create } from 'zustand';

export type ReactRenderMode = 'react18' | 'react19';

interface UIState {
  isGuestPassModalOpen: boolean;
  pendingRedirectPath: string | null;
  selectedAdrItem: TechRadarItem | null;
  techRadarCategoryFilter: TechCategory | 'ALL';
  techRadarSearch: string;
  isKbSidebarOpen: boolean;
  reactGraphMode: ReactRenderMode;
  archFlowActiveNode: string | null;

  openGuestPassModal: (redirectPath?: string | null) => void;
  closeGuestPassModal: () => void;
  openAdrInspector: (item: TechRadarItem) => void;
  closeAdrInspector: () => void;
  setTechRadarCategoryFilter: (category: TechCategory | 'ALL') => void;
  setTechRadarSearch: (search: string) => void;
  toggleKbSidebar: () => void;
  setKbSidebarOpen: (open: boolean) => void;
  setReactGraphMode: (mode: ReactRenderMode) => void;
  setArchFlowActiveNode: (nodeId: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isGuestPassModalOpen: false,
  pendingRedirectPath: null,
  selectedAdrItem: null,
  techRadarCategoryFilter: 'ALL',
  techRadarSearch: '',
  isKbSidebarOpen: true,
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
  setReactGraphMode: (mode) =>
    set({
      reactGraphMode: mode,
    }),
  setArchFlowActiveNode: (nodeId) =>
    set({
      archFlowActiveNode: nodeId,
    }),
}));
