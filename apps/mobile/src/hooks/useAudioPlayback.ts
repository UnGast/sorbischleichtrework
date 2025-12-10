import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
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

const IS_IOS = Platform.OS === 'ios';
const IS_ANDROID = Platform.OS === 'android';

export function useAudioPlayback() {
  const dispatch = useAppDispatch();
  const audioState = useAppSelector((state) => state.audio);
  const [playerState, setPlayerState] = useState<TrackPlayerState>(TrackPlayerState.None);
  const audioStateRef = useRef(audioState);
  const positionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wasPlayingRef = useRef(false);
  // Debounce clearing to prevent flickering from rapid state changes
  const clearDebounceRef = useRef<NodeJS.Timeout | null>(null);
  // Track when we intentionally started playback to avoid premature clearing
  const playbackIntentRef = useRef(false);

  useEffect(() => {
    audioService.init();
  }, []);

  useEffect(() => {
    audioStateRef.current = audioState;
  }, [audioState]);

  // Helper to safely clear current track with debouncing
  const debouncedClearTrack = useCallback(() => {
    if (clearDebounceRef.current) {
      clearTimeout(clearDebounceRef.current);
    }
    clearDebounceRef.current = setTimeout(() => {
      clearDebounceRef.current = null;
      // Only clear if we're not in the middle of a playback intent
      if (!playbackIntentRef.current) {
        dispatch(setCurrentTrack(undefined));
        wasPlayingRef.current = false;
      }
    }, IS_IOS ? 300 : 100); // Longer debounce on iOS
  }, [dispatch]);

  // Cancel pending clear (used when starting new playback)
  const cancelPendingClear = useCallback(() => {
    if (clearDebounceRef.current) {
      clearTimeout(clearDebounceRef.current);
      clearDebounceRef.current = null;
    }
  }, []);

  // Single event handler for all TrackPlayer events
  useTrackPlayerEvents(TRACK_PLAYER_EVENTS, async (event) => {
    console.log('[useAudioPlayback] Event received:', event.type, event, 'platform:', Platform.OS);

    if (event.type === TrackPlayerEvent.PlaybackState) {
      const state = event.state as TrackPlayerState;
      setPlayerState(state);

      // Track if we were playing (for Ready state detection on Android)
      if (state === TrackPlayerState.Playing) {
        console.log('[useAudioPlayback] State is Playing - setting wasPlayingRef to true');
        wasPlayingRef.current = true;
        playbackIntentRef.current = false; // Clear intent once actually playing
        cancelPendingClear();
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
      
      if (isSingleTrack && currentState.currentTrackId) {
        console.log('[useAudioPlayback] Single track state check - state:', state, 'wasPlaying:', wasPlayingRef.current, 'playbackIntent:', playbackIntentRef.current);
        
        // Different end detection for iOS vs Android
        let reachedEnd = false;
        
        if (IS_ANDROID) {
          // On Android, after a track ends it often goes to Ready state
          reachedEnd =
            state === TrackPlayerState.Ended ||
            state === TrackPlayerState.Stopped ||
            state === TrackPlayerState.None ||
            (state === TrackPlayerState.Ready && wasPlayingRef.current && !playbackIntentRef.current);
          console.log('[useAudioPlayback] Android end check - reachedEnd:', reachedEnd);
        } else {
          // On iOS, only use explicit end states - don't use Ready
          reachedEnd =
            state === TrackPlayerState.Ended ||
            state === TrackPlayerState.Stopped;
          // iOS sometimes fires None briefly during loading - ignore it if we have playback intent
          if (state === TrackPlayerState.None && !playbackIntentRef.current && wasPlayingRef.current) {
            reachedEnd = true;
          }
        }

        if (reachedEnd) {
          console.log('[useAudioPlayback] Single track ended, clearing. State:', state, 'platform:', Platform.OS);
          if (IS_ANDROID) {
            // On Android, clear immediately without debounce for more reliable behavior
            wasPlayingRef.current = false;
            dispatch(setCurrentTrack(undefined));
          } else {
            debouncedClearTrack();
          }
        }
      }
    }

    if (event.type === TrackPlayerEvent.PlaybackActiveTrackChanged) {
      // This event fires when the active track changes
      // event.track is the new track, or undefined if there's no active track
      const activeEvent = event as { track?: { id: string }; index?: number };
      console.log('[useAudioPlayback] Active track changed:', activeEvent.track?.id, 'index:', activeEvent.index);

      if (activeEvent.track && typeof activeEvent.index === 'number') {
        cancelPendingClear();
        // Find the matching track in our queue by index
        const queueEntry = audioStateRef.current.queue[activeEvent.index];
        if (queueEntry) {
          console.log('[useAudioPlayback] Setting current track to:', queueEntry.id);
          dispatch(setCurrentTrack(queueEntry.id));
          wasPlayingRef.current = true;
        }
      } else if (!activeEvent.track) {
        // No active track - entire queue finished
        // On iOS, this event can fire prematurely during loading, so use debounce
        if (wasPlayingRef.current) {
          console.log('[useAudioPlayback] No active track, clearing highlight (debounced)');
          debouncedClearTrack();
          if (audioStateRef.current.isAutoModeEnabled) {
            dispatch(toggleAutoMode(false));
          }
        }
      }
    }

    if (event.type === TrackPlayerEvent.PlaybackQueueEnded) {
      console.log('[useAudioPlayback] Queue ended');
      debouncedClearTrack();
      if (audioStateRef.current.isAutoModeEnabled) {
        dispatch(toggleAutoMode(false));
      }
    }
  });

  // Track consecutive idle polls for more reliable end detection on Android
  const idleCountRef = useRef(0);

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
        
        // Skip all clearing logic if we have a playback intent pending
        if (playbackIntentRef.current) {
          idleCountRef.current = 0;
          return;
        }
        
        // For multi-track queues on Android: poll-based highlight update (Android events are unreliable)
        // On iOS, trust the events more
        // Don't update track if playback is stopped/ended - this prevents flickering after stop
        const isStoppedOrEnded = playbackState === TrackPlayerState.Stopped ||
                                 playbackState === TrackPlayerState.Ended ||
                                 playbackState === TrackPlayerState.None;
        
        if (IS_ANDROID && currentState.queue.length > 1 && typeof activeTrackIndex === 'number' && activeTrackIndex >= 0 && !isStoppedOrEnded && isPlaying) {
          const activeQueueEntry = currentState.queue[activeTrackIndex];
          if (activeQueueEntry && currentState.currentTrackId !== activeQueueEntry.id) {
            console.log('[useAudioPlayback] Poll: updating track to index', activeTrackIndex, 'id:', activeQueueEntry.id);
            cancelPendingClear();
            dispatch(setCurrentTrack(activeQueueEntry.id));
            wasPlayingRef.current = true;
            idleCountRef.current = 0;
          }
        }
        
        // Only use poll-based clearing on Android as a fallback
        // On iOS, rely on events with debouncing
        if (IS_ANDROID && currentState.currentTrackId) {
          const isNotPlaying = !isPlaying;
          const inIdleState = playbackState === TrackPlayerState.Ready || 
                             playbackState === TrackPlayerState.Paused ||
                             playbackState === TrackPlayerState.Stopped ||
                             playbackState === TrackPlayerState.None ||
                             playbackState === TrackPlayerState.Ended;
          
          // Track is finished if position is at or near duration
          const atEndPosition = duration > 0 && position >= duration - 0.5;
          const trackFinished = atEndPosition && isNotPlaying;
          
          // Log state for debugging
          if (currentState.queue.length <= 1 && isNotPlaying) {
            console.log('[useAudioPlayback] Android single track poll - state:', playbackState, 'pos:', position.toFixed(1), 'dur:', duration.toFixed(1), 'wasPlaying:', wasPlayingRef.current);
          }
          
          // Count consecutive idle/not-playing polls
          if (isNotPlaying && wasPlayingRef.current) {
            idleCountRef.current += 1;
          } else if (isPlaying) {
            idleCountRef.current = 0;
          }
          
          // For single track: clear when finished
          // More aggressive detection: if not playing and we were playing, clear after short delay
          if (currentState.queue.length <= 1) {
            const shouldClear = 
              trackFinished || 
              (inIdleState && wasPlayingRef.current) ||
              idleCountRef.current >= 2;
              
            if (shouldClear) {
              console.log('[useAudioPlayback] Android: clearing single track. idleCount:', idleCountRef.current, 'state:', playbackState, 'wasPlaying:', wasPlayingRef.current);
              idleCountRef.current = 0;
              wasPlayingRef.current = false;
              dispatch(setCurrentTrack(undefined));
            }
          }
          
          // For multi-track queue: clear when queue is exhausted
          if (currentState.queue.length > 1) {
            const queueExhausted = 
              (activeTrackIndex === null || activeTrackIndex === undefined) ||
              playbackState === TrackPlayerState.Ended ||
              playbackState === TrackPlayerState.Stopped ||
              playbackState === TrackPlayerState.None;
              
            if ((queueExhausted && isNotPlaying) || idleCountRef.current >= 2) {
              console.log('[useAudioPlayback] Android: queue ended. idleCount:', idleCountRef.current, 'state:', playbackState);
              idleCountRef.current = 0;
              wasPlayingRef.current = false;
              dispatch(setCurrentTrack(undefined));
              if (currentState.isAutoModeEnabled) {
                dispatch(toggleAutoMode(false));
              }
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
  }, [dispatch, debouncedClearTrack, cancelPendingClear]);

  const isPlaying = playerState === TrackPlayerState.Playing;

  const playTrack = useCallback(async (track: AudioTrack) => {
    // Signal that we intend to play - prevents premature clearing
    playbackIntentRef.current = true;
    cancelPendingClear();
    
    // Set queue and current track together to avoid flicker from multiple state updates
    dispatch(setQueue([track]));
    dispatch(setCurrentTrack(track.id));
    // Immediately set status to loading so UI updates right away
    dispatch(setAudioStatus('loading'));
    
    await audioService.loadTrack(track);
    await audioService.play();
    
    // Clear intent after a short delay to allow events to settle
    setTimeout(() => {
      playbackIntentRef.current = false;
    }, IS_IOS ? 500 : 200);
  }, [dispatch, cancelPendingClear]);

  const ensureQueue = useCallback(async (tracks: AudioTrack[], startIndex = 0) => {
    // Signal that we intend to play - prevents premature clearing
    playbackIntentRef.current = true;
    cancelPendingClear();
    
    dispatch(setQueue(tracks));
    const initialTrack = tracks[startIndex];
    if (initialTrack) {
      dispatch(setCurrentTrack(initialTrack.id));
    }
    
    await audioService.setQueue(tracks, startIndex);
    
    // Clear intent after a short delay
    setTimeout(() => {
      playbackIntentRef.current = false;
    }, IS_IOS ? 500 : 200);
  }, [dispatch, cancelPendingClear]);

  const togglePlay = useCallback(async () => {
    if (isPlaying) {
      await audioService.pause();
      dispatch(setAudioStatus('paused'));
    } else {
      cancelPendingClear();
      await audioService.play();
      dispatch(setAudioStatus('playing'));
    }
  }, [isPlaying, dispatch, cancelPendingClear]);

  const seekTo = useCallback(async (position: number) => {
    await audioService.seekTo(position);
  }, []);

  const setQueueWithAutoMode = useCallback(async (tracks: AudioTrack[], startIndex = 0, auto = false) => {
    await ensureQueue(tracks, startIndex);
    dispatch(toggleAutoMode(auto));
    if (auto) {
      await audioService.play();
    }
  }, [ensureQueue, dispatch]);

  const stopPlayback = useCallback(async () => {
    console.log('[useAudioPlayback] stopPlayback called');
    cancelPendingClear();
    playbackIntentRef.current = false;
    idleCountRef.current = 0;
    wasPlayingRef.current = false;
    // Immediately clear state - don't wait for events
    dispatch(setCurrentTrack(undefined));
    dispatch(setQueue([]));
    dispatch(setAudioStatus('idle'));
    dispatch(toggleAutoMode(false));
    // Stop and reset TrackPlayer to clear the active track index
    await audioService.stop();
    await TrackPlayer.reset();
  }, [dispatch, cancelPendingClear]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (clearDebounceRef.current) {
        clearTimeout(clearDebounceRef.current);
        clearDebounceRef.current = null;
      }
    };
  }, []);

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
