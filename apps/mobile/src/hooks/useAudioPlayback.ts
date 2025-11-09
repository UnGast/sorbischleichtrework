import { useCallback, useEffect, useRef, useState } from 'react';
import TrackPlayer, { Event as TrackPlayerEvent, State as TrackPlayerState } from 'react-native-track-player';
import { useTrackPlayerEvents } from 'react-native-track-player';
import { audioService, AudioTrack } from '@/services/audio/audioService';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  setAudioStatus,
  updatePosition,
  setQueue,
  setCurrentTrack,
  toggleAutoMode,
} from '@/store/slices/audioSlice';

export function useAudioPlayback() {
  const dispatch = useAppDispatch();
  const audioState = useAppSelector((state) => state.audio);
  const [playerState, setPlayerState] = useState<TrackPlayerState>(TrackPlayerState.None);
  const audioStateRef = useRef(audioState);
  const positionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    audioService.init();
  }, []);

  useEffect(() => {
    audioStateRef.current = audioState;
  }, [audioState]);

  const handlePlaybackState = useCallback(
    (event: { state: TrackPlayerState }) => {
      setPlayerState(event.state);

      const status =
        event.state === TrackPlayerState.Playing
          ? 'playing'
          : event.state === TrackPlayerState.Paused
            ? 'paused'
            : 'idle';

      dispatch(setAudioStatus(status));

      if (
        (event.state === TrackPlayerState.Stopped || event.state === TrackPlayerState.None) &&
        audioStateRef.current.currentTrackId
      ) {
        dispatch(setCurrentTrack(undefined));
      }
    },
    [dispatch],
  );

  const handleTrackChanged = useCallback(
    (event: { nextTrack?: number | null }) => {
      if (typeof event.nextTrack === 'number') {
        const nextEntry = audioStateRef.current.queue[event.nextTrack];
        if (nextEntry) {
          dispatch(setCurrentTrack(nextEntry.id));
        }
      } else {
        // Only clear current track if playback has actually stopped
        // Don't clear during normal playback transitions
        const currentState = audioStateRef.current;
        if (currentState.status === 'idle' || currentState.status === 'paused') {
          dispatch(setCurrentTrack(undefined));
        }
      }
    },
    [dispatch],
  );

  const handleQueueEnded = useCallback(() => {
    dispatch(setCurrentTrack(undefined));
  }, [dispatch]);

  useTrackPlayerEvents([TrackPlayerEvent.PlaybackState], handlePlaybackState);
  useTrackPlayerEvents([TrackPlayerEvent.PlaybackTrackChanged], handleTrackChanged);
  useTrackPlayerEvents([TrackPlayerEvent.PlaybackQueueEnded], handleQueueEnded);

  useEffect(() => {
    if (positionIntervalRef.current) {
      clearInterval(positionIntervalRef.current);
    }

    positionIntervalRef.current = setInterval(async () => {
      try {
        const [position, duration] = await Promise.all([
          TrackPlayer.getPosition(),
          TrackPlayer.getDuration(),
        ]);

        dispatch(updatePosition({ positionSeconds: position, durationSeconds: duration }));
      } catch (error) {
        console.warn('Error getting playback progress', error);
      }
    }, 500);

    return () => {
      if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current);
        positionIntervalRef.current = null;
      }
    };
  }, [dispatch]);

  const isPlaying = playerState === TrackPlayerState.Playing;

  const playTrack = async (track: AudioTrack) => {
    await audioService.loadTrack(track);
    // Set queue and current track together to avoid flicker from multiple state updates
    dispatch(setQueue([track]));
    // setQueue already sets currentItemId, so we only need to set currentTrackId
    // This avoids the double update that causes flicker
    dispatch(setCurrentTrack(track.id));
    await audioService.play();
  };

  const ensureQueue = async (tracks: AudioTrack[], startIndex = 0) => {
    await audioService.setQueue(tracks, startIndex);
    dispatch(setQueue(tracks));
    const initialTrack = tracks[startIndex];
    if (initialTrack) {
      dispatch(setCurrentTrack(initialTrack.id));
    }
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
    currentTrackId: audioState.currentTrackId,
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
