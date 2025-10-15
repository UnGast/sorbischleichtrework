#!/usr/bin/env ts-node

import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { parseStringPromise } from 'xml2js';

interface LegacyPhraseTopic {
  topic: {
    $?: {
      nameGerman?: string;
      nameSorbian?: string;
      soundGerman?: string;
      soundSorbian?: string;
      icon?: string;
    };
    topicNameGerman?: string[];
    topicNameSorbian?: string[];
    topicSoundGerman?: string[];
    topicSoundSorbian?: string[];
    phrases?: Array<{
      phrase: Array<{
        $?: {
          type?: string;
        };
        germanText?: string[];
        sorbianText?: string[];
        germanSound?: string[];
        sorbianSound?: string[];
        infoText?: string[];
      }>;
    }>;
  };
}

interface LegacyHundredSeconds {
  inHundredSeconds: {
    item: Array<{
      name?: string[];
      sound?: string[];
      image?: string[];
    }>;
  };
}

interface LegacyVocabTopic {
  topic: {
    $: {
      nameGerman: string;
      nameSorbian?: string;
      soundSorbian?: string;
      icon?: string;
    };
    vocabulary: Array<{
      vocable: Array<{
        $: {
          textGerman: string;
          textSorbian: string;
          soundSorbian?: string;
          img?: string;
          ignoreAssign?: string;
          ignoreWrite?: string;
        };
      }>;
    }>;
  };
}

export interface PhraseItemRecord {
  id: string;
  topicId: string;
  order: number;
  germanText: string;
  sorbianText: string;
  germanAudio?: string;
  sorbianAudio?: string;
  type?: 'normal' | 'separator';
  infoText?: string;
}

export interface TopicRecord {
  id: string;
  type: 'phrases' | 'vocabulary' | 'hundredSeconds';
  nameGerman: string;
  nameSorbian: string;
  order: number;
  icon?: string;
  audioIntroSorbian?: string;
}

export interface VocabItemRecord {
  id: string;
  topicId: string;
  order: number;
  textGerman: string;
  textSorbian: string;
  img?: string;
  audioSorbian?: string;
  ignoreAssign?: boolean;
  ignoreWrite?: boolean;
}

export interface HundredSecRecord {
  id: string;
  order: number;
  name: string;
  audio: string;
  image?: string;
}

export interface LegacyConversionResult {
  topics: TopicRecord[];
  vocabularyByTopic: Record<string, VocabItemRecord[]>;
  phrasesByTopic: Record<string, PhraseItemRecord[]>;
  hundredSeconds: HundredSecRecord[];
  assets: AssetManifest;
}

export interface AssetManifestEntry {
  logicalName: string;
  hash: string;
  extension: string;
  bytes: number;
  sourcePath: string;
}

export interface AssetManifest {
  files: Record<string, AssetManifestEntry>;
}

function normalizeWhitespace(value?: string | null): string {
  if (!value) {
    return '';
  }
  return value
    .replace(/\s+/g, ' ')
    .replace(/^\s+|\s+$/g, '')
    .replace(/\u00A0/g, ' ');
}

function buildPhraseId(topicIndex: number, orderIndex: number): string {
  return `phr-${String(topicIndex).padStart(2, '0')}-${String(orderIndex).padStart(2, '0')}`;
}

function buildTopicId(topicIndex: number, type: TopicRecord['type']): string {
  const prefix = type === 'phrases' ? 'phrases' : type === 'vocabulary' ? 'vocab' : 'hundred';
  return `${prefix}-${String(topicIndex).padStart(2, '0')}`;
}

function buildVocabId(topicIndex: number, orderIndex: number): string {
  return `voc-${String(topicIndex).padStart(2, '0')}-${String(orderIndex).padStart(2, '0')}`;
}

function buildHundredId(orderIndex: number): string {
  return `hund-${String(orderIndex).padStart(2, '0')}`;
}

async function readPhraseTopicFile(filePath: string): Promise<LegacyPhraseTopic> {
  const xml = await fs.readFile(filePath, 'utf-8');
  return parseStringPromise(xml, { explicitArray: true });
}

async function readVocabTopicFile(filePath: string): Promise<LegacyVocabTopic> {
  const xml = await fs.readFile(filePath, 'utf-8');
  return parseStringPromise(xml, { explicitArray: true, attrkey: '$' });
}

async function readHundredSecondsFile(filePath: string): Promise<LegacyHundredSeconds> {
  const xml = await fs.readFile(filePath, 'utf-8');
  return parseStringPromise(xml, { explicitArray: true });
}

function ensureAsset(manifest: AssetManifest, logicalName: string, sourceRoot: string): AssetManifestEntry | undefined {
  const entry = manifest.files[logicalName];
  if (entry) {
    return entry;
  }

  const sourcePath = path.join(sourceRoot, logicalName);
  return undefined;
}

async function hashFile(filePath: string): Promise<{ hash: string; bytes: number }> {
  const data = await fs.readFile(filePath);
  const hash = createHash('sha256').update(data).digest('hex');
  return { hash, bytes: data.byteLength };
}

async function collectAsset(
  manifest: AssetManifest,
  logicalName: string,
  sourceRoot: string,
  outputRoot: string,
): Promise<AssetManifestEntry | undefined> {
  if (!logicalName) {
    return undefined;
  }

  if (manifest.files[logicalName]) {
    return manifest.files[logicalName];
  }

  const sourcePath = path.join(sourceRoot, logicalName);
  try {
    const stats = await fs.stat(sourcePath);
    if (!stats.isFile()) {
      console.warn(`[convert] Asset ${logicalName} not a file at ${sourcePath}`);
      return undefined;
    }

    const { hash, bytes } = await hashFile(sourcePath);
    const extension = path.extname(logicalName).replace(/^\./, '') || 'bin';
    const hashedName = `${hash}.${extension}`;

    // Output to proper asset directories
    const targetPath = path.join(outputRoot, 'assets', hashedName);

    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.copyFile(sourcePath, targetPath);

    const entry: AssetManifestEntry = {
      logicalName,
      hash,
      extension,
      bytes,
      sourcePath: targetPath,
    };
    manifest.files[logicalName] = entry;
    return entry;
  } catch (error) {
    console.warn(`[convert] Failed to copy asset ${logicalName} from ${sourcePath}:`, error);
    return undefined;
  }
}

async function convertPhraseTopic(
  topicPath: string,
  topicIndex: number,
  manifest: AssetManifest,
  audioRoot: string,
  outputRoot: string,
): Promise<{
  topic: TopicRecord;
  phrases: PhraseItemRecord[];
}> {
  const legacy = await readPhraseTopicFile(topicPath);
  const topicId = buildTopicId(topicIndex, 'phrases');
  const topicNode = legacy.topic;
  const topicLabel = normalizeWhitespace(topicNode.topicNameGerman?.[0] ?? topicNode.$?.nameGerman ?? `Phrases ${topicIndex}`);
  const topicSorbian = normalizeWhitespace(topicNode.topicNameSorbian?.[0] ?? topicNode.$?.nameSorbian ?? '');
  const topicAudioSorbian = normalizeWhitespace(topicNode.topicSoundSorbian?.[0] ?? topicNode.$?.soundSorbian ?? '');

  const phrases = topicNode.phrases?.[0]?.phrase ?? [];
  const converted: PhraseItemRecord[] = [];
  for (let index = 0; index < phrases.length; index += 1) {
    const phraseNode = phrases[index];
    const base: PhraseItemRecord = {
      id: buildPhraseId(topicIndex, index + 1),
      topicId,
      order: index + 1,
      germanText: normalizeWhitespace(phraseNode.germanText?.[0] ?? ''),
      sorbianText: normalizeWhitespace(phraseNode.sorbianText?.[0] ?? ''),
    };

    const typeAttr = phraseNode.$?.type;
    if (typeAttr && (typeAttr === 'separator' || typeAttr === 'normal')) {
      base.type = typeAttr;
    }

    const germanSound = normalizeWhitespace(phraseNode.germanSound?.[0]);
    if (germanSound) {
      const asset = await collectAsset(manifest, `${germanSound}.mp3`, audioRoot, outputRoot);
      base.germanAudio = asset ? asset.hash : germanSound;
    }

    const sorbianSound = normalizeWhitespace(phraseNode.sorbianSound?.[0]);
    if (sorbianSound) {
      const asset = await collectAsset(manifest, `${sorbianSound}.mp3`, audioRoot, outputRoot);
      base.sorbianAudio = asset ? asset.hash : sorbianSound;
    }

    const infoText = normalizeWhitespace(phraseNode.infoText?.[0]);
    if (infoText) {
      base.infoText = infoText;
    }

    converted.push(base);
  }

  const topic: TopicRecord = {
    id: topicId,
    type: 'phrases',
    nameGerman: topicLabel,
    nameSorbian: topicSorbian,
    order: topicIndex,
  };
  if (topicAudioSorbian) {
    topic.audioIntroSorbian = `${topicAudioSorbian}.mp3`;
  }

  return { topic, phrases: converted };
}

async function convertVocabTopic(
  topicPath: string,
  topicIndex: number,
  manifest: AssetManifest,
  audioRoot: string,
  imageRoot: string,
): Promise<{
  topic: TopicRecord;
  vocabulary: VocabItemRecord[];
}> {
  const legacy = await readVocabTopicFile(topicPath);
  const topicNode = legacy.topic;
  const topicId = buildTopicId(topicIndex, 'vocabulary');
  const germanName = normalizeWhitespace(topicNode.$.nameGerman);
  const sorbianName = normalizeWhitespace(topicNode.$.nameSorbian ?? '');
  const sorbianAudio = normalizeWhitespace(topicNode.$.soundSorbian ?? '');
  const icon = normalizeWhitespace(topicNode.$.icon ?? '');

  const items = topicNode.vocabulary?.[0]?.vocable ?? [];
  const vocabulary: VocabItemRecord[] = [];
  for (let index = 0; index < items.length; index += 1) {
    const entry = items[index].$;
    const vocab: VocabItemRecord = {
      id: buildVocabId(topicIndex, index + 1),
      topicId,
      order: index + 1,
      textGerman: normalizeWhitespace(entry.textGerman),
      textSorbian: normalizeWhitespace(entry.textSorbian),
    };

    if (entry.soundSorbian) {
      const asset = await collectAsset(manifest, `${entry.soundSorbian}.mp3`, audioRoot, path.join(audioRoot, '..', '..', '..', 'converted', 'audio'));
      vocab.audioSorbian = asset ? asset.hash : `${entry.soundSorbian}.mp3`;
    }

    if (entry.img) {
      const asset = await collectAsset(manifest, entry.img, imageRoot, path.join(imageRoot, '..', '..', '..', 'converted', 'images'));
      vocab.img = asset ? asset.hash : entry.img;
    }

    if (entry.ignoreAssign) {
      vocab.ignoreAssign = entry.ignoreAssign === 'true';
    }
    if (entry.ignoreWrite) {
      vocab.ignoreWrite = entry.ignoreWrite === 'true';
    }

    vocabulary.push(vocab);
  }

  const topic: TopicRecord = {
    id: topicId,
    type: 'vocabulary',
    nameGerman: germanName,
    nameSorbian: sorbianName,
    order: topicIndex,
  };
  if (sorbianAudio) {
    topic.audioIntroSorbian = `${sorbianAudio}.mp3`;
  }
  if (icon) {
    topic.icon = icon;
  }

  return { topic, vocabulary };
}

async function convertHundredSeconds(
  filePath: string,
  manifest: AssetManifest,
  audioRoot: string,
  imageRoot: string,
): Promise<HundredSecRecord[]> {
  const legacy = await readHundredSecondsFile(filePath);
  const items = legacy.inHundredSeconds.item ?? [];
  const result: HundredSecRecord[] = [];

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const name = normalizeWhitespace(item.name?.[0] ?? `Hundred ${index + 1}`);
    const audio = normalizeWhitespace(item.sound?.[0] ?? '');
    const image = normalizeWhitespace(item.image?.[0] ?? '');

    const record: HundredSecRecord = {
      id: buildHundredId(index + 1),
      order: index + 1,
      name,
      audio: audio ? `${audio}.mp3` : '',
    };

    if (audio) {
      const asset = await collectAsset(manifest, `${audio}.mp3`, audioRoot, path.join(audioRoot, '..', '..', '..', 'converted', 'audio'));
      if (asset) {
        record.audio = asset.hash;
      }
    }

    if (image) {
      const asset = await collectAsset(manifest, image, imageRoot, path.join(imageRoot, '..', '..', '..', 'converted', 'images'));
      if (asset) {
        record.image = asset.hash;
      }
    }

    result.push(record);
  }

  return result;
}

export async function convertLegacyContent(baseDir: string, outputDir: string): Promise<LegacyConversionResult> {
  const phrasesDir = path.join(baseDir, 'phrases');
  const vocabDir = path.join(baseDir, 'vocabulary');
  const hundredFile = path.join(baseDir, '..', 'assets', 'in_hundred_seconds.xml');
  const audioRoot = path.join(baseDir, '..', 'res', 'raw');
  const vocabImageRoot = path.join(vocabDir, 'images');

  const manifest: AssetManifest = { files: {} };

  const phraseTopicFiles = (await fs.readdir(phrasesDir)).filter((file) => file.endsWith('.xml')).sort();
  const vocabTopicFiles = (await fs.readdir(vocabDir)).filter((file) => file.endsWith('.xml')).sort();

  const topics: TopicRecord[] = [];
  const phrasesByTopic: Record<string, PhraseItemRecord[]> = {};
  const vocabularyByTopic: Record<string, VocabItemRecord[]> = {};

  for (let index = 0; index < vocabTopicFiles.length; index += 1) {
    const topicIndex = index + 1;
    const fileName = vocabTopicFiles[index];
    const { topic, vocabulary } = await convertVocabTopic(
      path.join(vocabDir, fileName),
      topicIndex,
      manifest,
      audioRoot,
      vocabImageRoot,
    );
    topics.push(topic);
    vocabularyByTopic[topic.id] = vocabulary;
  }

  const phraseTopicOffset = topics.length;

  for (let index = 0; index < phraseTopicFiles.length; index += 1) {
    const topicIndex = phraseTopicOffset + index + 1;
    const fileName = phraseTopicFiles[index];
    const { topic, phrases } = await convertPhraseTopic(
      path.join(phrasesDir, fileName),
      topicIndex,
      manifest,
      audioRoot,
    );
    topics.push(topic);
    phrasesByTopic[topic.id] = phrases;
  }

  const hundredSecondsRecords = await convertHundredSeconds(hundredFile, manifest, audioRoot, vocabImageRoot);

  await fs.mkdir(outputDir, { recursive: true });
  const dbJsonPath = path.join(outputDir, 'content.json');
  const manifestPath = path.join(outputDir, 'manifest.json');
  await fs.writeFile(
    dbJsonPath,
    JSON.stringify({ topics, vocabularyByTopic, phrasesByTopic, hundredSeconds: hundredSecondsRecords }, null, 2),
    'utf-8',
  );
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

  return {
    topics,
    vocabularyByTopic,
    phrasesByTopic,
    hundredSeconds: hundredSecondsRecords,
    assets: manifest,
  };
}

if (require.main === module) {
  (async () => {
    try {
      const baseDir = process.argv[2];
      if (!baseDir) {
        throw new Error('Usage: ts-node scripts/convert-legacy-content.ts <legacy-assets-dir> <output-dir>');
      }
      const outputDir = process.argv[3];
      if (!outputDir) {
        throw new Error('Missing output directory');
      }
      const result = await convertLegacyContent(baseDir, outputDir);
      // eslint-disable-next-line no-console
      console.log(`Converted ${result.topics.length} topics to ${outputDir}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      process.exit(1);
    }
  })();
}


