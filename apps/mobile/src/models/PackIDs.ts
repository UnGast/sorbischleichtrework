/* eslint-disable @typescript-eslint/no-require-imports */
/** Central place for pack identifiers */
export const MAIN_PACK_ID = 'de-hsb-pack';
export const PACK_ASSETS = {
  main: {
    archive: require('../../assets/packs/de-hsb-pack.zip'),
    hash: require('../../assets/packs/de-hsb-pack.sha256'),
  },
  devMock: {
    archive: require('../../assets/packs/mock-pack.zip'),
    hash: require('../../assets/packs/mock-pack.sha256'),
  },
};
export const MAIN_PACK_ARCHIVE = PACK_ASSETS.main.archive;
export const MAIN_PACK_HASH = PACK_ASSETS.main.hash;

export const DEV_MOCK_PACK_ID = 'mock-pack';
export const DEV_MOCK_PACK_ARCHIVE = PACK_ASSETS.devMock.archive;
export const DEV_MOCK_PACK_HASH = PACK_ASSETS.devMock.hash;

