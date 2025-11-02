import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/common/Screen';
import { useHundredSecondsItems } from '@/services/content/contentRepository';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
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
    const isActive = playback.currentItemId === item.id;
    const isPlaying = isActive && playback.status === 'playing';
    const progress = isActive && playback.durationSeconds > 0 ? Math.min(1, playback.positionSeconds / playback.durationSeconds) : 0;
    const currentPosition = isActive ? playback.positionSeconds : 0;
    const totalDuration = isActive && playback.durationSeconds > 0 ? playback.durationSeconds : 0;

    const handlePlayPress = async () => {
      if (!item.audioUri) {
        return;
      }

      if (isActive) {
        await playback.togglePlay();
        return;
      }

      await playback.playTrack({
        id: `hundred-${item.id}`,
        title: item.name,
        url: item.audioUri,
        entityId: item.id,
      });
    };

    return (
      <View style={[styles.card, isActive && styles.cardActive]}>
        <View style={styles.cardHeader}>
          <Image source={artworkSource} style={styles.artwork} />
          <View style={styles.headerText}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.subtitle}>Kurzer Audio-Impuls · ca. 100 Sekunden</Text>
          </View>
        </View>

        <View style={styles.playerRow}>
          <TouchableOpacity
            style={[styles.playButton, isPlaying && styles.playButtonActive]}
            onPress={handlePlayPress}
            activeOpacity={0.85}
          >
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
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
  cardActive: {
    borderWidth: 2,
    borderColor: '#2563EB',
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
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  playButtonActive: {
    backgroundColor: '#2563EB',
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
    backgroundColor: '#2563EB',
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
