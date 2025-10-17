#!/usr/bin/env ts-node

import fs from 'node:fs';
import path from 'node:path';

import Database from 'better-sqlite3';
import { ZipFile } from 'yazl';

import { convertLegacyContent } from './legacy/convertLegacyCore';
import type { LegacyConversionResult, AssetManifestEntry } from './legacy/convertLegacyCore';

interface ConvertOptions {
  legacyRoot: string;
  outputDir: string;
  packId: string;
  displayName: string;
  contentVersion: string;
}

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function createDatabase(dbPath: string, data: LegacyConversionResult) {
  const db = new Database(dbPath);
  try {
    db.exec(`
      PRAGMA foreign_keys = ON;
      PRAGMA journal_mode = WAL;
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
        item_type TEXT DEFAULT 'normal',
        info_text TEXT
      );

      CREATE TABLE IF NOT EXISTS hundred_seconds (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        audio TEXT NOT NULL,
        image TEXT
      );

      CREATE TABLE IF NOT EXISTS assets (
        logical_name TEXT PRIMARY KEY,
        relative_path TEXT NOT NULL,
        bytes INTEGER NOT NULL
      );
    `);

    const insertTopic = db.prepare(
      `INSERT INTO topics (id, type, name_german, name_sorbian, icon, audio_intro_sorbian, ord)
       VALUES (@id, @type, @nameGerman, @nameSorbian, @icon, @audioIntroSorbian, @order)`,
    );
    const insertVocab = db.prepare(
      `INSERT INTO vocabulary (id, topic_id, de, sb, img, audio, ignore_assign, ignore_write)
       VALUES (@id, @topicId, @textGerman, @textSorbian, @img, @audioSorbian, @ignoreAssign, @ignoreWrite)`,
    );
    const insertPhrase = db.prepare(
      `INSERT INTO phrases (id, topic_id, de, sb, audio_de, audio_sb, item_type, info_text)
       VALUES (@id, @topicId, @germanText, @sorbianText, @germanAudio, @sorbianAudio, @type, @infoText)`,
    );
    const insertHundred = db.prepare(
      `INSERT INTO hundred_seconds (id, name, audio, image)
       VALUES (@id, @name, @audio, @image)`,
    );
    const insertAsset = db.prepare(
      `INSERT INTO assets (logical_name, relative_path, bytes) VALUES (@logicalName, @relativePath, @bytes)`);

    const tx = db.transaction(() => {
      data.topics.forEach((topic, index) => {
        insertTopic.run({
          id: topic.id,
          type: topic.type,
          nameGerman: topic.nameGerman,
          nameSorbian: topic.nameSorbian,
          icon: topic.icon ? topic.icon : null,
          audioIntroSorbian: topic.audioIntroSorbian ?? null,
          order: topic.order ?? index + 1,
        });
      });

      Object.values(data.vocabularyByTopic).forEach((items) => {
        items.forEach((item) => {
          insertVocab.run({
            id: item.id,
            topicId: item.topicId,
            textGerman: item.textGerman,
            textSorbian: item.textSorbian,
            img: item.img ?? null,
            audioSorbian: item.audioSorbian ?? null,
            ignoreAssign: item.ignoreAssign ? 1 : 0,
            ignoreWrite: item.ignoreWrite ? 1 : 0,
          });
        });
      });

      Object.values(data.phrasesByTopic).forEach((items) => {
        items.forEach((item) => {
          insertPhrase.run({
            id: item.id,
            topicId: item.topicId,
            germanText: item.germanText,
            sorbianText: item.sorbianText,
            germanAudio: item.germanAudio ?? null,
            sorbianAudio: item.sorbianAudio ?? null,
            type: item.type ?? 'normal',
            infoText: item.infoText ?? null,
          });
        });
      });

      data.hundredSeconds.forEach((item) => {
        insertHundred.run({
          id: item.id,
          name: item.name,
          audio: item.audio,
          image: item.image ?? null,
        });
      });

      Object.entries(data.assets.files).forEach(([logicalName, entry]) => {
        try {
          insertAsset.run({ logicalName, relativePath: entry.relativePath, bytes: entry.bytes });
  } catch (error) {
          console.warn(`[convert] Skipping duplicate asset ${logicalName}`, error);
        }
      });
    });
    tx();

    db.pragma('wal_checkpoint(TRUNCATE)');
    db.pragma('journal_mode = DELETE');

  } finally {
    db.close();
  }
}

function copyAssets(assets: Record<string, AssetManifestEntry>, destRoot: string) {
  Object.values(assets).forEach((entry) => {
    const targetPath = path.join(destRoot, entry.relativePath);
    ensureDir(path.dirname(targetPath));
    fs.copyFileSync(entry.sourcePath, targetPath);
  });
}

function writeManifest(destPath: string, options: ConvertOptions) {
  const manifest = {
    packId: options.packId,
    displayName: options.displayName,
    contentVersion: options.contentVersion,
    modules: {
      vocabulary: true,
      phrases: true,
      hundredSeconds: true,
    },
    contentFile: 'content.db',
  };
  fs.writeFileSync(destPath, JSON.stringify(manifest, null, 2), 'utf-8');
}

function zipDirectory(sourceDir: string, zipPath: string, rootName: string) {
  const zip = new ZipFile();

  function addEntry(src: string, relative: string) {
    const stats = fs.statSync(src);
    if (stats.isDirectory()) {
      const entries = fs.readdirSync(src);
      if (entries.length === 0) {
        zip.addEmptyDirectory(`${relative}/`);
      } else {
        entries.forEach((entry) => addEntry(path.join(src, entry), `${relative}/${entry}`));
      }
    } else {
      zip.addFile(src, relative);
    }
  }

  addEntry(sourceDir, rootName);

  const output = fs.createWriteStream(zipPath);
  zip.outputStream.pipe(output);
  zip.end();

  return new Promise<void>((resolve, reject) => {
    output.on('close', () => resolve());
    output.on('error', reject);
    zip.outputStream.on('error', reject);
  });
}

export async function buildContentPack(options: ConvertOptions) {
  const { legacyRoot, outputDir, packId } = options;
  const packDir = path.join(outputDir, packId);

  if (fs.existsSync(packDir)) {
    fs.rmSync(packDir, { recursive: true, force: true });
  }
  ensureDir(packDir);

  const conversion = (await convertLegacyContent(legacyRoot)) as LegacyConversionResult;

  const dbPath = path.join(packDir, 'content.db');
  createDatabase(dbPath, conversion);

  copyAssets(conversion.assets.files, packDir);

  writeManifest(path.join(packDir, 'pack.json'), options);

  await zipDirectory(packDir, path.join(outputDir, `${packId}.zip`), packId);

  return packDir;
}

if (require.main === module) {
  (async () => {
    try {
      const [legacyRoot, outputDir, packId = 'legacy-pack', displayName = 'Legacy Pack', contentVersion = '1.0.0'] =
        process.argv.slice(2);

      if (!legacyRoot || !outputDir) {
        throw new Error(
          'Usage: ts-node -r tsconfig-paths/register scripts/convert-legacy-content.ts <legacy-root> <output-dir> [packId] [displayName] [contentVersion]',
        );
      }

      const options: ConvertOptions = {
        legacyRoot: path.resolve(legacyRoot),
        outputDir: path.resolve(outputDir),
        packId,
        displayName,
        contentVersion,
      };

      await buildContentPack(options);
      console.log(`[convert] Pack ${packId} built at ${path.join(options.outputDir, packId)}`);
    } catch (error) {
      console.error('[convert] Failed to build legacy pack:', error);
      process.exit(1);
    }
  })();
}


