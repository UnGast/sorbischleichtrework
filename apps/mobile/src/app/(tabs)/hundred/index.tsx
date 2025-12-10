import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/common/Screen';
import { useHundredSecondsItems } from '@/services/content/contentRepository';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import { usePrimaryColor } from '@/hooks/usePrimaryColor';
import { withAlpha } from '@/theme/colors';
import type { ListRenderItemInfo } from 'react-native';

const DEFAULT_ARTWORK = require('@assets/images/Fotolia_46575927_S.jpg');

function formatTime(valueSeconds: number) {
  const mins = Math.floor(valueSeconds / 60);
  const secs = Math.floor(valueSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function HundredSecondsRoute() {
  const items = useHundredSecondsItems();
  const playback = useAudioPlayback();
  const primaryColor = usePrimaryColor();

  if (items.length === 0) {
    return (
      <Screen>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Keine Inhalte verfügbar</Text>
          <Text style={styles.emptyMessage}>
            In diesem Content-Paket sind aktuell keine Beiträge für "Sorbisch in 100 Sekunden" enthalten.
          </Text>
        </View>
      </Screen>
    );
  }

  const renderItem = ({ item }: ListRenderItemInfo<ReturnType<typeof useHundredSecondsItems>[number]>) => {
    const artworkSource = item.imageUri ? { uri: item.imageUri } : DEFAULT_ARTWORK;
    const trackId = `hundred-${item.id}`;
    // Check both currentItemId (entityId) and currentTrackId for reliable detection on both platforms
    const isActive = 
      playback.currentItemId === item.id || 
      playback.currentTrackId === trackId;
    // For UI purposes, show stop button as soon as track is active and not paused/idle
    // This ensures immediate feedback on Android where status events can be delayed
    const showStopButton = isActive && playback.status !== 'paused' && playback.status !== 'idle';
    const progress = isActive && playback.durationSeconds > 0 ? Math.min(1, playback.positionSeconds / playback.durationSeconds) : 0;
    const currentPosition = isActive ? playback.positionSeconds : 0;
    const totalDuration = isActive && playback.durationSeconds > 0 ? playback.durationSeconds : 0;

    const handlePlayPress = async () => {
      if (!item.audioUri) {
        return;
      }

      // If this track is active and playing/loading, stop it completely
      if (isActive && showStopButton) {
        await playback.stopPlayback();
        return;
      }
      
      // If this track is active but paused, resume
      if (isActive && playback.status === 'paused') {
        await playback.togglePlay();
        return;
      }

      // Start playing this track
      await playback.playTrack({
        id: `hundred-${item.id}`,
        title: item.name,
        url: item.audioUri,
        entityId: item.id,
      });
    };

    return (
      <View
        style={[
          styles.card,
          isActive && {
            borderColor: primaryColor,
            borderWidth: 2,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <Image source={artworkSource} style={styles.artwork} />
          <View style={styles.headerText}>
            <Text style={styles.title}>{item.name}</Text>
          </View>
        </View>

        <View style={styles.playerRow}>
          <TouchableOpacity
            style={[
              styles.playButton,
              { backgroundColor: primaryColor },
              showStopButton && { backgroundColor: withAlpha(primaryColor, 0.7) },
            ]}
            onPress={handlePlayPress}
            activeOpacity={0.85}
          >
            <Ionicons name={showStopButton ? 'stop' : 'play'} size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: primaryColor }]}
              />
            </View>

            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>{formatTime(currentPosition)}</Text>
              <Text style={styles.timeLabel}>{totalDuration ? formatTime(totalDuration) : ''}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Screen>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        contentInsetAdjustmentBehavior="never"
        ItemSeparatorComponent={() => <View style={styles.listGap} />}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <Text style={styles.heading}>Sorbisch in 100 Sekunden</Text>
            <Text style={styles.description}>
              Kleine Audio-Lektionen zum schnellen Auffrischen – perfekt für unterwegs oder zwischen zwei Terminen.
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingTop: 16,
    paddingBottom: 36,
    paddingHorizontal: 16,
  },
  listGap: {
    height: 8,
  },
  headerContainer: {
    paddingBottom: 12,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
  },
  description: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  artwork: {
    width: 64,
    height: 64,
    borderRadius: 18,
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: '#111827',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  progressSection: {
    flex: 1,
  },
  progressBar: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  timeRow: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    lineHeight: 24,
    color: '#6B7280',
    textAlign: 'center',
  },
});
