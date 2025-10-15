import { useEffect, useState } from 'react';
import TrackPlayer, { State as TrackPlayerState } from 'react-native-track-player';
import { audioService, AudioTrack } from '@/services/audio/audioService';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  setAudioStatus,
  updatePosition,
  setQueue,
  setCurrentItem,
  toggleAutoMode,
} from '@/store/slices/audioSlice';

export function useAudioPlayback() {
  const dispatch = useAppDispatch();
  const audioState = useAppSelector((state) => state.audio);
  const [playerState, setPlayerState] = useState<TrackPlayerState>(TrackPlayerState.None);

  useEffect(() => {
    audioService.init();
  }, []);

  useEffect(() => {
    // For now, we'll use polling to get playback state until we fix the event listener API
    const interval = setInterval(async () => {
      try {
        const state = await TrackPlayer.getState();
        setPlayerState(state);
        const status =
          state === TrackPlayerState.Playing
            ? 'playing'
            : state === TrackPlayerState.Paused
              ? 'paused'
              : 'idle';
        dispatch(setAudioStatus(status));

        const position = await TrackPlayer.getPosition();
        const duration = await TrackPlayer.getDuration();
        dispatch(updatePosition({ positionSeconds: position, durationSeconds: duration }));
      } catch (error) {
        console.warn('Error getting playback state:', error);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [dispatch]);

  const isPlaying = playerState === TrackPlayerState.Playing;

  const playTrack = async (track: AudioTrack) => {
    await audioService.loadTrack(track);
    dispatch(setQueue([track]));
    dispatch(setCurrentItem(track.id));
    await audioService.play();
  };

  const ensureQueue = async (tracks: AudioTrack[], startIndex = 0) => {
    await audioService.setQueue(tracks, startIndex);
    dispatch(setQueue(tracks));
    dispatch(setCurrentItem(tracks[startIndex]?.id));
  };

  const togglePlay = async () => {
    if (isPlaying) {
      await audioService.pause();
      dispatch(setAudioStatus('paused'));
    } else {
      await audioService.play();
      dispatch(setAudioStatus('playing'));
    }
  };

  const seekTo = async (position: number) => {
    await audioService.seekTo(position);
  };

  const setQueueWithAutoMode = async (tracks: AudioTrack[], startIndex = 0, auto = false) => {
    await ensureQueue(tracks, startIndex);
    dispatch(toggleAutoMode(auto));
    if (auto) {
      await audioService.play();
    }
  };

  return {
    isPlaying,
    status: audioState.status,
    currentItemId: audioState.currentItemId,
    positionSeconds: audioState.positionSeconds,
    durationSeconds: audioState.durationSeconds,
    queue: audioState.queue,
    isAutoModeEnabled: audioState.isAutoModeEnabled,
    playTrack,
    ensureQueue,
    togglePlay,
    seekTo,
    setQueueWithAutoMode,
  };
}
