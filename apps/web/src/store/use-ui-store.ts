import type { TechRadarItem } from '@repo/shared-schemas';
import { create } from 'zustand';

interface UIState {
  isGuestPassModalOpen: boolean;
  redirectAfterUnlock: string | null;
  selectedAdrItem: TechRadarItem | null;
  isSidebarOpen: boolean;
  d3ReactMode: 'react18' | 'react19';
  openGuestPassModal: (redirectPath?: string) => void;
  closeGuestPassModal: () => void;
  openAdrInspector: (item: TechRadarItem) => void;
  closeAdrInspector: () => void;
  toggleSidebar: () => void;
  setD3ReactMode: (mode: 'react18' | 'react19') => void;
}

export const useUIStore = create<UIState>((set) => ({
  isGuestPassModalOpen: false,
  redirectAfterUnlock: null,
  selectedAdrItem: null,
  isSidebarOpen: true,
  d3ReactMode: 'react19',
  openGuestPassModal: (redirectPath) =>
    set({
      isGuestPassModalOpen: true,
      redirectAfterUnlock: redirectPath ?? '/knowledge-base',
    }),
  closeGuestPassModal: () =>
    set({
      isGuestPassModalOpen: false,
      redirectAfterUnlock: null,
    }),
  openAdrInspector: (item) => set({ selectedAdrItem: item }),
  closeAdrInspector: () => set({ selectedAdrItem: null }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setD3ReactMode: (mode) => set({ d3ReactMode: mode }),
}));
