import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'buffering' | 'error';

export interface QueueItem {
  id: string;
  title: string;
  subtitle?: string;
  entityId?: string;
  entityType?: 'vocab' | 'phrase' | 'hundred';
  logicalAsset?: string;
  uri?: string;
  durationSeconds?: number;
}

export interface AudioState {
  status: PlaybackStatus;
  currentItemId?: string;
  currentTrackId?: string;
  queue: QueueItem[];
  positionSeconds: number;
  durationSeconds: number;
  errorMessage?: string;
  isAutoModeEnabled: boolean;
}

const initialState: AudioState = {
  status: 'idle',
  queue: [],
  positionSeconds: 0,
  durationSeconds: 0,
  isAutoModeEnabled: false,
};

const audioSlice = createSlice({
  name: 'audio',
  initialState,
  reducers: {
    setAudioStatus(state, action: PayloadAction<PlaybackStatus>) {
      state.status = action.payload;
      if (action.payload !== 'error') {
        state.errorMessage = undefined;
      }
    },
    setAudioError(state, action: PayloadAction<string | undefined>) {
      state.status = 'error';
      state.errorMessage = action.payload;
    },
    setQueue(state, action: PayloadAction<QueueItem[]>) {
      state.queue = action.payload;
      const first = action.payload[0];
      state.currentTrackId = first?.id;
      state.currentItemId = first?.entityId ?? first?.id;
      state.positionSeconds = 0;
      state.durationSeconds = first?.durationSeconds ?? 0;
    },
    setCurrentItem(state, action: PayloadAction<string | undefined>) {
      state.currentItemId = action.payload;
      const item = state.queue.find((entry) => entry.entityId === action.payload || entry.id === action.payload);
      if (item) {
        state.currentTrackId = item.id;
        state.durationSeconds = item.durationSeconds ?? 0;
      }
      state.positionSeconds = 0;
    },
    setCurrentTrack(state, action: PayloadAction<string | undefined>) {
      state.currentTrackId = action.payload;
      if (!action.payload) {
        state.currentItemId = undefined;
        return;
      }
      const item = state.queue.find((entry) => entry.id === action.payload);
      if (item) {
        const newItemId = item.entityId ?? item.id;
        // Only update currentItemId if it's different to avoid unnecessary re-renders
        if (state.currentItemId !== newItemId) {
          state.currentItemId = newItemId;
        }
        state.durationSeconds = item.durationSeconds ?? 0;
        state.positionSeconds = 0;
      }
    },
    updatePosition(state, action: PayloadAction<{ positionSeconds: number; durationSeconds?: number }>) {
      state.positionSeconds = action.payload.positionSeconds;
      if (typeof action.payload.durationSeconds === 'number') {
        state.durationSeconds = action.payload.durationSeconds;
      }
    },
    toggleAutoMode(state, action: PayloadAction<boolean | undefined>) {
      state.isAutoModeEnabled = action.payload ?? !state.isAutoModeEnabled;
    },
    resetAudioState: () => initialState,
  },
});

export const {
  setAudioStatus,
  setAudioError,
  setQueue,
  setCurrentItem,
  setCurrentTrack,
  updatePosition,
  toggleAutoMode,
  resetAudioState,
} = audioSlice.actions;
export default audioSlice.reducer;

