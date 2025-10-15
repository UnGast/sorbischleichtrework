import TrackPlayer, { AppKilledPlaybackBehavior, Capability } from 'react-native-track-player';

export interface AudioTrack {
  id: string;
  title: string;
  artist?: string;
  url: string;
  duration?: number;
  artwork?: string;
}

class AudioService {
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    await TrackPlayer.setupPlayer();
    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
      },
      capabilities: [Capability.Play, Capability.Pause, Capability.SkipToNext, Capability.SkipToPrevious, Capability.Stop],
      compactCapabilities: [Capability.Play, Capability.Pause],
      progressUpdateEventInterval: 1,
    });

    this.isInitialized = true;
  }

  async loadTrack(track: AudioTrack): Promise<void> {
    await this.init();
    await TrackPlayer.reset();
    await TrackPlayer.add({
      id: track.id,
      url: track.url,
      title: track.title,
      artist: track.artist,
      duration: track.duration,
      artwork: track.artwork,
    });
  }

  async setQueue(tracks: AudioTrack[], startIndex = 0): Promise<void> {
    await this.init();
    await TrackPlayer.reset();
    await TrackPlayer.add(tracks);
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
}

export const audioService = new AudioService();
