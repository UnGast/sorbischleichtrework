/* eslint-disable @typescript-eslint/no-require-imports */
/** Central place for pack identifiers */

const FALLBACK_PACK_ID = 'de-hsb-pack';
type PackSelection = {
  mainPackId?: string;
};

function loadPackSelection(): PackSelection {
  try {
    return require('../../pack-selection.json') as PackSelection;
  } catch (error) {
    console.warn('[PackIDs] Failed to load pack-selection.json, falling back to default', error);
    return {};
  }
}

const PACK_SELECTION = loadPackSelection();
export const MAIN_PACK_ID = PACK_SELECTION.mainPackId ?? FALLBACK_PACK_ID;
export const PACK_ASSETS = {
  main: {
    archive: require('../../assets/packs/active-pack.zip'),
    hash: require('../../assets/packs/active-pack-hash.sha256'),
  },
  devMock: {
    archive: require('../../assets/packs/mock-pack.zip'),
    hash: require('../../assets/packs/mock-pack-hash.sha256'),
  },
};
export const MAIN_PACK_ARCHIVE = PACK_ASSETS.main.archive;
export const MAIN_PACK_HASH = PACK_ASSETS.main.hash;

export const DEV_MOCK_PACK_ID = 'mock-pack';
export const DEV_MOCK_PACK_ARCHIVE = PACK_ASSETS.devMock.archive;
export const DEV_MOCK_PACK_HASH = PACK_ASSETS.devMock.hash;

