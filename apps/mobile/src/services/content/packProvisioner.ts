import { Directory, File, Paths } from 'expo-file-system';
import { Asset } from 'expo-asset';
import { unzipSync } from 'fflate';

import {
  DEV_MOCK_PACK_ARCHIVE,
  DEV_MOCK_PACK_HASH,
  DEV_MOCK_PACK_ID,
  MAIN_PACK_ARCHIVE,
  MAIN_PACK_HASH,
  MAIN_PACK_ID,
} from '@/models/PackIDs';

const HASH_FILENAME = '.pack-hash';

function log(message: string) {
  console.log(`[packProvisioner] ${message}`);
}

function resolveDocumentRoot(): Directory | null {
  try {
    const doc = Paths.document;
    if (!doc.exists) {
      log('documentDirectory unavailable; skipping pack copy');
      return null;
    }
    return doc;
  } catch (error) {
    console.warn('[packProvisioner] Unable to access document directory', error);
    return null;
  }
}

function ensureDirectory(base: Directory, segments: string[]): Directory {
  let current = base;
  segments.forEach((segment) => {
    if (!segment) {
      return;
    }
    const next = new Directory(current, segment);
    if (!next.exists) {
      next.create();
    }
    current = next;
  });
  return current;
}

async function readHashFromAsset(assetModule: number): Promise<string | null> {
  const asset = Asset.fromModule(assetModule);
  await asset.downloadAsync();

  if (!asset.localUri) {
    return null;
  }

  const hashFile = new File(asset.localUri);
  try {
    return hashFile.textSync().trim();
  } catch (error) {
    console.warn('[packProvisioner] Failed to read hash asset', error);
    return null;
  }
}

async function extractArchive(packId: string, targetDir: Directory, archiveModule: number) {
  const asset = Asset.fromModule(archiveModule);
  await asset.downloadAsync();

  if (!asset.localUri) {
    console.warn('[packProvisioner] Bundled pack archive missing');
    return null;
  }

  const archiveFile = new File(asset.localUri);
  const archiveBytes = await archiveFile.bytes();
  const entries = unzipSync(archiveBytes);
  const entryNames = Object.keys(entries);

  log(`Extracting ${entryNames.length} files from archive to ${targetDir.uri}`);

  entryNames.forEach((rawName) => {
    const normalized = rawName.replace(/\\/g, '/');
    if (!normalized || normalized.endsWith('/')) {
      return;
    }

    const pathSegments = normalized.split('/').filter(Boolean);

    if (pathSegments[0] === packId) {
      pathSegments.shift();
    }

    if (pathSegments.length === 0) {
      return;
    }

    const parentSegments = pathSegments.slice(0, -1);
    const fileName = pathSegments[pathSegments.length - 1];
    const parentDir = ensureDirectory(targetDir, parentSegments);
    const outFile = new File(parentDir, fileName);
    outFile.write(entries[rawName]);
  });
}

async function ensurePackExtracted(packId: string, archiveModule: number, hashModule: number): Promise<boolean> {
  const documentRoot = resolveDocumentRoot();
  if (!documentRoot) {
    return false;
  }

  const packsDir = new Directory(documentRoot, 'packs');
  if (!packsDir.exists) {
    packsDir.create();
  }

  const packDir = new Directory(packsDir, packId);
  const expectedHash = await readHashFromAsset(hashModule);
  if (!expectedHash) {
    console.warn(`[packProvisioner] Missing hash asset for pack ${packId}`);
    return false;
  }

  const hashFile = new File(packDir, HASH_FILENAME);

  if (packDir.exists) {
    if (hashFile.exists) {
      const storedHash = hashFile.textSync().trim();
      if (storedHash === expectedHash) {
        log(`Pack ${packId} already extracted with matching hash ${expectedHash}`);
        return true;
      }
      log(`Pack ${packId} hash changed (stored ${storedHash}, new ${expectedHash}); refreshing`);
    } else {
      log(`Pack ${packId} directory exists but no hash file found; refreshing`);
    }

    try {
      packDir.delete();
    } catch (error) {
      console.warn(`[packProvisioner] Failed to remove existing pack directory for ${packId}`, error);
      return false;
    }
  }

  packDir.create();
  await extractArchive(packId, packDir, archiveModule);
  hashFile.write(expectedHash);
  log(`Pack ${packId} extracted to ${packDir.uri}`);
  return true;
}

export async function provisionPacks() {
  const mainOk = await ensurePackExtracted(MAIN_PACK_ID, MAIN_PACK_ARCHIVE, MAIN_PACK_HASH);
  if (mainOk) {
    return;
  }

  if (__DEV__) {
    log('Falling back to dev mock pack');
    await ensurePackExtracted(DEV_MOCK_PACK_ID, DEV_MOCK_PACK_ARCHIVE, DEV_MOCK_PACK_HASH);
  }
}

