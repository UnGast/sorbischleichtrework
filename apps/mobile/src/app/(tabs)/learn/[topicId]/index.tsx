import { useCallback, useEffect, useMemo, useState } from 'react';
import { useGlobalSearchParams, useLocalSearchParams, useRouter } from 'expo-router';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Screen } from '@/components/common/Screen';
import { useResolvedVocabularyForTopic } from '@/services/content/contentRepository';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import { useAppDispatch, useAppSelector } from '@/store';
import { setPosition, setStep } from '@/services/content/vocabularySessionSlice';
import { logProgressActivity } from '@/store/slices/progressSlice';
import { useActivePackId } from '@/hooks/useActivePackId';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;

type GlobalParams = {
  itemId?: string;
};

export default function VocabularyReadRoute() {
  const router = useRouter();
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const { itemId } = useGlobalSearchParams<GlobalParams>();
  const items = useResolvedVocabularyForTopic(topicId ?? '');
  const playback = useAudioPlayback();
  const dispatch = useAppDispatch();
  const activePackId = useActivePackId();
  const storedPosition = useAppSelector((state) => (topicId ? state.vocabularySession.positions[topicId] : 0));
  const [index, setIndex] = useState(storedPosition ?? 0);
  const translateX = useSharedValue(0);

  const orderedItems = useMemo(() => {
    if (!itemId) {
      return items;
    }
    const initialIndex = items.findIndex((entry) => entry.id === itemId);
    if (initialIndex <= 0) {
      return items;
    }
    return [items[initialIndex], ...items.filter((entry, idx) => idx !== initialIndex)];
  }, [items, itemId]);

  useEffect(() => {
    if (!topicId || !activePackId) {
      return;
    }
    void dispatch(
      logProgressActivity({
        packId: activePackId,
        id: `vocab-read-start-${topicId}-${Date.now()}`,
        ts: Date.now(),
        kind: 'start_reading',
        entityId: topicId,
        entityType: 'topic',
      }),
    );
  }, [activePackId, dispatch, topicId]);

  useEffect(() => {
    translateX.value = withTiming(-index * CARD_WIDTH, { duration: 200, easing: Easing.out(Easing.quad) });
    if (topicId) {
      dispatch(setPosition({ topicId, index }));
    }
  }, [dispatch, index, topicId, translateX]);

  const currentItem = orderedItems[index];

  const playCurrent = useCallback(async () => {
    if (!currentItem || !currentItem.audioUri) {
      return;
    }

    await playback.playTrack({
      id: currentItem.id,
      title: currentItem.textGerman,
      artist: 'Sorbian',
      url: currentItem.audioUri,
      entityId: currentItem.id,
    });
  }, [currentItem, playback]);

  const goNext = useCallback(() => {
    setIndex((prev) => Math.min(prev + 1, orderedItems.length - 1));
  }, [orderedItems.length]);

  const goPrevious = useCallback(() => {
    setIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const navigateToAssign = useCallback(() => {
    if (topicId) {
      dispatch(setStep({ topicId, step: 'assign' }));
      if (activePackId) {
        void dispatch(
          logProgressActivity({
            packId: activePackId,
            id: `vocab-assign-start-${topicId}-${Date.now()}`,
            ts: Date.now(),
            kind: 'start_assigning',
            entityId: topicId,
            entityType: 'topic',
          }),
        );
      }
    }
    router.push({ pathname: `/learn/${topicId}/assign` });
  }, [activePackId, dispatch, router, topicId]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  if (!currentItem) {
    return (
      <Screen>
        <Text style={styles.empty}>Keine Inhalte vorhanden.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.carouselContainer}>
        <Animated.View style={[styles.carousel, animatedStyle]}> 
          {orderedItems.map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.german}>{item.textGerman}</Text>
              <Text style={styles.sorbian}>{item.textSorbian}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      <View style={styles.controlsRow}>
        <TouchableOpacity onPress={goPrevious} disabled={index === 0} style={styles.secondaryButton}>
          <Text style={[styles.secondaryButtonText, index === 0 && styles.secondaryButtonDisabled]}>Zurück</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={playCurrent} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Anhören</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goNext} disabled={index === orderedItems.length - 1} style={styles.secondaryButton}>
          <Text
            style={[styles.secondaryButtonText, index === orderedItems.length - 1 && styles.secondaryButtonDisabled]}
          >
            Weiter
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={navigateToAssign} style={styles.ctaButton}>
          <Text style={styles.ctaText}>Zum Zuordnen</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  carouselContainer: {
    height: 420,
    overflow: 'hidden',
  },
  carousel: {
    flexDirection: 'row',
  },
  card: {
    width: CARD_WIDTH,
    marginHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#111827',
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  german: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  sorbian: {
    fontSize: 20,
    color: '#4B5563',
    textAlign: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonDisabled: {
    color: '#9CA3AF',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  ctaButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  empty: {
    fontSize: 16,
    color: '#6B7280',
  },
});

