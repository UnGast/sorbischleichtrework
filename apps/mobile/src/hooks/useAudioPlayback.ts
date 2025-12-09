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
  type PlaybackStatus,
} from '@/store/slices/audioSlice';

// All events we listen to - must be a single array for Android compatibility
const TRACK_PLAYER_EVENTS = [
  TrackPlayerEvent.PlaybackState,
  TrackPlayerEvent.PlaybackActiveTrackChanged,
  TrackPlayerEvent.PlaybackQueueEnded,
];

export function useAudioPlayback() {
  const dispatch = useAppDispatch();
  const audioState = useAppSelector((state) => state.audio);
  const [playerState, setPlayerState] = useState<TrackPlayerState>(TrackPlayerState.None);
  const audioStateRef = useRef(audioState);
  const positionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wasPlayingRef = useRef(false);

  useEffect(() => {
    audioService.init();
  }, []);

  useEffect(() => {
    audioStateRef.current = audioState;
  }, [audioState]);

  // Single event handler for all TrackPlayer events
  useTrackPlayerEvents(TRACK_PLAYER_EVENTS, async (event) => {
    console.log('[useAudioPlayback] Event received:', event.type, event);

    if (event.type === TrackPlayerEvent.PlaybackState) {
      const state = event.state as TrackPlayerState;
      setPlayerState(state);

      // Track if we were playing (for Ready state detection)
      if (state === TrackPlayerState.Playing) {
        wasPlayingRef.current = true;
      }

      const status: PlaybackStatus =
        state === TrackPlayerState.Playing
          ? 'playing'
          : state === TrackPlayerState.Paused
            ? 'paused'
            : state === TrackPlayerState.Buffering
              ? 'buffering'
              : state === TrackPlayerState.Loading
                ? 'loading'
                : 'idle';

      dispatch(setAudioStatus(status));

      // For single-track playback (not auto mode), detect end of playback
      // In auto mode, let PlaybackActiveTrackChanged and PlaybackQueueEnded handle transitions
      const currentState = audioStateRef.current;
      const isSingleTrack = currentState.queue.length <= 1;
      
      if (isSingleTrack) {
        const reachedEnd =
          state === TrackPlayerState.Ended ||
          state === TrackPlayerState.Stopped ||
          state === TrackPlayerState.None ||
          // On Android, after a track ends it often goes to Ready state
          (state === TrackPlayerState.Ready && wasPlayingRef.current);

        if (reachedEnd && currentState.currentTrackId) {
          console.log('[useAudioPlayback] Single track ended, clearing. State:', state);
          wasPlayingRef.current = false;
          dispatch(setCurrentTrack(undefined));
        }
      }
    }

    if (event.type === TrackPlayerEvent.PlaybackActiveTrackChanged) {
      // This event fires when the active track changes
      // event.track is the new track, or undefined if there's no active track
      const activeEvent = event as { track?: { id: string }; index?: number };
      console.log('[useAudioPlayback] Active track changed:', activeEvent.track?.id, 'index:', activeEvent.index);

      if (activeEvent.track && typeof activeEvent.index === 'number') {
        // Find the matching track in our queue by index
        const queueEntry = audioStateRef.current.queue[activeEvent.index];
        if (queueEntry) {
          console.log('[useAudioPlayback] Setting current track to:', queueEntry.id);
          dispatch(setCurrentTrack(queueEntry.id));
          wasPlayingRef.current = true; // Reset since we're starting a new track
        }
      } else if (!activeEvent.track) {
        // No active track - entire queue finished
        console.log('[useAudioPlayback] No active track, clearing highlight');
        dispatch(setCurrentTrack(undefined));
        wasPlayingRef.current = false;
        if (audioStateRef.current.isAutoModeEnabled) {
          dispatch(toggleAutoMode(false));
        }
      }
    }

    if (event.type === TrackPlayerEvent.PlaybackQueueEnded) {
      console.log('[useAudioPlayback] Queue ended');
      dispatch(setCurrentTrack(undefined));
      wasPlayingRef.current = false;
      if (audioStateRef.current.isAutoModeEnabled) {
        dispatch(toggleAutoMode(false));
      }
    }
  });

  useEffect(() => {
    if (positionIntervalRef.current) {
      clearInterval(positionIntervalRef.current);
    }

    positionIntervalRef.current = setInterval(async () => {
      try {
        const [position, duration, state, activeTrackIndex] = await Promise.all([
          TrackPlayer.getPosition(),
          TrackPlayer.getDuration(),
          TrackPlayer.getPlaybackState(),
          TrackPlayer.getActiveTrackIndex(),
        ]);

        dispatch(updatePosition({ positionSeconds: position, durationSeconds: duration }));

        const currentState = audioStateRef.current;
        const playbackState = state.state;
        const isPlaying = playbackState === TrackPlayerState.Playing || playbackState === TrackPlayerState.Buffering;
        
        // For multi-track queues: poll-based highlight update (Android events are unreliable)
        if (currentState.queue.length > 1 && typeof activeTrackIndex === 'number' && activeTrackIndex >= 0) {
          const activeQueueEntry = currentState.queue[activeTrackIndex];
          if (activeQueueEntry && currentState.currentTrackId !== activeQueueEntry.id) {
            console.log('[useAudioPlayback] Poll: updating track to index', activeTrackIndex, 'id:', activeQueueEntry.id);
            dispatch(setCurrentTrack(activeQueueEntry.id));
            wasPlayingRef.current = true;
          }
        }
        
        // Detect end of playback
        const isNotPlaying = !isPlaying;
        const trackFinished = duration > 0 && position >= duration - 0.1 && isNotPlaying;
        
        // For single track: clear when finished
        if (currentState.queue.length <= 1 && trackFinished && currentState.currentTrackId) {
          console.log('[useAudioPlayback] Fallback: single track ended. State:', playbackState, 'pos:', position, 'dur:', duration);
          dispatch(setCurrentTrack(undefined));
          wasPlayingRef.current = false;
        }
        
        // For multi-track queue: clear when queue is exhausted (no active track or ended state)
        if (currentState.queue.length > 1) {
          const queueExhausted = 
            (activeTrackIndex === null || activeTrackIndex === undefined) ||
            playbackState === TrackPlayerState.Ended ||
            playbackState === TrackPlayerState.Stopped ||
            playbackState === TrackPlayerState.None;
            
          if (queueExhausted && currentState.currentTrackId && isNotPlaying) {
            console.log('[useAudioPlayback] Fallback: queue ended. State:', playbackState, 'activeIndex:', activeTrackIndex);
            dispatch(setCurrentTrack(undefined));
            wasPlayingRef.current = false;
            if (currentState.isAutoModeEnabled) {
              dispatch(toggleAutoMode(false));
            }
          }
        }
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

  const stopPlayback = async () => {
    console.log('[useAudioPlayback] stopPlayback called');
    await audioService.stop();
    // Immediately clear state - don't wait for events (Android event firing is unreliable)
    dispatch(setCurrentTrack(undefined));
    dispatch(setAudioStatus('idle'));
    dispatch(toggleAutoMode(false));
    wasPlayingRef.current = false;
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
    stopPlayback,
  };
}
