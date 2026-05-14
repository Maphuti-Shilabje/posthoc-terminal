import { create } from 'zustand';
import { Metadata } from '@/types/contracts';

interface GlobalState {
  activeView: 'forensic' | 'dashboard';
  activeDatasetId: string | null;
  filteredTradeIds: Set<string>;
  filters: {
    session: string | null;
    regime: string | null;
    strategyId: string | null;
  };
  selectedTradeId: string | null;
  userSettings: {
    showGraveyard: boolean;
    graveyardOpacity: number;
  };
  metadata: Metadata | null;
  
  mcMetrics: {
    medianDD: number | null;
    p95DD: number | null;
    isSimulating: boolean;
  };
  
  // Actions
  setActiveView: (view: 'forensic' | 'dashboard') => void;
  setActiveDatasetId: (id: string | null) => void;
  setFilteredTradeIds: (ids: Set<string>) => void;
  setFilters: (filters: Partial<GlobalState['filters']>) => void;
  setSelectedTradeId: (id: string | null) => void;
  updateUserSettings: (settings: Partial<GlobalState['userSettings']>) => void;
  setMetadata: (metadata: Metadata | null) => void;
  setMCMetrics: (metrics: Partial<GlobalState['mcMetrics']>) => void;
}

export const useGlobalStore = create<GlobalState>((set) => ({
  activeView: 'forensic',
  activeDatasetId: null,
  filteredTradeIds: new Set(),
  filters: {
    session: null,
    regime: null,
    strategyId: null,
  },
  selectedTradeId: null,
  userSettings: {
    showGraveyard: true,
    graveyardOpacity: 0.3,
  },
  metadata: null,
  mcMetrics: {
    medianDD: null,
    p95DD: null,
    isSimulating: false,
  },

  setActiveView: (view) => set({ activeView: view }),
  setActiveDatasetId: (id) => set({ activeDatasetId: id }),
  setFilteredTradeIds: (ids) => set({ filteredTradeIds: ids }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  setSelectedTradeId: (id) => set({ selectedTradeId: id }),
  updateUserSettings: (settings) => set((state) => ({ userSettings: { ...state.userSettings, ...settings } })),
  setMetadata: (metadata) => set({ metadata }),
  setMCMetrics: (metrics) => set((state) => ({ mcMetrics: { ...state.mcMetrics, ...metrics } })),
}));