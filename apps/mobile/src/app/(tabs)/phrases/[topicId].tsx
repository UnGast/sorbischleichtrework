import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/common/Screen';
import { usePhrasesForTopic, useTopicById } from '@/services/content/contentRepository';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import { useAppDispatch, useAppSelector } from '@/store';
import { logProgressActivity } from '@/store/slices/progressSlice';
import { useActivePackId } from '@/hooks/useActivePackId';
import { usePrimaryColor } from '@/hooks/usePrimaryColor';
import { withAlpha } from '@/theme/colors';

export default function PhraseTopicRoute() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const phrases = usePhrasesForTopic(topicId ?? '');
  const topic = useTopicById(topicId ?? '');
  const { playTrack, setQueueWithAutoMode, togglePlay, isPlaying, currentItemId } = useAudioPlayback();
  const primaryLanguage = useAppSelector((state) => state.settings.phrasesPrimaryLanguage);
  const dispatch = useAppDispatch();
  const [autoMode, setAutoMode] = useState(false);
  const activePackId = useActivePackId();
  const primaryColor = usePrimaryColor();

  const data = useMemo(() => phrases, [phrases]);

  useEffect(() => {
    if (!topicId) {
      return;
    }
    if (activePackId) {
      void dispatch(
        logProgressActivity({
          packId: activePackId,
          id: `phrase-topic-${topicId}-${Date.now()}`,
          ts: Date.now(),
          kind: 'start_topic',
          entityId: topicId,
          entityType: 'topic',
        }),
      );
    }
  }, [activePackId, dispatch, topicId]);

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

      if (activePackId) {
        void dispatch(
          logProgressActivity({
            packId: activePackId,
            id: `phrase-play-${phrase.id}-${Date.now()}`,
            ts: Date.now(),
            kind: 'play_audio',
            entityId: phrase.id,
            entityType: 'phrase',
          }),
        );
      }

      console.log(`Playing phrase ${phrase.id} with audio ${audioFile}`);
    },
    [activePackId, dispatch, playTrack],
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

    if (activePackId) {
      void dispatch(
        logProgressActivity({
          packId: activePackId,
          id: `phrase-auto-${topicId}-${Date.now()}`,
          ts: Date.now(),
          kind: 'enter_auto_mode',
          entityId: topicId,
          entityType: 'topic',
        }),
      );
    }
    console.log('Starting auto mode for phrase topic');
  }, [activePackId, data, dispatch, primaryLanguage, setQueueWithAutoMode, topicId]);

  const stopAutoMode = useCallback(() => {
    if (!topicId) {
      return;
    }
    setAutoMode(false);
    if (activePackId) {
      void dispatch(
        logProgressActivity({
          packId: activePackId,
          id: `phrase-finish-${topicId}-${Date.now()}`,
          ts: Date.now(),
          kind: 'finish_topic',
          entityId: topicId,
          entityType: 'topic',
        }),
      );
    }
    if (isPlaying) {
      togglePlay();
    }
  }, [activePackId, dispatch, isPlaying, togglePlay, topicId]);

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
      </View>

      <TouchableOpacity
        style={[
          styles.modeButton,
          autoMode && { backgroundColor: primaryColor },
        ]}
        onPress={autoMode ? stopAutoMode : startAutoMode}
      >
        <Text
          style={[
            styles.modeButtonText,
            autoMode && { color: '#FFFFFF' },
            !autoMode && { color: primaryColor },
          ]}
        >
          {autoMode ? 'Auto Mode stoppen' : 'Auto Mode starten'}
        </Text>
      </TouchableOpacity>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        contentInsetAdjustmentBehavior="never"
        renderItem={({ item }) => {
          const isSeparator = item.type === 'separator';
          const sorbianLine = item.sorbianText?.trim().length ? item.sorbianText : item.germanText;
          const hasTranslationLine =
            !!item.germanText?.trim().length && item.germanText.trim() !== sorbianLine?.trim();

          return (
          <TouchableOpacity
              style={[
                styles.item,
                currentItemId === item.id && {
                  borderColor: primaryColor,
                  borderWidth: 1,
                  backgroundColor: withAlpha(primaryColor, 0.08),
                },
              ]}
            onPress={() => playPhrase(item)}
            disabled={autoMode}
          >
              {!isSeparator && sorbianLine ? <Text style={styles.primary}>{sorbianLine}</Text> : null}
              {!isSeparator && hasTranslationLine ? <Text style={styles.secondary}>{item.germanText}</Text> : null}
              {isSeparator ? <Text style={[styles.separator, { color: primaryColor }]}>{item.germanText}</Text> : null}
            {item.infoText ? <Text style={styles.info}>{item.infoText}</Text> : null}
          </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={styles.emptyList}>Keine Phrasen verfügbar.</Text>}
        showsVerticalScrollIndicator={false}
      />

    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 16,
    paddingBottom: 12,
    marginBottom: 12,
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
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  item: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
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
  listContent: {
    paddingTop: 12,
    paddingBottom: 24,
  },
  emptyList: {
    paddingVertical: 24,
    textAlign: 'center',
    color: '#6B7280',
  },
  empty: {
    fontSize: 16,
    color: '#6B7280',
  },
});
