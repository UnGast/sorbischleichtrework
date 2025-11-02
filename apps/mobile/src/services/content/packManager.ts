import { Directory, File, Paths } from 'expo-file-system';

import { ModuleAvailability } from '@/types/content';
import { loadPackContentFromDb, SqlitePackContent } from '@/services/content/sqlitePackLoader';
import { provisionPacks } from '@/services/content/packProvisioner';

export interface PackSummary {
  packId: string;
  displayName: string;
  contentVersion: string;
  packDir: Directory;
  modules: ModuleAvailability;
  contentFile: string;
}

interface PackManifest {
  packId: string;
  displayName: string;
  contentVersion: string;
  modules: ModuleAvailability;
  contentFile?: string;
}

function joinDirectory(base: Directory, name: string): Directory {
  return new Directory(base, name);
}

function safeDirectoryExists(dir: Directory | null): Directory | null {
  if (!dir) {
    return null;
  }
  try {
    return dir.exists ? dir : null;
  } catch (error) {
    console.warn(`[packManager] Failed to inspect directory ${dir?.uri}`, error);
    return null;
  }
}

function getBundledPacksDir(): Directory | null {
  try {
    const bundleRoot = Paths.bundle;
    if (!bundleRoot.exists) {
      return null;
    }
    return safeDirectoryExists(joinDirectory(bundleRoot, 'packs'));
  } catch (error) {
    console.warn('[packManager] Unable to access bundle directory', error);
    return null;
  }
}

function getDevPacksDir(): Directory | null {
  try {
    const documentRoot = Paths.document;
    if (!documentRoot.exists) {
      return null;
    }
    return joinDirectory(documentRoot, 'packs');
  } catch (error) {
    console.warn('[packManager] Unable to access document directory', error);
    return null;
  }
}

async function readManifest(file: File): Promise<PackManifest | null> {
  try {
    if (!file.exists) {
      return null;
    }
    return JSON.parse(await file.text()) as PackManifest;
  } catch (error) {
    console.warn(`[packManager] Failed to read manifest ${file.uri}`, error);
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

    await provisionPacks();

    const bundled = await this.readPackSummariesFromDir(getBundledPacksDir());
    const dev = await this.readPackSummariesFromDir(getDevPacksDir());
    this.availablePacks = [...bundled, ...dev];
    this.initialized = true;
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
    const summary = this.availablePacks.find((entry) => entry.packId === packId);
    return summary?.modules ?? { vocabulary: false, phrases: false, hundredSeconds: false };
  }

  resolveAssetUri(logicalPath: string): string | null {
    if (!this.activePack) {
      return null;
    }

    const assetFile = new File(this.activePack.packDir, logicalPath);
    if (!assetFile.exists) {
      console.warn(`[packManager] Missing asset for path "${logicalPath}" (expected at ${assetFile.uri})`);
      return null;
    }

    return assetFile.uri;
  }

  async loadPackContent(packId: string): Promise<{ content: SqlitePackContent; modules: ModuleAvailability } | null> {
    const summary = this.availablePacks.find((entry) => entry.packId === packId);
    if (!summary) {
      console.warn(`[packManager] Pack summary not found for ${packId}`);
      return null;
    }

    const dbFile = new File(summary.packDir, summary.contentFile);
    if (!dbFile.exists) {
      console.warn(`[packManager] Content DB missing for pack ${packId} at ${dbFile.uri}`);
      return null;
    }

    const content = await loadPackContentFromDb(dbFile.uri);
    return { content, modules: summary.modules };
  }

  private async readPackSummariesFromDir(baseDir: Directory | null): Promise<PackSummary[]> {
    if (!baseDir) {
      return [];
    }

    try {
      if (!baseDir.exists) {
        return [];
      }
    } catch (error) {
      console.warn(`[packManager] Failed to inspect directory ${baseDir.uri}`, error);
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

      const manifest = await readManifest(new File(entry, 'pack.json'));
      if (!manifest) {
        continue;
      }

      const contentFile = manifest.contentFile ?? 'content.db';
      summaries.push({
        packId: manifest.packId,
        displayName: manifest.displayName,
        contentVersion: manifest.contentVersion,
        modules: manifest.modules,
        contentFile,
        packDir: entry,
      });
    }

    return summaries;
  }
}

export const packManager = new PackManager();

