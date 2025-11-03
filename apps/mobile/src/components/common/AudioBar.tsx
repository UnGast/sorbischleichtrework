import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import { Ionicons } from '@expo/vector-icons';
import { usePrimaryColor } from '@/hooks/usePrimaryColor';
import { withAlpha } from '@/theme/colors';

export function AudioBar() {
  const {
    isPlaying,
    positionSeconds,
    durationSeconds,
    queue,
    isAutoModeEnabled,
    togglePlay,
    seekTo,
  } = useAudioPlayback();
  const primaryColor = usePrimaryColor();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = durationSeconds > 0 ? positionSeconds / durationSeconds : 0;

  if (queue.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <Text style={styles.time}>{formatTime(positionSeconds)}</Text>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: primaryColor }]}
          />
        </View>
        <Text style={styles.time}>{formatTime(durationSeconds)}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          onPress={togglePlay}
          style={[styles.controlButton, { backgroundColor: primaryColor }]}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={24}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <View style={styles.trackInfo}>
          <Text style={styles.trackTitle} numberOfLines={1}>
            {queue[0]?.title || 'Keine Audiodatei'}
          </Text>
          <Text style={styles.trackSubtitle} numberOfLines={1}>
            {queue[0]?.subtitle || ''}
          </Text>
        </View>

        {isAutoModeEnabled && (
          <View style={[styles.autoModeIndicator, { backgroundColor: withAlpha(primaryColor, 0.2) }]}>
            <Ionicons name="repeat" size={16} color={primaryColor} />
            <Text style={[styles.autoModeText, { color: primaryColor }]}>Auto</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111827',
    borderRadius: 16,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  time: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    minWidth: 35,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#374151',
    marginHorizontal: 12,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  trackSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  autoModeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  autoModeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});
