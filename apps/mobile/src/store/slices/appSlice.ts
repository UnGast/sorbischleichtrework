import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type PackMode = 'selector' | 'fixed';
export type BootstrapStatus = 'idle' | 'initializing' | 'ready' | 'error';

export interface AppState {
  bootstrapStatus: BootstrapStatus;
  packMode: PackMode;
  activePackId?: string;
  errorMessage?: string;
  lastActionAt?: number;
}

const initialState: AppState = {
  bootstrapStatus: 'idle',
  packMode: 'selector',
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setBootstrapStatus(state, action: PayloadAction<BootstrapStatus>) {
      state.bootstrapStatus = action.payload;
      if (action.payload !== 'error') {
        state.errorMessage = undefined;
      }
    },
    setActivePack(state, action: PayloadAction<string | undefined>) {
      state.activePackId = action.payload;
    },
    setPackMode(state, action: PayloadAction<PackMode>) {
      state.packMode = action.payload;
    },
    setAppError(state, action: PayloadAction<string | undefined>) {
      state.bootstrapStatus = 'error';
      state.errorMessage = action.payload;
    },
    setLastActionAt(state, action: PayloadAction<number | undefined>) {
      state.lastActionAt = action.payload;
    },
    resetAppState: () => initialState,
  },
});

export const { setBootstrapStatus, setActivePack, setPackMode, setAppError, setLastActionAt, resetAppState } = appSlice.actions;
export default appSlice.reducer;

