import { spawn } from 'node:child_process';

import { activatePack } from './set-active-pack';
import { ContentPackTarget, CONTENT_PACKS, DEFAULT_PACK_ID, MOBILE_ROOT } from './contentPacks';

type BuildPlatform = 'ios' | 'android';

interface CliOptions {
  packs?: string[];
  platforms?: BuildPlatform[];
}

const DEFAULT_PLATFORMS: BuildPlatform[] = ['ios', 'android'];

function parseCliArgs(args: string[]): CliOptions {
  const options: CliOptions = {};
  args.forEach((arg) => {
    if (arg.startsWith('--packs=')) {
      const value = arg.split('=')[1] ?? '';
      options.packs = value.split(',').map((entry) => entry.trim()).filter(Boolean);
    } else if (arg.startsWith('--platforms=')) {
      const value = arg.split('=')[1] ?? '';
      const platforms = value
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry): entry is BuildPlatform => entry === 'ios' || entry === 'android');
      if (platforms.length === 0) {
        throw new Error('No valid platforms supplied. Use --platforms=ios,android');
      }
      options.platforms = platforms;
    }
  });
  return options;
}

function resolvePacks(packIds?: string[]): ContentPackTarget[] {
  if (!packIds || packIds.length === 0) {
    return CONTENT_PACKS;
  }
  return packIds.map((packId) => {
    const target = CONTENT_PACKS.find((pack) => pack.packId === packId);
    if (!target) {
      throw new Error(
        `Unknown pack "${packId}". Available packs: ${CONTENT_PACKS.map((pack) => pack.packId).join(', ')}`
      );
    }
    return target;
  });
}

function runEasBuild(platform: BuildPlatform, profile: string, pack: ContentPackTarget): Promise<void> {
  const args = ['build', '--non-interactive', '--platform', platform, '--profile', profile];
  console.log(
    `[pack-build] Starting ${platform} build for ${pack.packId} (${pack.label}) using profile "${profile}"`
  );
  return new Promise((resolve, reject) => {
    const child = spawn('eas', args, {
      cwd: MOBILE_ROOT,
      stdio: 'inherit',
      env: process.env,
    });
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`[pack-build] ${platform} build for ${pack.packId} finished successfully`);
        resolve();
      } else {
        reject(new Error(`EAS build failed for ${pack.packId} on ${platform} (exit code ${code})`));
      }
    });
    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function buildPackAcrossPlatforms(pack: ContentPackTarget, platforms: BuildPlatform[]) {
  await activatePack(pack.packId);
  for (const platform of platforms) {
    const profile = pack.buildProfiles[platform];
    if (!profile) {
      console.warn(`[pack-build] No profile configured for ${platform} on ${pack.packId}; skipping`);
      continue;
    }
    await runEasBuild(platform, profile, pack);
  }
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  const packs = resolvePacks(args.packs);
  const platforms = args.platforms ?? DEFAULT_PLATFORMS;

  console.log(
    `[pack-build] Executing builds for packs: ${packs.map((pack) => pack.packId).join(', ')} on platforms: ${platforms.join(
      ', '
    )}`
  );

  try {
    for (const pack of packs) {
      await buildPackAcrossPlatforms(pack, platforms);
    }
  } finally {
    await activatePack(DEFAULT_PACK_ID);
    console.log(`[pack-build] Reset active pack to ${DEFAULT_PACK_ID}`);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('[pack-build] Build pipeline failed', error);
    process.exit(1);
  });
}

