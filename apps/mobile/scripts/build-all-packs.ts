import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

import { activatePack } from './set-active-pack';
import { ContentPackTarget, CONTENT_PACKS, DEFAULT_PACK_ID, MOBILE_ROOT } from './contentPacks';

type BuildPlatform = 'ios' | 'android';
type BuildMode = 'eas' | 'local';

interface CliOptions {
  packs?: string[];
  platforms?: BuildPlatform[];
  mode?: BuildMode;
}

const DEFAULT_PLATFORMS: BuildPlatform[] = ['ios', 'android'];
const DEFAULT_MODE: BuildMode = 'eas';

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
    } else if (arg === '--local' || arg === '--mode=local') {
      options.mode = 'local';
    } else if (arg === '--mode=eas') {
      options.mode = 'eas';
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

async function runEasBuild(platform: BuildPlatform, profile: string, pack: ContentPackTarget): Promise<void> {
  const buildOutputDir = path.join(
    MOBILE_ROOT,
    'build',
    'pack-builds',
    pack.packId,
    platform,
    new Date().toISOString().replace(/[:.]/g, '-')
  );
  await fs.mkdir(buildOutputDir, { recursive: true });

  const args = ['build', '--non-interactive', '--platform', platform, '--profile', profile];
  console.log(
    `[pack-build] Starting ${platform} build for ${pack.packId} (${pack.label}) using profile "${profile}". Artifacts -> ${buildOutputDir}`
  );
  return new Promise((resolve, reject) => {
    const child = spawn('eas', args, {
      cwd: MOBILE_ROOT,
      stdio: 'inherit',
      env: {
        ...process.env,
        // Ensures local builds write unique outputs per pack/platform run.
        EAS_BUILD_ARTIFACTS_DIR: buildOutputDir,
      },
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

async function runLocalAndroidBuild(pack: ContentPackTarget): Promise<void> {
  const androidProjectRoot = path.join(MOBILE_ROOT, 'android');
  const buildOutputDir = path.join(
    MOBILE_ROOT,
    'build',
    'pack-builds',
    pack.packId,
    'android',
    new Date().toISOString().replace(/[:.]/g, '-')
  );
  await fs.mkdir(buildOutputDir, { recursive: true });

  const appId = pack.androidApplicationId ?? 'de.witaj.sorbischesprache.beta';
  const gradleArgs = ['bundleRelease', `-PappIdOverride=${appId}`];

  // Respect upload keystore toggle if the user set it.
  const uploadKeyToggle = process.env.ANDROID_USE_UPLOAD_KEYSTORE;
  if (uploadKeyToggle && uploadKeyToggle.toLowerCase() === 'true') {
    gradleArgs.push('-Pandroid.useUploadKeystore=true');
  }

  console.log(
    `[pack-build] (local) Starting android build for ${pack.packId} (${pack.label}) with applicationId=${appId}. Artifacts -> ${buildOutputDir}`
  );

  await new Promise<void>((resolve, reject) => {
    const child = spawn('./gradlew', gradleArgs, {
      cwd: androidProjectRoot,
      stdio: 'inherit',
      env: process.env,
    });
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Gradle build failed for ${pack.packId} (exit code ${code})`));
      }
    });
    child.on('error', (error) => reject(error));
  });

  // Copy the generated bundle to the per-pack output folder to avoid overwrites.
  const bundleSource = path.join(
    androidProjectRoot,
    'app',
    'build',
    'outputs',
    'bundle',
    'release',
    'app-release.aab'
  );
  const bundleTarget = path.join(buildOutputDir, `app-${pack.packId}.aab`);
  await fs.copyFile(bundleSource, bundleTarget);
  console.log(`[pack-build] (local) Copied bundle to ${bundleTarget}`);
}

async function runLocalIosBuild(pack: ContentPackTarget): Promise<void> {
  if (process.platform !== 'darwin') {
    throw new Error('Local iOS builds require macOS.');
  }

  const bundleId = pack.iosBundleIdentifier ?? 'com.witaj.sorbischleicht.obersorbisch';
  const iosProjectRoot = path.join(MOBILE_ROOT, 'ios');
  const timestampedDir = path.join(
    MOBILE_ROOT,
    'build',
    'pack-builds',
    pack.packId,
    'ios',
    new Date().toISOString().replace(/[:.]/g, '-')
  );
  await fs.mkdir(timestampedDir, { recursive: true });

  const archivePath = path.join(timestampedDir, 'Sorbischleicht.xcarchive');

  const args = [
    '-workspace',
    'Sorbischleicht.xcworkspace',
    '-scheme',
    'Sorbischleicht',
    '-configuration',
    'Release',
    '-destination',
    'generic/platform=iOS',
    'archive',
    '-archivePath',
    archivePath,
    '-allowProvisioningUpdates',
    `PRODUCT_BUNDLE_IDENTIFIER=${bundleId}`,
  ];

  console.log(
    `[pack-build] (local) Starting iOS archive for ${pack.packId} (${pack.label}) with bundleId=${bundleId}. Archive -> ${archivePath}`
  );

  await new Promise<void>((resolve, reject) => {
    const child = spawn('xcodebuild', args, {
      cwd: iosProjectRoot,
      stdio: 'inherit',
      env: process.env,
    });
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`xcodebuild archive failed for ${pack.packId} (exit code ${code})`));
      }
    });
    child.on('error', (error) => reject(error));
  });

  console.log(`[pack-build] (local) Finished iOS archive for ${pack.packId} -> ${archivePath}`);
}

async function buildPackAcrossPlatforms(pack: ContentPackTarget, platforms: BuildPlatform[], mode: BuildMode) {
  await activatePack(pack.packId);
  for (const platform of platforms) {
    const profile = pack.buildProfiles[platform];
    if (!profile) {
      console.warn(`[pack-build] No profile configured for ${platform} on ${pack.packId}; skipping`);
      continue;
    }
    if (mode === 'local') {
      if (platform === 'android') {
        await runLocalAndroidBuild(pack);
      } else {
        await runLocalIosBuild(pack);
      }
    } else {
      await runEasBuild(platform, profile, pack);
    }
  }
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  const packs = resolvePacks(args.packs);
  const platforms = args.platforms ?? DEFAULT_PLATFORMS;
  const mode = args.mode ?? DEFAULT_MODE;

  console.log(
    `[pack-build] Executing ${mode} builds for packs: ${packs
      .map((pack) => pack.packId)
      .join(', ')} on platforms: ${platforms.join(', ')}`
  );

  try {
    for (const pack of packs) {
      await buildPackAcrossPlatforms(pack, platforms, mode);
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

