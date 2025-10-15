import TrackPlayer, { AppKilledPlaybackBehavior, Capability } from 'react-native-track-player';
import { packManager } from '@/services/content/packManager';

export interface AudioTrack {
  id: string;
  title: string;
  subtitle?: string;
  artist?: string;
  url: string;
  duration?: number;
  artwork?: string;
  logicalAsset?: string;
  entityId?: string;
}

class AudioService {
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (!this.initializationPromise) {
      this.initializationPromise = this.performInitialization();
    }

    await this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    let alreadySetup = false;
    try {
      try {
        await TrackPlayer.setupPlayer();
      } catch (error) {
        if (error instanceof Error && error.message.includes('already been initialized')) {
          alreadySetup = true;
        } else {
          throw error;
        }
      }

      await TrackPlayer.updateOptions({
        android: {
          appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
        },
        capabilities: [Capability.Play, Capability.Pause, Capability.SkipToNext, Capability.SkipToPrevious, Capability.Stop],
        compactCapabilities: [Capability.Play, Capability.Pause],
        progressUpdateEventInterval: 1,
      });

      this.isInitialized = true;
    } finally {
      if (!this.isInitialized && alreadySetup) {
        this.isInitialized = true;
      }
      this.initializationPromise = null;
    }
  }

  async loadTrack(track: AudioTrack): Promise<void> {
    await this.init();
    const resolved = this.resolveTrackUrl(track.url);
    await TrackPlayer.reset();
    await TrackPlayer.add({
      id: track.id,
      url: resolved,
      title: track.title,
      artist: track.artist,
      duration: track.duration,
      artwork: track.artwork,
    });
  }

  async setQueue(tracks: AudioTrack[], startIndex = 0): Promise<void> {
    await this.init();
    await TrackPlayer.reset();
    await TrackPlayer.add(
      tracks.map((track) => ({
        ...track,
        url: this.resolveTrackUrl(track.url),
      })),
    );
    if (tracks.length > 0) {
      await TrackPlayer.skip(startIndex);
    }
  }

  async play(): Promise<void> {
    await TrackPlayer.play();
  }

  async pause(): Promise<void> {
    await TrackPlayer.pause();
  }

  async stop(): Promise<void> {
    await TrackPlayer.stop();
  }

  async seekTo(positionSeconds: number): Promise<void> {
    await TrackPlayer.seekTo(positionSeconds);
  }

  async getCurrentTrackId(): Promise<number | null> {
    return await TrackPlayer.getCurrentTrack();
  }

  async getPlaybackState() {
    return TrackPlayer.getState();
  }

  private resolveTrackUrl(url: string): string {
    const resolved = packManager.resolveAssetUri(url);
    return resolved ?? url;
  }
}

export const audioService = new AudioService();
