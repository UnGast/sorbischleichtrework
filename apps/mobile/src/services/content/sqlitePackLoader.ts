import * as SQLite from 'expo-sqlite';
import { File } from 'expo-file-system';

import type { Topic, VocabItem, PhraseItem, HundredSecItem } from '@/types/content';

export interface SqlitePackContent {
  topics: Topic[];
  vocabularyByTopic: Record<string, VocabItem[]>;
  phrasesByTopic: Record<string, PhraseItem[]>;
  hundredSeconds: HundredSecItem[];
}

interface TopicRow {
  id: string;
  type: string;
  name_german: string;
  name_sorbian: string;
  icon?: string | null;
  audio_intro_sorbian?: string | null;
  ord: number;
}

interface VocabularyRow {
  id: string;
  topic_id: string;
  ord: number;
  de: string;
  sb: string;
  img?: string | null;
  audio?: string | null;
  ignore_assign?: number | null;
  ignore_write?: number | null;
}

interface PhraseRow {
  id: string;
  topic_id: string;
  ord: number;
  de: string;
  sb: string;
  audio_de?: string | null;
  audio_sb?: string | null;
  item_type?: string | null;
}

interface HundredRow {
  id: string;
  ord: number;
  name: string;
  audio: string;
  image?: string | null;
}

export async function loadPackContentFromDb(dbUri: string): Promise<SqlitePackContent> {
  const file = new File(dbUri);
  console.log('[sqlitePackLoader] Opening database', {
    name: file.name,
    uri: file.uri,
    parent: file.parentDirectory?.uri,
  });
  const db = await SQLite.openDatabaseAsync(file.name, undefined, file.parentDirectory?.uri);

  try {
    const masterRows = await db.getAllAsync<{ name: string; type: string }>(
      "SELECT name, type FROM sqlite_master WHERE type='table' ORDER BY name",
    );
    console.log('[sqlitePackLoader] sqlite_master tables', masterRows);

    const topicRows = await db.getAllAsync<TopicRow>(
      'SELECT id, type, name_german, name_sorbian, icon, audio_intro_sorbian, ord FROM topics ORDER BY ord ASC',
    );

    console.log('[sqlitePackLoader] Loaded topics', { count: topicRows.length });

    const vocabRows = await db.getAllAsync<VocabularyRow>(
      'SELECT id, topic_id, ord, de, sb, img, audio, ignore_assign, ignore_write FROM vocabulary ORDER BY topic_id, ord',
    );

    const phraseRows = await db.getAllAsync<PhraseRow>(
      'SELECT id, topic_id, ord, de, sb, audio_de, audio_sb, item_type FROM phrases ORDER BY topic_id, ord',
    );

    const hundredRows = await db.getAllAsync<HundredRow>(
      'SELECT id, ord, name, audio, image FROM hundred_seconds ORDER BY ord',
    );

    const topics: Topic[] = topicRows.map((row) => ({
      id: row.id,
      type: row.type as Topic['type'],
      nameGerman: row.name_german,
      nameSorbian: row.name_sorbian,
      order: row.ord,
    }));

    const vocabularyByTopic: Record<string, VocabItem[]> = {};
    vocabRows.forEach((row) => {
      const list = (vocabularyByTopic[row.topic_id] ??= []);
      list.push({
        id: row.id,
        topicId: row.topic_id,
        order: row.ord,
        textGerman: row.de,
        textSorbian: row.sb,
        img: row.img ?? undefined,
        audioSorbian: row.audio ?? undefined,
        ignoreAssign: !!row.ignore_assign,
        ignoreWrite: !!row.ignore_write,
      });
    });

    const phrasesByTopic: Record<string, PhraseItem[]> = {};
    phraseRows.forEach((row) => {
      const list = (phrasesByTopic[row.topic_id] ??= []);
      list.push({
        id: row.id,
        topicId: row.topic_id,
        order: row.ord,
        germanText: row.de,
        sorbianText: row.sb,
        germanAudio: row.audio_de ?? undefined,
        sorbianAudio: row.audio_sb ?? undefined,
        type: (row.item_type as PhraseItem['type']) ?? 'normal',
      });
    });

    const hundredSeconds: HundredSecItem[] = hundredRows.map((row) => ({
      id: row.id,
      order: row.ord,
      name: row.name,
      audio: row.audio,
      image: row.image ?? undefined,
    }));

    return {
      topics,
      vocabularyByTopic,
      phrasesByTopic,
      hundredSeconds,
    };
  } finally {
    await db.closeAsync();
  }
}
