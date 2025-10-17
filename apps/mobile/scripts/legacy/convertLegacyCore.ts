import fs from 'node:fs/promises';
import path from 'node:path';
import { parseStringPromise } from 'xml2js';

export interface LegacyPhraseTopic {
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
    phrases?: {
      phrase: {
        $?: {
          type?: string;
        };
        germanText?: string[];
        sorbianText?: string[];
        germanSound?: string[];
        sorbianSound?: string[];
        infoText?: string[];
      }[];
    }[];
  };
}

interface LegacyHundredSeconds {
  inHundredSeconds: {
    item: {
      name?: string[];
      sound?: string[];
      image?: string[];
    }[];
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
    vocabulary: {
      vocable: {
        $: {
          textGerman: string;
          textSorbian: string;
          soundSorbian?: string;
          img?: string;
          ignoreAssign?: string;
          ignoreWrite?: string;
        };
      }[];
    }[];
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

export interface AssetManifestEntry {
  logicalName: string;
  bytes: number;
  sourcePath: string;
  relativePath: string;
}

export interface AssetManifest {
  files: Record<string, AssetManifestEntry>;
}

export interface LegacyConversionResult {
  topics: TopicRecord[];
  vocabularyByTopic: Record<string, VocabItemRecord[]>;
  phrasesByTopic: Record<string, PhraseItemRecord[]>;
  hundredSeconds: HundredSecRecord[];
  assets: AssetManifest;
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

function deriveTopicType(filePath: string, defaultType: TopicRecord['type']): TopicRecord['type'] {
  const normalized = filePath.replace(/\\/g, '/').toLowerCase();
  if (normalized.includes('/phrases/')) {
    return 'phrases';
  }
  if (normalized.includes('/vocabulary/')) {
    return 'vocabulary';
  }
  return defaultType;
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

function determineRelativePath(logicalName: string): string {
  const normalized = logicalName.replace(/\\/g, '/').replace(/^\/+/, '');
  const lower = normalized.toLowerCase();
  if (lower.startsWith('audio/')) {
    return normalized;
  }
  if (lower.startsWith('images/')) {
    return normalized;
  }
  if (lower.startsWith('icons/')) {
    return normalized;
  }
  if (lower.startsWith('hundred/')) {
    return normalized;
  }
  if (lower.startsWith('drawable/')) {
    return normalized.replace(/^drawable\//, 'hundred/');
  }
  const segments = normalized.split('/');
  const fileName = segments[segments.length - 1];
  return `resources/${fileName}`;
}

async function collectAsset(
  manifest: AssetManifest,
  logicalName: string,
  sourceRoot: string,
): Promise<AssetManifestEntry | undefined> {
  if (!logicalName) {
    return undefined;
  }

  if (manifest.files[logicalName]) {
    return manifest.files[logicalName];
  }

  const normalized = logicalName.replace(/\\/g, '/').replace(/^\/+/, '');
  const segments = normalized.split('/');
  const fileName = segments.pop();
  if (!fileName) {
    return undefined;
  }

  let sourceRelative = normalized;
  if (normalized.startsWith('audio/')) {
    sourceRelative = normalized.slice('audio/'.length);
  } else if (normalized.startsWith('images/')) {
    sourceRelative = normalized.slice('images/'.length);
  } else if (normalized.startsWith('icons/')) {
    sourceRelative = normalized.slice('icons/'.length);
  } else if (normalized.startsWith('hundred/')) {
    sourceRelative = normalized.slice('hundred/'.length);
  } else if (normalized.startsWith('drawable/')) {
    sourceRelative = normalized.slice('drawable/'.length);
  }

  const sourcePath = path.join(sourceRoot, sourceRelative);

  try {
    const stats = await fs.stat(sourcePath);
    if (!stats.isFile()) {
      console.warn(`[convert] Asset ${logicalName} not a file at ${sourcePath}`);
      return undefined;
    }

    const relativePath = determineRelativePath(normalized);

    const entry: AssetManifestEntry = {
      logicalName,
      bytes: stats.size,
      sourcePath,
      relativePath,
    };
    manifest.files[logicalName] = entry;
    return entry;
  } catch (error) {
    console.warn(`[convert] Failed to process asset ${logicalName} from ${sourcePath}:`, error);
    return undefined;
  }
}

async function convertPhraseTopic(
  topicPath: string,
  topicIndex: number,
  manifest: AssetManifest,
  audioRoot: string,
): Promise<{ topic: TopicRecord; phrases: PhraseItemRecord[] }> {
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
      const logicalName = `audio/${germanSound}.mp3`;
      const asset = await collectAsset(manifest, logicalName, audioRoot);
      if (asset) {
        base.germanAudio = asset.relativePath;
      }
    }

    const sorbianSound = normalizeWhitespace(phraseNode.sorbianSound?.[0]);
    if (sorbianSound) {
      const logicalName = `audio/${sorbianSound}.mp3`;
      const asset = await collectAsset(manifest, logicalName, audioRoot);
      if (asset) {
        base.sorbianAudio = asset.relativePath;
      }
    }

    const infoText = normalizeWhitespace(phraseNode.infoText?.[0]);
    if (infoText) {
      base.infoText = infoText;
    }

    converted.push(base);
  }

  const topic: TopicRecord = {
    id: topicId,
    type: deriveTopicType(topicPath, 'phrases'),
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
  iconRoot: string,
): Promise<{ topic: TopicRecord; vocabulary: VocabItemRecord[] }> {
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
      const logicalName = `audio/${entry.soundSorbian}.mp3`;
      const asset = await collectAsset(manifest, logicalName, audioRoot);
      if (asset) {
        vocab.audioSorbian = asset.relativePath;
      }
    }

    if (entry.img) {
      const logicalName = `images/${entry.img}`;
      const asset = await collectAsset(manifest, logicalName, imageRoot);
      if (asset) {
        vocab.img = asset.relativePath;
      }
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
    type: deriveTopicType(topicPath, 'vocabulary'),
    nameGerman: germanName,
    nameSorbian: sorbianName,
    order: topicIndex,
  };
  if (sorbianAudio) {
    topic.audioIntroSorbian = `${sorbianAudio}.mp3`;
  }
  if (icon) {
    const logicalName = `icons/${icon}`;
    const asset = await collectAsset(manifest, logicalName, iconRoot);
    if (asset) {
      topic.icon = asset.relativePath;
    }
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
      const logicalName = `audio/${audio}.mp3`;
      const asset = await collectAsset(manifest, logicalName, audioRoot);
      if (asset) {
        record.audio = asset.relativePath;
      }
    }

    if (image) {
      const normalizedImage = image.includes('/') ? image : `hundred/${image}`;
      const asset = await collectAsset(manifest, normalizedImage, imageRoot);
      if (asset) {
        record.image = asset.relativePath;
      }
    } else {
      const fallbackNames = [
        `hundredsec_slide_${index + 1}.jpg`,
        `hundredsec_slide_${index + 1}.png`,
      ];

      for (const fileName of fallbackNames) {
        try {
          await fs.stat(path.join(imageRoot, fileName));
        } catch (error) {
          continue;
        }

        const logicalName = `hundred/${fileName}`;
        const asset = await collectAsset(manifest, logicalName, imageRoot);
        if (asset) {
          record.image = asset.relativePath;
          break;
        }
      }
    }

    result.push(record);
  }

  return result;
}

export async function convertLegacyContent(baseDir: string): Promise<LegacyConversionResult> {
  const phrasesDir = path.join(baseDir, 'phrases');
  const vocabDir = path.join(baseDir, 'vocabulary');
  const hundredFile = path.join(baseDir, 'in_hundred_seconds.xml');
  const audioRoot = path.join(baseDir, '..', 'res', 'raw');
  const vocabImageRoot = path.join(vocabDir, 'images');
  const vocabIconRoot = path.join(vocabDir, 'icons');
  const hundredImageRoot = path.join(baseDir, '..', 'res', 'drawable');

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
      vocabIconRoot,
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

  const hundredSecondsRecords = await convertHundredSeconds(hundredFile, manifest, audioRoot, hundredImageRoot);

  return {
    topics,
    vocabularyByTopic,
    phrasesByTopic,
    hundredSeconds: hundredSecondsRecords,
    assets: manifest,
  };
}
