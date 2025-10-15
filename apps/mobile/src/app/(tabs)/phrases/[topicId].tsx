import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/common/Screen';
import { usePhrasesForTopic } from '@/services/content/contentRepository';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import { useAppDispatch } from '@/store';
import { recordAction } from '@/store/slices/progressSlice';
import { AudioBar } from '@/components/common/AudioBar';

export default function PhraseTopicRoute() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const phrases = usePhrasesForTopic(topicId ?? '');
  const audioPlayback = useAudioPlayback();
  const dispatch = useAppDispatch();
  const [autoMode, setAutoMode] = useState(false);
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number | null>(null);

  const data = useMemo(() => phrases, [phrases]);

  useEffect(() => {
    if (!topicId) {
      return;
    }
    dispatch(
      recordAction({
        id: `phrase-topic-${topicId}-${Date.now()}`,
        ts: Date.now(),
        kind: 'start_topic',
        entityId: topicId,
        entityType: 'topic',
      }),
    );
  }, [dispatch, topicId]);

  const playPhrase = useCallback(
    async (phrase: any, index: number) => {
      if (!phrase.sorbianAudio && !phrase.germanAudio) return;
      const audioFile = phrase.sorbianAudio || phrase.germanAudio;
      if (!audioFile) return;

      await audioPlayback.playTrack({
        id: phrase.id,
        title: phrase.germanText,
        subtitle: phrase.sorbianText,
        url: audioFile,
      });

      dispatch(
        recordAction({
          id: `phrase-play-${phrase.id}-${Date.now()}`,
          ts: Date.now(),
          kind: 'play_audio',
          entityId: phrase.id,
          entityType: 'phrase',
        }),
      );

      console.log(`Playing phrase ${phrase.id} with audio ${audioFile}`);
      setCurrentPlayingIndex(index);
    },
    [audioPlayback, dispatch],
  );

  const startAutoMode = useCallback(() => {
    if (data.length === 0 || !topicId) {
      return;
    }
    setAutoMode(true);
    dispatch(
      recordAction({
        id: `phrase-auto-${topicId}-${Date.now()}`,
        ts: Date.now(),
        kind: 'enter_auto_mode',
        entityId: topicId,
        entityType: 'topic',
      }),
    );
    console.log('Starting auto mode for phrase topic');
  }, [data.length, dispatch, topicId]);

  const stopAutoMode = useCallback(() => {
    if (!topicId) {
      return;
    }
    setAutoMode(false);
    setCurrentPlayingIndex(null);
    dispatch(
      recordAction({
        id: `phrase-finish-${topicId}-${Date.now()}`,
        ts: Date.now(),
        kind: 'finish_topic',
        entityId: topicId,
        entityType: 'topic',
      }),
    );
    audioPlayback.togglePlay();
  }, [audioPlayback, dispatch, topicId]);

  if (data.length === 0) {
    return (
      <Screen>
        <Text style={styles.empty}>Für dieses Thema sind noch keine Phrasen hinterlegt.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Phrasen</Text>
        <TouchableOpacity
          style={[styles.modeButton, autoMode && styles.modeButtonActive]}
          onPress={autoMode ? stopAutoMode : startAutoMode}
        >
          <Text style={[styles.modeButtonText, autoMode && styles.modeButtonTextActive]}>
            {autoMode ? 'Auto Mode stoppen' : 'Auto Mode starten'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[styles.item, currentPlayingIndex === index && styles.itemPlaying]}
            onPress={() => playPhrase(item, index)}
            disabled={autoMode}
          >
            <Text style={styles.primary}>{item.germanText}</Text>
            <Text style={styles.secondary}>{item.sorbianText}</Text>
            {item.type === 'separator' ? (
              <Text style={styles.separator}>{item.germanText}</Text>
            ) : null}
            {item.infoText ? <Text style={styles.info}>{item.infoText}</Text> : null}
          </TouchableOpacity>
        )}
      />

    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  modeButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modeButtonActive: {
    backgroundColor: '#3B82F6',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
  item: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  itemPlaying: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: -1,
  },
  primary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  secondary: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  separator: {
    fontSize: 12,
    fontWeight: '500',
    color: '#059669',
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 4,
  },
  info: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 4,
  },
  empty: {
    fontSize: 16,
    color: '#6B7280',
  },
});
