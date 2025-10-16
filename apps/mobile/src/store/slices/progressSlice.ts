import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { EntityType } from '@/types/content';
import { progressDatabase } from '@/services/db/progressDatabase';
import type { ActivityLogEntry, ProgressRecord, TopicCompletionRecord } from '@/types/progress';

const ACTIVITY_HISTORY_LIMIT = 100;

type ProgressStatus = 'idle' | 'loading' | 'error';

interface ProgressState {
  packId?: string;
  status: ProgressStatus;
  error?: string;
  records: Record<string, ProgressRecord>;
  history: ActivityLogEntry[];
  completedTopics: Record<string, TopicCompletionRecord>;
}

const initialState: ProgressState = {
  status: 'idle',
  records: {},
  history: [],
  completedTopics: {},
};

function makeRecordKey(entityId: string, entityType: EntityType) {
  return `${entityType}:${entityId}`;
}

export const loadProgressForPack = createAsyncThunk(
  'progress/loadForPack',
  async (packId: string, { rejectWithValue }) => {
    try {
      const result = await progressDatabase.loadProgressForPack(packId);
      return { packId, ...result };
    } catch (error) {
      console.warn('[progress] Failed to load progress', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  },
);

export const recordProgressAttempt = createAsyncThunk(
  'progress/recordAttempt',
  async (
    params: { packId: string; entityId: string; entityType: EntityType; correct: boolean; timestamp?: number },
    { rejectWithValue },
  ) => {
    try {
      const record = await progressDatabase.recordAttempt(params);
      return { packId: params.packId, record };
    } catch (error) {
      console.warn('[progress] Failed to record attempt', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  },
);

export const logProgressActivity = createAsyncThunk(
  'progress/logActivity',
  async (
    params: {
      packId: string;
      id: string;
      ts: number;
      kind: ActivityLogEntry['kind'];
      entityId?: string;
      entityType?: EntityType;
      metadata?: Record<string, unknown>;
    },
    { rejectWithValue },
  ) => {
    try {
      const entry = await progressDatabase.recordActivity(params);
      return { packId: params.packId, entry };
    } catch (error) {
      console.warn('[progress] Failed to log activity', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  },
);

export const setTopicCompletionStatus = createAsyncThunk(
  'progress/setTopicCompletionStatus',
  async (params: { packId: string; topicId: string; completed: boolean; completedAt?: number }, { rejectWithValue }) => {
    try {
      const record = await progressDatabase.upsertTopicCompletion(params);
      return { packId: params.packId, record };
    } catch (error) {
      console.warn('[progress] Failed to update topic completion', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  },
);

const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    resetProgressState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadProgressForPack.pending, (state, action) => {
        state.status = 'loading';
        state.error = undefined;
        if (state.packId !== action.meta.arg) {
          state.packId = action.meta.arg;
          state.records = {};
          state.history = [];
          state.completedTopics = {};
        }
      })
      .addCase(loadProgressForPack.fulfilled, (state, action) => {
        state.status = 'idle';
        state.error = undefined;
        state.packId = action.payload.packId;

        const recordMap: Record<string, ProgressRecord> = {};
        action.payload.records.forEach((record) => {
          recordMap[makeRecordKey(record.entityId, record.entityType)] = record;
        });
        state.records = recordMap;
        state.history = action.payload.history;

        const topicMap: Record<string, TopicCompletionRecord> = {};
        action.payload.completedTopics.forEach((entry) => {
          topicMap[entry.topicId] = entry;
        });
        state.completedTopics = topicMap;
      })
      .addCase(loadProgressForPack.rejected, (state, action) => {
        state.status = 'error';
        state.error = (action.payload as string | undefined) ?? action.error.message ?? 'Unknown error';
      })
      .addCase(recordProgressAttempt.fulfilled, (state, action) => {
        if (!action.payload || action.payload.packId !== state.packId) {
          return;
        }
        const { record } = action.payload;
        state.records[makeRecordKey(record.entityId, record.entityType)] = record;
      })
      .addCase(logProgressActivity.fulfilled, (state, action) => {
        if (!action.payload || action.payload.packId !== state.packId) {
          return;
        }
        const { entry } = action.payload;
        const next = [entry, ...state.history.filter((existing) => existing.id !== entry.id)];
        state.history = next.slice(0, ACTIVITY_HISTORY_LIMIT);
      })
      .addCase(setTopicCompletionStatus.fulfilled, (state, action) => {
        if (!action.payload || action.payload.packId !== state.packId) {
          return;
        }
        const { record } = action.payload;
        state.completedTopics[record.topicId] = record;
      });
  },
});

export const { resetProgressState } = progressSlice.actions;

export default progressSlice.reducer;

type ProgressRootSelector<T = ProgressState> = { progress: ProgressState } & T;

export const selectProgressState = (state: ProgressRootSelector) => state.progress;

export const selectProgressRecord = (
  state: ProgressRootSelector,
  entityId: string,
  entityType: EntityType,
) => state.progress.records[makeRecordKey(entityId, entityType)] ?? null;

export const selectTopicCompletion = (state: ProgressRootSelector, topicId: string) =>
  state.progress.completedTopics[topicId] ?? null;

