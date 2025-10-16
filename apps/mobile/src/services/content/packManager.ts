import { Directory, File, Paths } from 'expo-file-system';
import { Asset } from 'expo-asset';
import { ModuleAvailability, Topic, VocabItem, PhraseItem, HundredSecItem } from '@/types/content';
import { mockHundredSeconds, mockPhrases, mockTopics, mockVocabulary } from './mockData';

const MOCK_AUDIO_MODULE = require('@assets/audio/mock.mp3');
const MOCK_IMAGE_MODULES: Record<string, number> = {
  'Fotolia_46575927_S.jpg': require('@assets/images/Fotolia_46575927_S.jpg'),
  'Fotolia_35730691_S.jpg': require('@assets/images/Fotolia_35730691_S.jpg'),
};

export interface PackSummary {
  packId: string;
  displayName: string;
  contentVersion: string;
  packDir: Directory;
}

interface PackManifest {
  packId: string;
  displayName: string;
  contentVersion: string;
  modules: ModuleAvailability;
}

const DEV_PACKS_DIR = new Directory(Paths.document, 'packs');
const BUNDLED_PACKS_DIR = new Directory(Paths.bundle, 'packs');

interface PackContent {
  topics: Topic[];
  vocabularyByTopic: Record<string, VocabItem[]>;
  phrasesByTopic: Record<string, PhraseItem[]>;
  hundredSeconds: HundredSecItem[];
}

async function readJsonFile<T>(file: File): Promise<T | null> {
  try {
    if (!file.exists) {
      return null;
    }
    const content = await file.text();
    return JSON.parse(content) as T;
  } catch (error) {
    console.warn(`[packManager] Failed to read JSON ${file.uri}`, error);
    return null;
  }
}

class PackManager {
  private initialized = false;
  private availablePacks: PackSummary[] = [];
  private activePack: PackSummary | null = null;

  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (__DEV__) {
      await this.ensureDummyDevPack();
    }

    const bundles = await this.readPackSummariesFromDir(BUNDLED_PACKS_DIR);
    const devPacks = await this.readPackSummariesFromDir(DEV_PACKS_DIR);
    this.availablePacks = [...bundles, ...devPacks];
    this.initialized = true;
  }

  private async ensureDummyDevPack() {
    try {
      if (!DEV_PACKS_DIR.exists) {
        DEV_PACKS_DIR.create({ intermediates: true, idempotent: true });
      }
    } catch (err) {
      console.warn('[packManager] Failed to create dev packs directory', err);
      return;
    }

    const packId = 'dev-dummy';
    const packDir = new Directory(DEV_PACKS_DIR, packId);

    try {
      if (!packDir.exists) {
        packDir.create({ intermediates: true, idempotent: true });
      }
    } catch (err) {
      console.warn('[packManager] Failed to create dummy pack directory', err);
      return;
    }

    const manifestFile = new File(packDir, 'pack.json');
    const contentFile = new File(packDir, 'content.json');
    const audioDir = new Directory(packDir, 'audio');
    const imagesDir = new Directory(packDir, 'images');

    try {
      if (!audioDir.exists) {
        audioDir.create({ intermediates: true, idempotent: true });
      }
      if (!imagesDir.exists) {
        imagesDir.create({ intermediates: true, idempotent: true });
      }
    } catch (err) {
      console.warn('[packManager] Failed to create dummy audio directory', err);
      return;
    }

    const manifest: PackManifest & { contentFile: string } = {
      packId,
      displayName: 'Dev Dummy Pack',
      contentVersion: 'dev-0.0.1',
      modules: {
        vocabulary: true,
        phrases: true,
        hundredSeconds: true,
      },
      contentFile: 'content.json',
    };

    const content: PackContent = {
      topics: mockTopics,
      vocabularyByTopic: mockVocabulary,
      phrasesByTopic: mockPhrases,
      hundredSeconds: mockHundredSeconds,
    };

    try {
      manifestFile.create({ overwrite: true });
      manifestFile.write(JSON.stringify(manifest, null, 2));
      contentFile.create({ overwrite: true });
      contentFile.write(JSON.stringify(content, null, 2));
      await this.writeMockAudioIfNeeded(audioDir);
      await this.ensureMockImages(imagesDir);
    } catch (err) {
      console.warn('[packManager] Failed to write dummy pack files', err);
    }
  }

  private async writeMockAudioIfNeeded(audioDir: Directory) {
    const targetFile = new File(audioDir, 'mock.mp3');
    if (targetFile.exists) {
      console.log('[packManager] Overwriting existing mock audio to keep dev assets fresh');
      try {
        targetFile.delete();
      } catch (err) {
        console.warn('[packManager] Failed to remove existing mock audio', err);
      }
    }

    try {
      await this.copyModuleAssetIntoFile(MOCK_AUDIO_MODULE, targetFile);
      console.log(`[packManager] Copied mock audio into ${targetFile.uri}`);
    } catch (error) {
      console.warn('[packManager] Failed to copy mock audio into dev pack', error);
    }
  }

  private async ensureMockImages(imagesDir: Directory) {
    for (const [fileName, moduleId] of Object.entries(MOCK_IMAGE_MODULES)) {
      const targetFile = new File(imagesDir, fileName);

      if (targetFile.exists) {
        try {
          targetFile.delete();
        } catch (err) {
          console.warn(`[packManager] Failed to remove existing mock image ${targetFile.uri}`, err);
        }
      }

      try {
        await this.copyModuleAssetIntoFile(moduleId, targetFile);
        console.log(`[packManager] Copied mock image ${fileName} into ${targetFile.uri}`);
      } catch (err) {
        console.warn(`[packManager] Failed to copy mock image ${fileName} into dev pack`, err);
      }
    }
  }

  private async copyModuleAssetIntoFile(moduleId: number, targetFile: File) {
    const asset = Asset.fromModule(moduleId);
    await asset.downloadAsync();
    if (!asset.localUri) {
      throw new Error('Bundled asset has no local URI after download');
    }

    const sourceFile = new File(asset.localUri);
    sourceFile.copy(targetFile);
  }

  private async ensureMockImages(imagesDir: Directory) {
    if (!BUNDLED_IMAGES_DIR.exists) {
      console.warn('[packManager] Bundled images directory missing; cannot seed dev pack images');
      return;
    }

    const bundledImages = BUNDLED_IMAGES_DIR.list().filter((entry): entry is File => entry instanceof File);

    for (const imageFile of bundledImages) {
      try {
        const targetFile = new File(imagesDir, imageFile.name ?? '');
        if (!targetFile.parent?.exists) {
          targetFile.parent?.create({ intermediates: true, idempotent: true });
        }
        imageFile.copy(targetFile);
      } catch (err) {
        console.warn(`[packManager] Failed to copy image ${imageFile.uri} into dev pack`, err);
      }
    }
  }

  async listAvailablePacks(): Promise<PackSummary[]> {
    if (!this.initialized) {
      await this.init();
    }
    return this.availablePacks;
  }

  async activatePack(packId: string): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }

    const summary = this.availablePacks.find((entry) => entry.packId === packId);
    if (summary) {
      this.activePack = summary;
    } else {
      console.warn(`[packManager] Tried to activate missing pack ${packId}`);
      this.activePack = null;
    }
  }

  async getModuleAvailability(packId: string): Promise<ModuleAvailability> {
    const manifest = await this.getPackManifest(packId);
    return (
      manifest?.modules ?? {
        vocabulary: false,
        phrases: false,
        hundredSeconds: false,
      }
    );
  }

  resolveAssetUri(logicalPath: string): string | null {
    if (!this.activePack) {
      return null;
    }

    const file = new File(this.activePack.packDir, logicalPath);
    if (!file.exists) {
      console.warn(`[packManager] Missing asset for path "${logicalPath}" (expected at ${file.uri})`);
      return null;
    }

    return file.uri;
  }

  async getPackManifest(packId: string): Promise<(PackManifest & { contentFile?: string }) | null> {
    const summary = this.availablePacks.find((entry) => entry.packId === packId);
    if (!summary) {
      return null;
    }
    const manifestFile = new File(summary.packDir, 'pack.json');
    return readJsonFile<PackManifest>(manifestFile);
  }

  async loadPackContent(packId: string): Promise<{ content: PackContent; modules: ModuleAvailability } | null> {
    const summary = this.availablePacks.find((entry) => entry.packId === packId);
    if (!summary) {
      return null;
    }

    const manifest = await this.getPackManifest(packId);
    if (!manifest) {
      return null;
    }

    const contentFilename = (manifest as { contentFile?: string }).contentFile ?? 'content.json';
    const contentFile = new File(summary.packDir, contentFilename);
    const content = await readJsonFile<PackContent>(contentFile);

    if (!content) {
      return null;
    }

    return {
      content,
      modules: manifest.modules,
    };
  }

  private async readPackSummariesFromDir(baseDir: Directory): Promise<PackSummary[]> {
    if (!baseDir.exists) {
      return [];
    }

    let entries: (File | Directory)[];
    try {
      entries = baseDir.list();
    } catch (error) {
      console.warn(`[packManager] Failed to list packs in ${baseDir.uri}`, error);
      return [];
    }

    const summaries: PackSummary[] = [];

    for (const entry of entries) {
      if (!(entry instanceof Directory)) {
        continue;
      }

      const packDir = new Directory(entry);
      const manifestFile = new File(packDir, 'pack.json');
      const manifest = await readJsonFile<PackManifest>(manifestFile);
      if (manifest) {
        summaries.push({
          packId: manifest.packId,
          displayName: manifest.displayName,
          contentVersion: manifest.contentVersion,
          packDir,
        });
      }
    }

    return summaries;
  }
}

export const packManager = new PackManager();

