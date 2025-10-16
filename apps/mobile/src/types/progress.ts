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

export interface TopicCompletionRecord {
  topicId: string;
  completed: boolean;
  completedAt?: number;
}

