import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DEFAULT_PRIMARY_COLOR } from '@/theme/colors';

export type PackMode = 'selector' | 'fixed';
export type BootstrapStatus = 'idle' | 'initializing' | 'ready' | 'error';

export interface AppState {
  bootstrapStatus: BootstrapStatus;
  packMode: PackMode;
  activePackId?: string;
  errorMessage?: string;
  lastActionAt?: number;
  primaryColor: string;
}

const initialState: AppState = {
  bootstrapStatus: 'idle',
  packMode: 'selector',
  primaryColor: DEFAULT_PRIMARY_COLOR,
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
    setPrimaryColor(state, action: PayloadAction<string | undefined>) {
      state.primaryColor = action.payload ?? DEFAULT_PRIMARY_COLOR;
    },
    resetAppState: () => initialState,
  },
});

export const { setBootstrapStatus, setActivePack, setPackMode, setAppError, setLastActionAt, setPrimaryColor, resetAppState } = appSlice.actions;
export default appSlice.reducer;

