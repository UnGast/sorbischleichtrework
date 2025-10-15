import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/common/Screen';
import { usePhrasesForTopic, useTopicById } from '@/services/content/contentRepository';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import { useAppDispatch, useAppSelector } from '@/store';
import { recordAction } from '@/store/slices/progressSlice';

export default function PhraseTopicRoute() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const phrases = usePhrasesForTopic(topicId ?? '');
  const topic = useTopicById(topicId ?? '');
  const { playTrack, setQueueWithAutoMode, togglePlay, isPlaying, currentItemId } = useAudioPlayback();
  const primaryLanguage = useAppSelector((state) => state.settings.phrasesPrimaryLanguage);
  const dispatch = useAppDispatch();
  const [autoMode, setAutoMode] = useState(false);

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
    async (phrase: any) => {
      if (!phrase.sorbianAudio && !phrase.germanAudio) return;
      const audioFile = phrase.sorbianAudio || phrase.germanAudio;
      if (!audioFile) return;

      await playTrack({
        id: phrase.id,
        title: phrase.germanText,
        subtitle: phrase.sorbianText,
        url: audioFile,
        entityId: phrase.id,
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
    },
    [dispatch, playTrack],
  );

  const startAutoMode = useCallback(async () => {
    if (data.length === 0 || !topicId) {
      return;
    }
    setAutoMode(true);

    const tracks = data
      .flatMap((phrase) => {
        const entries = [] as {
          id: string;
          title: string;
          subtitle: string;
          url: string;
          entityId: string;
        }[];

        if (primaryLanguage === 'sb' && phrase.sorbianAudio) {
          entries.push({
            id: `${phrase.id}-sb`,
            title: phrase.sorbianText,
            subtitle: phrase.germanText,
            url: phrase.sorbianAudio,
            entityId: phrase.id,
          });
        }

        if (phrase.germanAudio) {
          entries.push({
            id: `${phrase.id}-de`,
            title: phrase.germanText,
            subtitle: phrase.sorbianText,
            url: phrase.germanAudio,
            entityId: phrase.id,
          });
        }

        if (primaryLanguage === 'de' && phrase.sorbianAudio) {
          entries.push({
            id: `${phrase.id}-sb`,
            title: phrase.sorbianText,
            subtitle: phrase.germanText,
            url: phrase.sorbianAudio,
            entityId: phrase.id,
          });
        }

        if (!entries.length && phrase.sorbianAudio) {
          entries.push({
            id: `${phrase.id}-sb`,
            title: phrase.sorbianText,
            subtitle: phrase.germanText,
            url: phrase.sorbianAudio,
            entityId: phrase.id,
          });
        }

        return entries;
      })
      .filter((track) => track.url);

    await setQueueWithAutoMode(tracks, 0, true);

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
  }, [data, dispatch, setQueueWithAutoMode, topicId]);

  const stopAutoMode = useCallback(() => {
    if (!topicId) {
      return;
    }
    setAutoMode(false);
    dispatch(
      recordAction({
        id: `phrase-finish-${topicId}-${Date.now()}`,
        ts: Date.now(),
        kind: 'finish_topic',
        entityId: topicId,
        entityType: 'topic',
      }),
    );
    if (isPlaying) {
      togglePlay();
    }
  }, [dispatch, isPlaying, togglePlay, topicId]);

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
        <Text style={styles.title}>{topic?.nameGerman || 'Phrasen'}</Text>
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
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.item, currentItemId === item.id && styles.itemPlaying]}
            onPress={() => playPhrase(item)}
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
