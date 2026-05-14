import { useGlobalStore } from './globalStore';
import { act } from '@testing-library/react';

describe('Global Store (Zustand)', () => {
  const initialState = useGlobalStore.getState();

  beforeEach(() => {
    // Reset store before each test
    useGlobalStore.setState(initialState, true);
  });

  it('should initialize with default state', () => {
    const state = useGlobalStore.getState();
    expect(state.activeDatasetId).toBeNull();
    expect(state.selectedTradeId).toBeNull();
    expect(state.userSettings.showGraveyard).toBe(true);
  });

  it('should set activeDatasetId', () => {
    act(() => {
      useGlobalStore.getState().setActiveDatasetId('dataset_123');
    });
    expect(useGlobalStore.getState().activeDatasetId).toBe('dataset_123');
  });

  it('should set selectedTradeId', () => {
    act(() => {
      useGlobalStore.getState().setSelectedTradeId('trade_456');
    });
    expect(useGlobalStore.getState().selectedTradeId).toBe('trade_456');
  });

  it('should partially update userSettings', () => {
    act(() => {
      useGlobalStore.getState().updateUserSettings({ graveyardOpacity: 0.5 });
    });
    const { userSettings } = useGlobalStore.getState();
    // Keeps existing values
    expect(userSettings.showGraveyard).toBe(true);
    // Updates new values
    expect(userSettings.graveyardOpacity).toBe(0.5);
  });
});