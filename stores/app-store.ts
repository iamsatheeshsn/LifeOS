import { create } from 'zustand';

interface AppStore {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  voiceOpen: boolean;
  setVoiceOpen: (open: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  voiceOpen: false,
  setVoiceOpen: (open) => set({ voiceOpen: open }),
}));
