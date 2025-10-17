import { Directory, File, Paths } from 'expo-file-system';
import { Asset } from 'expo-asset';
import { unzipSync } from 'fflate';
import * as Crypto from 'expo-crypto';

import { LEGACY_PACK_ARCHIVE, LEGACY_PACK_ID } from '@/models/PackIDs';

const HASH_FILENAME = '.pack-hash';

function log(message: string) {
  console.log(`[devPackBuilder] ${message}`);
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
    console.warn('[devPackBuilder] Unable to access document directory', error);
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

export async function ensureLegacyPackAvailable() {
  if (!__DEV__) {
    log('Not in dev mode; skipping pack copy');
    return;
  }

  const documentRoot = resolveDocumentRoot();
  if (!documentRoot) {
    return;
  }

  const packsDir = new Directory(documentRoot, 'packs');
  if (!packsDir.exists) {
    packsDir.create();
  }

  const packDir = new Directory(packsDir, LEGACY_PACK_ID);
  log('Attempting to resolve bundled pack archive');
  const archiveAsset = Asset.fromModule(LEGACY_PACK_ARCHIVE);
  await archiveAsset.downloadAsync();

  if (!archiveAsset.localUri) {
    console.warn('[devPackBuilder] Bundled mock pack missing. Ensure pack archive is bundled under assets/packs');
    return;
  }

  const archiveFile = new File(archiveAsset.localUri);
  const archiveBytes = await archiveFile.bytes();
  const archiveBase64 = archiveFile.base64Sync();
  const archiveHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, archiveBase64, {
    encoding: Crypto.CryptoEncoding.HEX,
  });

  const hashFile = new File(packDir, HASH_FILENAME);

  if (packDir.exists) {
    if (hashFile.exists) {
      const storedHash = hashFile.textSync().trim();
      if (storedHash === archiveHash) {
        log(`Legacy pack already extracted with matching hash ${archiveHash}`);
        return;
      }
      log(`Legacy pack hash changed (stored ${storedHash}, new ${archiveHash}); refreshing`);
    } else {
      log('Legacy pack directory exists but no hash file found; refreshing');
    }

    try {
      packDir.delete();
    } catch (error) {
      console.warn('[devPackBuilder] Failed to remove existing legacy pack directory', error);
      return;
    }
  }

  packDir.create();

  const entries = unzipSync(archiveBytes);
  const entryNames = Object.keys(entries);

  log(`Extracting ${entryNames.length} files from archive to ${packsDir.uri}`);

  entryNames.forEach((rawName) => {
    const normalized = rawName.replace(/\\/g, '/');
    if (!normalized || normalized.endsWith('/')) {
      return;
    }

    const pathSegments = normalized.split('/').filter(Boolean);

    if (pathSegments[0] === LEGACY_PACK_ID) {
      pathSegments.shift();
    }

    if (pathSegments.length === 0) {
      return;
    }

    const parentSegments = pathSegments.slice(0, -1);
    const fileName = pathSegments[pathSegments.length - 1];
    const parentDir = ensureDirectory(packDir, parentSegments);
    const outFile = new File(parentDir, fileName);
    outFile.write(entries[rawName]);
  });

  hashFile.write(archiveHash);

  log(`Legacy pack extracted to ${packDir.uri}`);
}
