import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { EntityType } from '@/types/content';

export type ActivityKind =
  | 'start_topic'
  | 'resume_topic'
  | 'complete_item'
  | 'play_audio'
  | 'enter_auto_mode'
  | 'finish_topic'
  | 'start_reading'
  | 'start_assigning'
  | 'start_writing';

export interface ActivityLogEntry {
  id: string;
  ts: number;
  kind: ActivityKind;
  entityId?: string;
  entityType?: EntityType;
  metadata?: Record<string, unknown>;
}

export interface ProgressRecord {
  entityId: string;
  entityType: EntityType;
  attempts: number;
  correct: number;
  lastSeenAt: number;
}

export interface ProgressState {
  records: Record<string, ProgressRecord>;
  history: ActivityLogEntry[];
  completedTopics: Record<string, boolean>;
}

const initialState: ProgressState = {
  records: {},
  history: [],
  completedTopics: {},
};

function makeRecordKey(entityId: string, entityType: EntityType) {
  return `${entityType}:${entityId}`;
}

const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    recordAttempt(
      state,
      action: PayloadAction<{ entityId: string; entityType: EntityType; correct: boolean; timestamp?: number }>,
    ) {
      const { entityId, entityType, correct, timestamp = Date.now() } = action.payload;
      const key = makeRecordKey(entityId, entityType);
      const entry = state.records[key] ?? {
        entityId,
        entityType,
        attempts: 0,
        correct: 0,
        lastSeenAt: timestamp,
      };
      entry.attempts += 1;
      if (correct) {
        entry.correct += 1;
      }
      entry.lastSeenAt = timestamp;
      state.records[key] = entry;
    },
    recordAction(state, action: PayloadAction<ActivityLogEntry>) {
      state.history.unshift(action.payload);
      state.history = state.history.slice(0, 100);
    },
    markTopicCompleted(state, action: PayloadAction<{ topicId: string; completed: boolean }>) {
      state.completedTopics[action.payload.topicId] = action.payload.completed;
    },
    resetProgress: () => initialState,
  },
});

export const { recordAttempt, recordAction, markTopicCompleted, resetProgress } = progressSlice.actions;
export default progressSlice.reducer;

