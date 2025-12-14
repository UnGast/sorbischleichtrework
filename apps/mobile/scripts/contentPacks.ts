import path from 'node:path';

export interface ContentPackTarget {
  packId: string;
  label: string;
  archivePath: string;
  hashPath: string;
  iosBundleIdentifier?: string;
  androidApplicationId?: string;
  buildProfiles: {
    ios: string;
    android: string;
  };
}

export const MOBILE_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(MOBILE_ROOT, '..', '..');
const PACK_SOURCE_DIR = path.join(REPO_ROOT, 'converted-packs');

function sourcePath(filename: string) {
  return path.join(PACK_SOURCE_DIR, filename);
}

export const CONTENT_PACKS: ContentPackTarget[] = [
  {
    packId: 'de-hsb-pack',
    label: 'Obersorbisch',
    archivePath: sourcePath('de-hsb-pack.zip'),
    hashPath: sourcePath('de-hsb-pack-hash.sha256'),
    iosBundleIdentifier: 'com.witaj.sorbischleicht.obersorbisch',
    androidApplicationId: 'de.witaj.sorbischesprache.beta',
    buildProfiles: {
      ios: 'testflight',
      android: 'android-internal-hsb',
    },
  },
  {
    packId: 'de-dsb-pack',
    label: 'Niedersorbisch',
    archivePath: sourcePath('de-dsb-pack.zip'),
    hashPath: sourcePath('de-dsb-pack-hash.sha256'),
    iosBundleIdentifier: 'com.witaj.sorbischleicht.niedersorbisch',
    androidApplicationId: 'de.witaj.sorbischesprache.dsb.beta',
    buildProfiles: {
      ios: 'testflight',
      android: 'android-internal-dsb',
    },
  },
  {
    packId: 'main-english-pack',
    label: 'English → Obersorbisch',
    archivePath: sourcePath('main-english-pack.zip'),
    hashPath: sourcePath('main-english-pack-hash.sha256'),
    iosBundleIdentifier: 'com.witaj.sorbianeasy.uppersorbian',
    androidApplicationId: 'de.witaj.sorbischesprache.hsb.eng.beta',
    buildProfiles: {
      ios: 'testflight',
      android: 'android-internal-eng',
    },
  },
];

export const DEFAULT_PACK_ID = CONTENT_PACKS[0]?.packId ?? 'de-hsb-pack';
export const ACTIVE_ARCHIVE_PATH = path.join(MOBILE_ROOT, 'assets', 'packs', 'active-pack.zip');
export const ACTIVE_HASH_PATH = path.join(MOBILE_ROOT, 'assets', 'packs', 'active-pack-hash.sha256');
export const PACK_SELECTION_FILE = path.join(MOBILE_ROOT, 'pack-selection.json');

export function getPackTarget(packId: string): ContentPackTarget {
  const target = CONTENT_PACKS.find((pack) => pack.packId === packId);
  if (!target) {
    throw new Error(
      `Unknown content pack "${packId}". Known packs: ${CONTENT_PACKS.map((pack) => pack.packId).join(', ')}`
    );
  }
  return target;
}

