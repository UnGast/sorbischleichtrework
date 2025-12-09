import fs from 'node:fs/promises';

import {
  ACTIVE_ARCHIVE_PATH,
  ACTIVE_HASH_PATH,
  CONTENT_PACKS,
  DEFAULT_PACK_ID,
  getPackTarget,
  PACK_SELECTION_FILE,
} from './contentPacks';

function log(message: string) {
  console.log(`[pack-select] ${message}`);
}

export async function activatePack(packId: string): Promise<void> {
  const target = getPackTarget(packId);
  await fs.copyFile(target.archivePath, ACTIVE_ARCHIVE_PATH);
  await fs.copyFile(target.hashPath, ACTIVE_HASH_PATH);
  await fs.writeFile(PACK_SELECTION_FILE, JSON.stringify({ mainPackId: target.packId }, null, 2));
  log(`Activated ${target.packId} (${target.label})`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--list')) {
    log('Available packs:');
    CONTENT_PACKS.forEach((pack) => {
      console.log(` - ${pack.packId} (${pack.label})`);
    });
    return;
  }

  const requestedPackId = args[0] ?? DEFAULT_PACK_ID;
  await activatePack(requestedPackId);
}

if (require.main === module) {
  main().catch((error) => {
    console.error('[pack-select] Failed to activate pack', error);
    process.exit(1);
  });
}

