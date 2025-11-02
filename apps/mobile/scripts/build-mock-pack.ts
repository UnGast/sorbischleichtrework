import fs from 'node:fs';
import path from 'node:path';

import Database from 'better-sqlite3';
import * as yazl from 'yazl';

import { mockHundredSeconds, mockPhrases, mockTopics, mockVocabulary } from '@/services/content/mockData';

const ROOT = path.resolve(__dirname, '..');
const PACK_ID = 'mock-pack';
const TEMP_DIR = path.join(ROOT, 'content', 'dev', `${PACK_ID}-tmp-build`);
const AUDIO_DEST = path.join(TEMP_DIR, 'audio');
const IMAGES_DEST = path.join(TEMP_DIR, 'images');
const AUDIO_SOURCE = path.join(ROOT, 'assets', 'audio');
const IMAGES_SOURCE = path.join(ROOT, 'assets', 'images');

const PACK_MANIFEST = {
  packId: PACK_ID,
  displayName: 'Mock Pack',
  contentVersion: 'mock-0.0.1',
  modules: {
    vocabulary: true,
    phrases: true,
    hundredSeconds: true,
  },
  contentFile: 'content.db',
};

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function setJournalModeDelete(dbPath: string) {
  const db = new Database(dbPath);
  db.pragma('journal_mode = DELETE');
  db.close();
}

function createDatabase(dbPath: string) {
  console.log(`[mock-pack] Creating content DB at ${dbPath}`);
  const db = new Database(dbPath);

  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      name_german TEXT NOT NULL,
      name_sorbian TEXT NOT NULL,
      icon TEXT,
      audio_intro_sorbian TEXT,
      ord INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vocabulary (
      id TEXT PRIMARY KEY,
      topic_id TEXT NOT NULL REFERENCES topics(id),
      de TEXT NOT NULL,
      sb TEXT NOT NULL,
      img TEXT,
      audio TEXT,
      ignore_assign INTEGER DEFAULT 0,
      ignore_write INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS phrases (
      id TEXT PRIMARY KEY,
      topic_id TEXT NOT NULL REFERENCES topics(id),
      de TEXT NOT NULL,
      sb TEXT NOT NULL,
      audio_de TEXT,
      audio_sb TEXT,
      item_type TEXT DEFAULT 'normal'
    );

    CREATE TABLE IF NOT EXISTS hundred_seconds (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      audio TEXT NOT NULL,
      image TEXT
    );
  `);

  const insertTopic = db.prepare(`
    INSERT INTO topics (id, type, name_german, name_sorbian, icon, audio_intro_sorbian, ord)
    VALUES (@id, @type, @nameGerman, @nameSorbian, @icon, @audioIntroSorbian, @order)
  `);

  const insertVocab = db.prepare(`
    INSERT INTO vocabulary (id, topic_id, de, sb, img, audio, ignore_assign, ignore_write)
    VALUES (@id, @topicId, @textGerman, @textSorbian, @img, @audioSorbian, @ignoreAssign, @ignoreWrite)
  `);

  const insertPhrase = db.prepare(`
    INSERT INTO phrases (id, topic_id, de, sb, audio_de, audio_sb, item_type)
    VALUES (@id, @topicId, @germanText, @sorbianText, @germanAudio, @sorbianAudio, @type)
  `);

  const insertHundredSec = db.prepare(`
    INSERT INTO hundred_seconds (id, name, audio, image)
    VALUES (@id, @name, @audio, @image)
  `);

  const txTopics = db.transaction(() => {
    mockTopics.forEach((topic, index) => {
      insertTopic.run({
        id: topic.id,
        type: topic.type,
        nameGerman: topic.nameGerman,
        nameSorbian: topic.nameSorbian,
        icon: topic.icon ?? null,
        audioIntroSorbian: (topic as any).audioIntroSorbian ?? null,
        order: topic.order ?? index + 1,
      });
    });
  });
  txTopics();
  console.log(`[mock-pack] Inserted ${mockTopics.length} topics`);

  const txVocabulary = db.transaction(() => {
    Object.values(mockVocabulary).forEach((items) => {
      items.forEach((item) => {
        insertVocab.run({
          ...item,
          ignoreAssign: item.ignoreAssign ? 1 : 0,
          ignoreWrite: item.ignoreWrite ? 1 : 0,
        });
      });
    });
  });
  txVocabulary();
  const vocabCount = Object.values(mockVocabulary).reduce((total, items) => total + items.length, 0);
  console.log(`[mock-pack] Inserted ${vocabCount} vocabulary rows`);

  const txPhrases = db.transaction(() => {
    Object.values(mockPhrases).forEach((items) => {
      items.forEach((item) =>
        insertPhrase.run({
          id: item.id,
          topicId: item.topicId,
          germanText: item.germanText,
          sorbianText: item.sorbianText,
          germanAudio: item.germanAudio ?? null,
          sorbianAudio: item.sorbianAudio ?? null,
          type: item.type ?? 'normal',
        }),
      );
    });
  });
  txPhrases();
  const phraseCount = Object.values(mockPhrases).reduce((total, items) => total + items.length, 0);
  console.log(`[mock-pack] Inserted ${phraseCount} phrase rows`);

  const txHundredSec = db.transaction(() => {
    mockHundredSeconds.forEach((item) => insertHundredSec.run(item));
  });
  txHundredSec();
  console.log(`[mock-pack] Inserted ${mockHundredSeconds.length} hundred-seconds rows`);

  db.close();
  console.log('[mock-pack] Database build complete');
}

function writeManifest(manifestPath: string) {
  fs.writeFileSync(manifestPath, JSON.stringify(PACK_MANIFEST, null, 2), 'utf-8');
}

function collectAssetPaths(): Set<string> {
  const assets = new Set<string>();

  Object.values(mockVocabulary).forEach((items) => {
    items.forEach((item) => {
      if (item.audioSorbian) assets.add(item.audioSorbian);
      if (item.img) assets.add(item.img);
    });
  });

  Object.values(mockPhrases).forEach((items) => {
    items.forEach((item) => {
      if (item.germanAudio) assets.add(item.germanAudio);
      if (item.sorbianAudio) assets.add(item.sorbianAudio);
    });
  });

  mockHundredSeconds.forEach((item) => {
    if (item.audio) assets.add(item.audio);
    if (item.image) assets.add(item.image);
  });

  return assets;
}

function copyAsset(relativePath: string) {
  const segments = relativePath.split('/');
  if (segments.length !== 2) {
    console.warn(`[mock-pack] Skipping asset with unexpected relative path: ${relativePath}`);
    return;
  }

  const [folder, filename] = segments;
  const sourceDir = folder === 'audio' ? AUDIO_SOURCE : IMAGES_SOURCE;
  const destDir = folder === 'audio' ? AUDIO_DEST : IMAGES_DEST;

  ensureDir(destDir);

  const sourcePath = path.join(sourceDir, filename);
  const destPath = path.join(destDir, filename);

  if (!fs.existsSync(sourcePath)) {
    console.warn(`[mock-pack] Source asset not found: ${sourcePath}`);
    return;
  }

  fs.copyFileSync(sourcePath, destPath);
}

function zipDirectory(srcDir: string, zipPath: string, rootName: string) {
  const zip = new yazl.ZipFile();

  function addEntry(source: string, relative: string) {
    const stats = fs.statSync(source);
    if (stats.isDirectory()) {
      const dirPath = relative.endsWith('/') ? relative : `${relative}/`;
      zip.addEmptyDirectory(dirPath);
      const entries = fs.readdirSync(source);
      entries.forEach((child) => addEntry(path.join(source, child), path.join(relative, child)));
    } else {
      zip.addFile(source, relative);
    }
  }

  addEntry(srcDir, rootName);

  const output = fs.createWriteStream(zipPath);
  zip.outputStream.pipe(output);
  zip.end();

  return new Promise<void>((resolve, reject) => {
    output.on('close', () => resolve());
    output.on('error', reject);
    zip.outputStream.on('error', reject);
  });
}

async function main() {
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }

  ensureDir(TEMP_DIR);
  ensureDir(AUDIO_DEST);
  ensureDir(IMAGES_DEST);

  const dbPath = path.join(TEMP_DIR, 'content.db');
  const manifestPath = path.join(TEMP_DIR, 'pack.json');

  createDatabase(dbPath);
  setJournalModeDelete(dbPath);
  writeManifest(manifestPath);

  const assets = collectAssetPaths();
  console.log(`[mock-pack] Copying ${assets.size} referenced assets`);
  assets.forEach(copyAsset);

  // Copy to dev content directory for simulator use
  const zipPath = path.join(ROOT, 'assets', 'packs', `${PACK_ID}.zip`);
  console.log(`[mock-pack] Creating zip at ${zipPath}`);
  await zipDirectory(TEMP_DIR, zipPath, PACK_ID);

  console.log(`[mock-pack] Content pack built at ${TEMP_DIR} and zipped to ${zipPath}`);

  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
}

void main();


