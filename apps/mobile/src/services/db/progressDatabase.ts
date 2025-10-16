import * as SQLite from 'expo-sqlite';

import { EntityType } from '@/types/content';
import type { ActivityLogEntry, ProgressRecord, TopicCompletionRecord } from '@/types/progress';

const DB_NAME = 'progress.db';
const ACTIVITY_LIMIT = 100;

type ProgressRow = {
  entity_id: string;
  entity_type: EntityType;
  attempts: number;
  correct: number;
  last_seen_at: number;
};

type ActivityRow = {
  id: string;
  pack_id: string;
  ts: number;
  kind: ActivityLogEntry['kind'];
  entity_id: string | null;
  entity_type: EntityType | null;
  metadata_json: string | null;
};

type TopicCompletionRow = {
  topic_id: string;
  completed: number;
  completed_at: number | null;
};

interface RecordAttemptParams {
  packId: string;
  entityId: string;
  entityType: EntityType;
  correct: boolean;
  timestamp?: number;
}

interface RecordActivityParams extends ActivityLogEntry {
  packId: string;
}

interface TopicCompletionParams {
  packId: string;
  topicId: string;
  completed: boolean;
  completedAt?: number;
}

interface LoadResult {
  records: ProgressRecord[];
  history: ActivityLogEntry[];
  completedTopics: TopicCompletionRecord[];
}

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;
let schemaInitialized = false;

async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  const db = await databasePromise;
  if (!schemaInitialized) {
    await initializeSchema(db);
    schemaInitialized = true;
  }
  return db;
}

async function initializeSchema(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS progress_records (
      pack_id TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      attempts INTEGER NOT NULL,
      correct INTEGER NOT NULL,
      last_seen_at INTEGER NOT NULL,
      PRIMARY KEY (pack_id, entity_id, entity_type)
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id TEXT PRIMARY KEY,
      pack_id TEXT NOT NULL,
      ts INTEGER NOT NULL,
      kind TEXT NOT NULL,
      entity_id TEXT,
      entity_type TEXT,
      metadata_json TEXT
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS topic_completion (
      pack_id TEXT NOT NULL,
      topic_id TEXT NOT NULL,
      completed INTEGER NOT NULL,
      completed_at INTEGER,
      PRIMARY KEY (pack_id, topic_id)
    );
  `);
}

function rowToProgress(row: ProgressRow): ProgressRecord {
  return {
    entityId: row.entity_id,
    entityType: row.entity_type,
    attempts: row.attempts,
    correct: row.correct,
    lastSeenAt: row.last_seen_at,
  };
}

function rowToActivity(row: ActivityRow): ActivityLogEntry {
  let metadata: Record<string, unknown> | undefined;
  if (row.metadata_json) {
    try {
      metadata = JSON.parse(row.metadata_json);
    } catch (error) {
      console.warn('[progressDatabase] Failed to parse activity metadata', error);
    }
  }
  return {
    id: row.id,
    ts: row.ts,
    kind: row.kind,
    entityId: row.entity_id ?? undefined,
    entityType: row.entity_type ?? undefined,
    metadata,
  };
}

function rowToTopicCompletion(row: TopicCompletionRow): TopicCompletionRecord {
  return {
    topicId: row.topic_id,
    completed: row.completed === 1,
    completedAt: row.completed_at ?? undefined,
  };
}

function ensurePackId(packId: string) {
  if (!packId) {
    throw new Error('packId is required for progress operations');
  }
}

export async function init(): Promise<void> {
  await getDatabase();
}

export async function loadProgressForPack(packId: string): Promise<LoadResult> {
  ensurePackId(packId);
  const db = await getDatabase();

  const recordRows = await db.getAllAsync<ProgressRow>(
    'SELECT entity_id, entity_type, attempts, correct, last_seen_at FROM progress_records WHERE pack_id = ? ORDER BY last_seen_at DESC',
    [packId],
  );

  const activityRows = await db.getAllAsync<ActivityRow>(
    'SELECT id, pack_id, ts, kind, entity_id, entity_type, metadata_json FROM activity_log WHERE pack_id = ? ORDER BY ts DESC LIMIT ?',
    [packId, ACTIVITY_LIMIT],
  );

  const completionRows = await db.getAllAsync<TopicCompletionRow>(
    'SELECT topic_id, completed, completed_at FROM topic_completion WHERE pack_id = ?',
    [packId],
  );

  return {
    records: recordRows.map(rowToProgress),
    history: activityRows.map(rowToActivity),
    completedTopics: completionRows.map(rowToTopicCompletion),
  };
}

export async function recordAttempt(params: RecordAttemptParams): Promise<ProgressRecord> {
  const { packId, entityId, entityType, correct } = params;
  ensurePackId(packId);
  const db = await getDatabase();
  const timestamp = params.timestamp ?? Date.now();
  const correctFlag = correct ? 1 : 0;

  await db.runAsync(
    `
      INSERT INTO progress_records (pack_id, entity_id, entity_type, attempts, correct, last_seen_at)
      VALUES (?, ?, ?, 1, ?, ?)
      ON CONFLICT(pack_id, entity_id, entity_type)
      DO UPDATE SET
        attempts = progress_records.attempts + 1,
        correct = progress_records.correct + excluded.correct,
        last_seen_at = excluded.last_seen_at;
    `,
    [packId, entityId, entityType, correctFlag, timestamp],
  );

  const row = await db.getFirstAsync<ProgressRow>(
    'SELECT entity_id, entity_type, attempts, correct, last_seen_at FROM progress_records WHERE pack_id = ? AND entity_id = ? AND entity_type = ?',
    [packId, entityId, entityType],
  );

  if (!row) {
    throw new Error('Failed to fetch updated progress record');
  }

  return rowToProgress(row);
}

export async function recordActivity(params: RecordActivityParams): Promise<ActivityLogEntry> {
  const { packId, id, ts, kind, entityId, entityType, metadata } = params;
  ensurePackId(packId);
  const db = await getDatabase();

  await db.runAsync(
    `
      INSERT OR REPLACE INTO activity_log (id, pack_id, ts, kind, entity_id, entity_type, metadata_json)
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `,
    [id, packId, ts, kind, entityId ?? null, entityType ?? null, metadata ? JSON.stringify(metadata) : null],
  );

  await db.runAsync(
    `
      DELETE FROM activity_log
      WHERE pack_id = ?
        AND id NOT IN (
          SELECT id FROM activity_log WHERE pack_id = ? ORDER BY ts DESC LIMIT ?
        );
    `,
    [packId, packId, ACTIVITY_LIMIT],
  );

  return {
    id,
    ts,
    kind,
    entityId,
    entityType,
    metadata,
  };
}

export async function upsertTopicCompletion(params: TopicCompletionParams): Promise<TopicCompletionRecord> {
  const { packId, topicId, completed } = params;
  ensurePackId(packId);
  const db = await getDatabase();
  const completedAt = completed ? params.completedAt ?? Date.now() : null;

  await db.runAsync(
    `
      INSERT INTO topic_completion (pack_id, topic_id, completed, completed_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(pack_id, topic_id)
      DO UPDATE SET
        completed = excluded.completed,
        completed_at = excluded.completed_at;
    `,
    [packId, topicId, completed ? 1 : 0, completedAt],
  );

  const row = await db.getFirstAsync<TopicCompletionRow>(
    'SELECT topic_id, completed, completed_at FROM topic_completion WHERE pack_id = ? AND topic_id = ?',
    [packId, topicId],
  );

  if (!row) {
    throw new Error('Failed to fetch topic completion state');
  }

  return rowToTopicCompletion(row);
}

export const progressDatabase = {
  init,
  loadProgressForPack,
  recordAttempt,
  recordActivity,
  upsertTopicCompletion,
};


