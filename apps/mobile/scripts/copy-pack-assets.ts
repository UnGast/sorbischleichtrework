import fs from 'node:fs';
import path from 'node:path';

const PACK_ID = process.argv[2];

if (!PACK_ID) {
  console.error('Usage: ts-node scripts/copy-pack-assets.ts <pack-id>');
  process.exit(1);
}

const ROOT = path.resolve(__dirname, '..');
const SOURCE_PACK_DIR = path.join(ROOT, 'assets', 'packs', PACK_ID);
const DEST_PACK_DIR = path.join(ROOT, 'content', 'dev', PACK_ID);

if (!fs.existsSync(SOURCE_PACK_DIR)) {
  console.error(`Pack assets not found at ${SOURCE_PACK_DIR}. Run build-mock-pack first.`);
  process.exit(1);
}

function copyDir(src: string, dest: string) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  for (const entry of fs.readdirSync(src)) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    const stats = fs.statSync(srcPath);

    if (stats.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDir(SOURCE_PACK_DIR, DEST_PACK_DIR);
console.log(`[pack-assets] Copied ${PACK_ID} pack to ${DEST_PACK_DIR}`);


