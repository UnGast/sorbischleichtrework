#!/usr/bin/env ts-node

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

import Database from 'better-sqlite3';
import { ZipFile } from 'yazl';
import { createHash } from 'node:crypto';

import { convertLegacyContent } from './legacy/convertLegacyCore';
import type { LegacyConversionResult, AssetManifestEntry } from './legacy/convertLegacyCore';
import { DEFAULT_PRIMARY_COLOR } from '@/theme/colors';

interface ConvertOptions {
  legacyRoot: string;
  outputDir: string;
  packId: string;
  displayName: string;
  contentVersion: string;
}

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const DEFAULT_OUTPUT_DIR = path.join(REPO_ROOT, 'converted-packs');
const DEFAULT_PACK_ID = 'main-pack';
const DEFAULT_DISPLAY_NAME = 'Main Pack';
const DEFAULT_CONTENT_VERSION = '1.0.0';

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
    primaryColor: DEFAULT_PRIMARY_COLOR,
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

  const zipPath = path.join(outputDir, `${packId}.zip`);
  await zipDirectory(packDir, zipPath, packId);
  console.log(`[convert] Wrote zip to ${zipPath}`);

  const hash = await computeFileHash(zipPath);
  const hashPath = path.join(outputDir, `${packId}-hash.sha256`);
  fs.writeFileSync(hashPath, `${hash}\n`, 'utf-8');
  console.log(`[convert] Wrote hash to ${hashPath}`);

  return packDir;
}

async function computeFileHash(filePath: string): Promise<string> {
  const hash = createHash('sha256');
  const stream = fs.createReadStream(filePath);

  return new Promise<string>((resolve, reject) => {
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

if (require.main === module) {
  (async () => {
    try {
      const args = process.argv.slice(2);
      let legacyRootArg = args[0];
      let outputDirArg = args[1];
      let packIdArg = args[2];
      let displayNameArg = args[3];
      let contentVersionArg = args[4];

      const rl = readline.createInterface({ input, output });

      if (!legacyRootArg) {
        legacyRootArg = await rl.question('Path to legacy content root: ');
      }

      if (!legacyRootArg) {
        throw new Error('Legacy content root is required.');
      }

      if (!outputDirArg) {
        const defaultOutput = DEFAULT_OUTPUT_DIR;
        const answer = await rl.question(`Output directory [${defaultOutput}]: `);
        outputDirArg = answer.trim() || defaultOutput;
      }

      if (!packIdArg) {
        const answer = await rl.question(`Pack ID [${DEFAULT_PACK_ID}]: `);
        packIdArg = answer.trim() || DEFAULT_PACK_ID;
      }

      if (!displayNameArg) {
        const answer = await rl.question(`Display name [${DEFAULT_DISPLAY_NAME}]: `);
        displayNameArg = answer.trim() || DEFAULT_DISPLAY_NAME;
      }

      if (!contentVersionArg) {
        const answer = await rl.question(`Content version [${DEFAULT_CONTENT_VERSION}]: `);
        contentVersionArg = answer.trim() || DEFAULT_CONTENT_VERSION;
      }

      rl.close();

      const options: ConvertOptions = {
        legacyRoot: path.resolve(legacyRootArg),
        outputDir: path.resolve(outputDirArg),
        packId: packIdArg,
        displayName: displayNameArg,
        contentVersion: contentVersionArg,
      };

      console.log(`[convert] Converting legacy content from ${options.legacyRoot}`);
      console.log(`[convert] Output directory: ${options.outputDir}`);
      console.log(`[convert] Pack ID: ${options.packId}`);
      console.log(`[convert] Display name: ${options.displayName}`);
      console.log(`[convert] Content version: ${options.contentVersion}`);

      const packDir = await buildContentPack(options);
      console.log(`[convert] Conversion complete. Content pack directory: ${packDir}`);
      console.log(`[convert] Zip archive available at ${path.join(options.outputDir, `${options.packId}.zip`)}`);
    } catch (error) {
      console.error('[convert] Failed to build legacy pack:', error);
      process.exit(1);
    }
  })();
}


